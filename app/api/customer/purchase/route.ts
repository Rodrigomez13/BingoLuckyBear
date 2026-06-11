import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateBingoNumbers } from '@/lib/bingo'
import { getPurchaseAvailability, syncRaffleLifecycle } from '@/lib/raffle-lifecycle'
import { nanoid } from 'nanoid'

function clean(value: unknown) {
  return String(value ?? '').trim()
}

function normalizeQuantity(value: unknown) {
  const quantity = Number(value ?? 1)
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= 10 ? quantity : null
}

function isProfileComplete(profile: Record<string, unknown> | null) {
  if (!profile) return false
  return Boolean(
    clean(profile.full_name) &&
    clean(profile.dni) &&
    clean(profile.address) &&
    clean(profile.phone) &&
    clean(profile.email) &&
    clean(profile.payout_account_kind) &&
    clean(profile.payout_account) &&
    clean(profile.payout_holder_name)
  )
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Para comprar cartones primero tenes que ingresar con tu cuenta.' }, { status: 401 })
    }

    const body = await request.json()
    const raffleId = clean(body.raffle_id)
    const paymentReceiptUrl = clean(body.payment_receipt_url)
    const paymentMethod = clean(body.payment_method)
    const paymentReference = clean(body.payment_reference)
    const sessionToken = clean(body.session_token)
    const quantity = normalizeQuantity(body.quantity)

    if (!raffleId || !paymentReceiptUrl || !paymentMethod || !paymentReference || !sessionToken) {
      return NextResponse.json({ error: 'Faltan datos de la compra o del comprobante.' }, { status: 400 })
    }

    if (!quantity) {
      return NextResponse.json({ error: 'La cantidad de cartones debe ser entre 1 y 10.' }, { status: 400 })
    }

    if (!/^[a-zA-Z0-9 .:_-]{4,60}$/.test(paymentReference)) {
      return NextResponse.json({ error: 'El numero de operacion debe tener entre 4 y 60 caracteres validos.' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()
    const { data: profile, error: profileError } = await serviceClient
      .from('customer_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      return NextResponse.json({ error: 'No se pudo leer tu perfil.' }, { status: 500 })
    }

    if (!isProfileComplete(profile)) {
      return NextResponse.json({ error: 'Completa tus datos de jugador antes de comprar cartones.' }, { status: 409 })
    }

    const { data: raffle, error: raffleError } = await serviceClient
      .from('raffles')
      .select('id, name, is_active, draw_date, draw_status, draw_started_at, drawn_numbers, prize, additional_prizes')
      .eq('id', raffleId)
      .eq('is_active', true)
      .single()

    if (raffleError || !raffle) {
      return NextResponse.json({ error: 'El sorteo no esta disponible.' }, { status: 400 })
    }

    const syncedRaffle = await syncRaffleLifecycle(serviceClient, raffle)
    const availability = getPurchaseAvailability(syncedRaffle)

    if (!syncedRaffle.is_active || !availability.canPurchase) {
      const messages = {
        cutoff: 'La venta de cartones cierra 30 minutos antes del sorteo.',
        running: 'El sorteo ya esta en curso y no permite nuevas compras.',
        closed: 'El sorteo ya esta cerrado.',
        missing_date: 'El sorteo todavia no tiene fecha confirmada.',
      } as const
      return NextResponse.json({ error: messages[availability.reason ?? 'closed'] }, { status: 409 })
    }

    const seenCards = new Set<string>()
    const cardsToInsert = Array.from({ length: quantity }, () => {
      let bingoNumbers = generateBingoNumbers()
      let signature = JSON.stringify(bingoNumbers)

      while (seenCards.has(signature)) {
        bingoNumbers = generateBingoNumbers()
        signature = JSON.stringify(bingoNumbers)
      }

      seenCards.add(signature)

      return {
        card_number: `LBB-${nanoid(8).toUpperCase()}`,
        raffle_id: raffleId,
        customer_id: user.id,
        full_name: clean(profile.full_name),
        dni: clean(profile.dni),
        address: clean(profile.address),
        phone: clean(profile.phone),
        email: clean(profile.email || user.email).toLowerCase(),
        payment_receipt_url: paymentReceiptUrl,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        payout_account_kind: clean(profile.payout_account_kind),
        payout_account: clean(profile.payout_account),
        payout_holder_name: clean(profile.payout_holder_name),
        session_token: sessionToken,
        bingo_numbers: bingoNumbers,
        payment_status: 'pending',
      }
    })

    const { data: cards, error: insertError } = await serviceClient
      .from('bingo_cards')
      .insert(cardsToInsert)
      .select()

    if (insertError) {
      console.error('Customer purchase insert error:', insertError)
      return NextResponse.json({ error: 'Error al crear los cartones.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      quantity,
      status: 'pending',
      message: 'Recibimos tu compra. Tus cartones quedan pendientes hasta aprobar el comprobante.',
      cards: cards ?? [],
    })
  } catch (error) {
    console.error('Customer purchase error:', error)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
