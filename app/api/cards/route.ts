import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateBingoNumbers } from '@/lib/bingo'
import { getPurchaseAvailability, syncRaffleLifecycle } from '@/lib/raffle-lifecycle'
import { isReasonablePhone, normalizePhoneNumber } from '@/lib/phone'
import { createGamePurchase, createPaymentDeposit } from '@/lib/economy/server'
import { nanoid } from 'nanoid'

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function hasReasonableLength(value: string, min: number, max: number) {
  const length = value.trim().length
  return length >= min && length <= max
}

function normalizeQuantity(value: unknown) {
  const quantity = Number(value ?? 1)
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= 10 ? quantity : null
}

async function createEconomyTrace(input: {
  supabase: Awaited<ReturnType<typeof createServiceClient>>
  email: string
  quantity: number
  amount: number | null
  paymentMethod: string
  paymentReference: string
  paymentReceiptUrl: string
  raffleId: string
  raffleName: string
}) {
  try {
    const deposit = await createPaymentDeposit(input.supabase, {
      customerEmail: input.email,
      amount: input.amount ?? 1,
      walletKind: 'general',
      paymentMethod: input.paymentMethod,
      paymentReference: input.paymentReference,
      receiptUrl: input.paymentReceiptUrl,
      metadata: {
        source: 'guest_bingo_purchase_legacy_receipt',
        raffleId: input.raffleId,
        raffleName: input.raffleName,
        quantity: input.quantity,
      },
    })

    const purchase = await createGamePurchase(input.supabase, {
      gameType: 'bingo',
      purchaseType: 'bingo_card',
      walletKind: 'general',
      amount: input.amount ?? 0,
      quantity: input.quantity,
      status: 'pending',
      depositId: deposit.id,
      relatedType: 'raffle',
      relatedId: input.raffleId,
      description: `Compra invitado de ${input.quantity} carton${input.quantity === 1 ? '' : 'es'} para ${input.raffleName}`,
      metadata: {
        source: 'guest_participation_form',
        email: input.email,
        paymentReference: input.paymentReference,
      },
    })

    return { depositId: deposit.id as string, purchaseId: purchase.id as string }
  } catch (error) {
    console.warn('Economy trace skipped for guest purchase:', error)
    return { depositId: null, purchaseId: null }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      raffle_id,
      full_name,
      dni,
      address,
      phone,
      email,
      payment_receipt_url,
      payment_method,
      payment_reference,
      payout_account_kind,
      payout_account,
      payout_holder_name,
      quantity: requestedQuantity,
      session_token,
    } = body
    const quantity = normalizeQuantity(requestedQuantity)
    const normalizedPhone = normalizePhoneNumber(phone)

    if (!raffle_id || !full_name || !dni || !address || !phone || !email || !payment_receipt_url || !session_token) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    if (!payment_method || !payment_reference) {
      return NextResponse.json({ error: 'Indica el metodo de pago y el numero de operacion del comprobante' }, { status: 400 })
    }

    if (!payout_account_kind || !payout_account || !payout_holder_name) {
      return NextResponse.json({ error: 'Indica la cuenta donde queres recibir el pago del premio' }, { status: 400 })
    }

    if (!quantity) {
      return NextResponse.json({ error: 'La cantidad de cartones debe ser entre 1 y 10' }, { status: 400 })
    }

    if (
      !hasReasonableLength(full_name, 3, 120) ||
      !hasReasonableLength(address, 6, 180) ||
      !isReasonablePhone(normalizedPhone) ||
      !hasReasonableLength(dni, 6, 20)
    ) {
      return NextResponse.json({ error: 'Revisa nombre, DNI, direccion y telefono. Hay datos incompletos o demasiado largos.' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Ingresa un correo electronico valido' }, { status: 400 })
    }

    if (!/^[a-zA-Z0-9 .:_-]{4,60}$/.test(payment_reference.trim())) {
      return NextResponse.json({ error: 'El numero de operacion debe tener entre 4 y 60 caracteres validos' }, { status: 400 })
    }

    if (!['Alias', 'CBU', 'CVU'].includes(String(payout_account_kind))) {
      return NextResponse.json({ error: 'Selecciona un tipo de cuenta valido' }, { status: 400 })
    }

    if (!hasReasonableLength(payout_account, 5, 80) || !hasReasonableLength(payout_holder_name, 3, 120)) {
      return NextResponse.json({ error: 'Revisa alias/CBU/CVU y titular de la cuenta de cobro' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    const { data: raffle, error: raffleError } = await supabase
      .from('raffles')
      .select('id, name, is_active, draw_date, draw_status, draw_started_at, drawn_numbers, prize, additional_prizes, card_price')
      .eq('id', raffle_id)
      .eq('is_active', true)
      .single()

    if (raffleError || !raffle) {
      return NextResponse.json({ error: 'El sorteo no esta disponible' }, { status: 400 })
    }

    const syncedRaffle = await syncRaffleLifecycle(supabase, raffle)
    const purchaseAvailability = getPurchaseAvailability(syncedRaffle)

    if (!syncedRaffle.is_active || !purchaseAvailability.canPurchase) {
      const messages = {
        cutoff: 'La venta de cartones cierra una hora antes del sorteo',
        running: 'El sorteo ya esta en curso y no permite nuevas compras',
        closed: 'El sorteo ya esta cerrado',
        missing_date: 'El sorteo todavia no tiene fecha confirmada',
      } as const
      return NextResponse.json({ error: messages[purchaseAvailability.reason ?? 'closed'] }, { status: 409 })
    }

    const cardPrice = Math.trunc(Number(syncedRaffle.card_price ?? 0))
    if (!Number.isFinite(cardPrice) || cardPrice <= 0) {
      return NextResponse.json({ error: 'Este sorteo todavía no tiene un precio numérico por cartón' }, { status: 409 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const economy = await createEconomyTrace({
      supabase,
      email: normalizedEmail,
      quantity,
      amount: cardPrice * quantity,
      paymentMethod: payment_method,
      paymentReference: payment_reference.trim(),
      paymentReceiptUrl: payment_receipt_url,
      raffleId: raffle_id,
      raffleName: raffle.name,
    })

    const buyerSnapshot = {
      full_name: full_name.trim(),
      dni: dni.trim(),
      address: address.trim(),
      phone: normalizedPhone,
      email: normalizedEmail,
      payout_account_kind,
      payout_account: payout_account.trim(),
      payout_holder_name: payout_holder_name.trim(),
    }

    const seenCards = new Set<string>()
    const cardsToInsert = Array.from({ length: quantity }, () => {
      let bingo_numbers = generateBingoNumbers()
      let signature = JSON.stringify(bingo_numbers)

      while (seenCards.has(signature)) {
        bingo_numbers = generateBingoNumbers()
        signature = JSON.stringify(bingo_numbers)
      }

      seenCards.add(signature)

      return {
        card_number: `LBB-${nanoid(8).toUpperCase()}`,
        raffle_id,
        purchase_id: economy.purchaseId,
        deposit_id: economy.depositId,
        card_status: 'reserved',
        generated_seed: nanoid(14),
        buyer_snapshot: buyerSnapshot,
        full_name: buyerSnapshot.full_name,
        dni: buyerSnapshot.dni,
        address: buyerSnapshot.address,
        phone: buyerSnapshot.phone,
        email: buyerSnapshot.email,
        payment_receipt_url,
        payment_method,
        payment_reference: payment_reference.trim(),
        receipt_amount: cardPrice,
        payout_account_kind,
        payout_account: buyerSnapshot.payout_account,
        payout_holder_name: buyerSnapshot.payout_holder_name,
        session_token,
        bingo_numbers,
      }
    })

    let { data: cards, error: insertError } = await supabase.from('bingo_cards').insert(cardsToInsert).select()

    if (insertError && /(purchase_id|deposit_id|user_id|card_status|buyer_snapshot|generated_seed)/i.test(insertError.message)) {
      const legacyPayload = cardsToInsert.map(({ purchase_id, deposit_id, card_status, generated_seed, buyer_snapshot, ...card }) => card)
      const fallback = await supabase.from('bingo_cards').insert(legacyPayload).select()
      cards = fallback.data
      insertError = fallback.error
    }

    if (insertError && /payment_(method|reference)/i.test(insertError.message)) {
      const fallbackPayload = cardsToInsert.map((card) => ({
        card_number: card.card_number,
        raffle_id: card.raffle_id,
        full_name: card.full_name,
        dni: card.dni,
        address: card.address,
        phone: card.phone,
        email: card.email,
        payment_receipt_url: card.payment_receipt_url,
        session_token: card.session_token,
        bingo_numbers: card.bingo_numbers,
      }))
      const fallback = await supabase.from('bingo_cards').insert(fallbackPayload).select()
      cards = fallback.data
      insertError = fallback.error
    }

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Error al crear el carton' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      quantity,
      deposit_id: economy.depositId,
      purchase_id: economy.purchaseId,
      cards: cards ?? [],
      card_number: cards?.[0]?.card_number,
      card_id: cards?.[0]?.id,
      bingo_numbers: cards?.[0]?.bingo_numbers,
    })
  } catch (error) {
    console.error('Error creating card:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
