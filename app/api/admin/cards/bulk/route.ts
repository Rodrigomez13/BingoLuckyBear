import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isReasonablePhone, normalizePhoneNumber } from '@/lib/phone'

type PaymentStatus = 'pending' | 'approved' | 'rejected'

interface CardAccessRecord {
  id: string
  raffle_id: string
}

interface ClientUpdatePayload {
  full_name?: string
  dni?: string
  address?: string
  phone?: string
  email?: string
  payout_account_kind?: string
  payout_account?: string
  payout_holder_name?: string
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? [...new Set(value.map(String).map((item) => item.trim()).filter(Boolean))]
    : []
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return value === 'pending' || value === 'approved' || value === 'rejected'
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function getOwnedCards(cardIds: string[], userId: string) {
  const supabase = await createServiceClient()
  const { data: cards, error: cardsError } = await supabase
    .from('bingo_cards')
    .select('id, raffle_id')
    .in('id', cardIds)
    .returns<CardAccessRecord[]>()

  if (cardsError) throw cardsError
  if (!cards || cards.length !== cardIds.length) {
    throw new Error('Algunos cartones no existen o no se pudieron leer')
  }

  const raffleIds = [...new Set(cards.map((card) => card.raffle_id))]
  const { data: raffles, error: rafflesError } = await supabase
    .from('raffles')
    .select('id')
    .eq('admin_id', userId)
    .in('id', raffleIds)

  if (rafflesError) throw rafflesError

  const ownedRaffleIds = new Set((raffles ?? []).map((raffle) => raffle.id))
  if (cards.some((card) => !ownedRaffleIds.has(card.raffle_id))) {
    throw new Error('No autorizado')
  }

  return supabase
}

export async function POST(request: Request) {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const action = String(body.action ?? '')
    const cardIds = asStringArray(body.cardIds)

    if (cardIds.length === 0) {
      return NextResponse.json({ error: 'Selecciona al menos un carton' }, { status: 400 })
    }

    const supabase = await getOwnedCards(cardIds, user.id)

    if (action === 'set_payment_status') {
      if (!isPaymentStatus(body.payment_status)) {
        return NextResponse.json({ error: 'Estado invalido' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('bingo_cards')
        .update({
          payment_status: body.payment_status,
          payment_reviewed_at: new Date().toISOString(),
          payment_reviewed_by: user.id,
        })
        .in('id', cardIds)
        .select('*')

      if (error) throw error
      return NextResponse.json({ cards: data ?? [] })
    }

    if (action === 'update_client') {
      const client = (typeof body.client === 'object' && body.client ? body.client : {}) as ClientUpdatePayload
      const fullName = String(client.full_name ?? '').trim()
      const dni = String(client.dni ?? '').trim()
      const address = String(client.address ?? '').trim()
      const phone = normalizePhoneNumber(client.phone)
      const email = String(client.email ?? '').trim().toLowerCase()
      const payoutAccountKind = String(client.payout_account_kind ?? '').trim()
      const payoutAccount = String(client.payout_account ?? '').trim()
      const payoutHolderName = String(client.payout_holder_name ?? '').trim()

      if (fullName.length < 3 || dni.length < 6 || address.length < 6 || !isReasonablePhone(phone) || !isValidEmail(email)) {
        return NextResponse.json({ error: 'Revisa nombre, DNI, direccion, telefono y email' }, { status: 400 })
      }

      if (payoutAccountKind && !['Alias', 'CBU', 'CVU'].includes(payoutAccountKind)) {
        return NextResponse.json({ error: 'Tipo de cuenta de premio invalido' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('bingo_cards')
        .update({
          full_name: fullName,
          dni,
          address,
          phone,
          email,
          payout_account_kind: payoutAccountKind || null,
          payout_account: payoutAccount || null,
          payout_holder_name: payoutHolderName || null,
        })
        .in('id', cardIds)
        .select('*')

      if (error) throw error
      return NextResponse.json({ cards: data ?? [] })
    }

    return NextResponse.json({ error: 'Accion invalida' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo aplicar la accion masiva'
    const status = message === 'No autorizado' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
