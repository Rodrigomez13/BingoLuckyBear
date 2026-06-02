import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { normalizePrizeAmounts } from '@/lib/bingo'

function cleanTextItems(items: unknown) {
  return Array.isArray(items) ? items.map((item) => String(item).trim()).filter(Boolean) : []
}

export async function POST(request: Request) {
  try {
    const authClient = await createClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const name = String(body.name ?? '').trim()
    const description = String(body.description ?? '').trim()
    const amount = String(body.amount ?? '').trim()
    const drawDate = String(body.draw_date ?? '').trim()
    const paymentAccountId = String(body.payment_account_id ?? '').trim()
    const sortedPrizes = normalizePrizeAmounts(cleanTextItems(body.prizes))

    if (!name) {
      return NextResponse.json({ error: 'Carga el nombre del sorteo' }, { status: 400 })
    }

    if (sortedPrizes.length !== 3) {
      return NextResponse.json({ error: 'Carga los 3 montos de premios' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    if (paymentAccountId) {
      const { data: account, error: accountError } = await supabase
        .from('payment_accounts')
        .select('id')
        .eq('id', paymentAccountId)
        .eq('admin_id', user.id)
        .single()

      if (accountError || !account) {
        return NextResponse.json({ error: 'Selecciona una cuenta de cobro valida' }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from('raffles')
      .insert({
        name,
        description: description || null,
        prize: sortedPrizes[0],
        additional_prizes: [sortedPrizes[1], sortedPrizes[2]],
        amount: amount || null,
        bundle_offers: cleanTextItems(body.bundle_offers),
        draw_date: drawDate || null,
        payment_account_id: paymentAccountId || null,
        admin_id: user.id,
        is_active: false,
      })
      .select('*, bingo_cards(count)')
      .single()

    if (error) {
      const isMissingColumn = /schema cache|column|additional_prizes|bundle_offers|draw_date|prize|amount/i.test(error.message)
      return NextResponse.json(
        {
          error: isMissingColumn
            ? 'Supabase rechazo el guardado. Aplica supabase-raffle-details-migration.sql en tu proyecto y vuelve a intentar.'
            : error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ raffle: data })
  } catch (error) {
    console.error('Error creating raffle:', error)
    return NextResponse.json({ error: 'Error interno al crear el sorteo' }, { status: 500 })
  }
}
