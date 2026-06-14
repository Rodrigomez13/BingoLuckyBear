import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateBingoNumbers, getRaffleCardPrice } from '@/lib/bingo'
import { getPurchaseAvailability, syncRaffleLifecycle } from '@/lib/raffle-lifecycle'
import { createGamePurchase, createPaymentDeposit, purchaseCardsWithWallet } from '@/lib/economy/server'
import { getWalletSnapshot } from '@/lib/wallet/server'
import type { WalletKind } from '@/lib/economy/types'
import { nanoid } from 'nanoid'

function isWalletKind(value: unknown): value is WalletKind {
  return value === 'bonus_points' || value === 'cash_credits'
}

function clean(value: unknown) {
  return String(value ?? '').trim()
}

function normalizeQuantity(value: unknown) {
  const quantity = Number(value ?? 1)
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= 10 ? quantity : null
}

function normalizeAmount(value: unknown) {
  const amount = Math.trunc(Number(value ?? 0))
  return Number.isFinite(amount) && amount > 0 ? amount : null
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

async function createEconomyTrace(input: {
  serviceClient: Awaited<ReturnType<typeof createServiceClient>>
  userId: string
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
    const deposit = await createPaymentDeposit(input.serviceClient, {
      userId: input.userId,
      customerEmail: input.email,
      amount: input.amount ?? 1,
      walletKind: 'cash_credits',
      paymentMethod: input.paymentMethod,
      paymentReference: input.paymentReference,
      receiptUrl: input.paymentReceiptUrl,
      metadata: {
        source: 'account_bingo_purchase_legacy_receipt',
        raffleId: input.raffleId,
        raffleName: input.raffleName,
        quantity: input.quantity,
      },
    })

    const purchase = await createGamePurchase(input.serviceClient, {
      userId: input.userId,
      gameType: 'bingo',
      purchaseType: 'bingo_card',
      walletKind: 'cash_credits',
      amount: input.amount ?? 0,
      quantity: input.quantity,
      status: 'pending',
      depositId: deposit.id,
      relatedType: 'raffle',
      relatedId: input.raffleId,
      description: `Compra de ${input.quantity} carton${input.quantity === 1 ? '' : 'es'} para ${input.raffleName}`,
      metadata: {
        source: 'account_purchase_form',
        paymentReference: input.paymentReference,
      },
    })

    return { depositId: deposit.id as string, purchaseId: purchase.id as string }
  } catch (error) {
    console.warn('Economy trace skipped for account purchase:', error)
    return { depositId: null, purchaseId: null }
  }
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
    const paymentMode = body.payment_mode === 'wallet' ? 'wallet' : 'receipt'
    const raffleId = clean(body.raffle_id)
    const paymentReceiptUrl = clean(body.payment_receipt_url)
    const paymentMethod = clean(body.payment_method)
    const paymentReference = clean(body.payment_reference)
    const sessionToken = clean(body.session_token)
    const quantity = normalizeQuantity(body.quantity)
    const receiptAmount = normalizeAmount(body.receipt_amount ?? body.amount)
    const walletKind: WalletKind = isWalletKind(body.wallet_kind) ? body.wallet_kind : 'cash_credits'

    if (!raffleId || !sessionToken) {
      return NextResponse.json({ error: 'Faltan datos de la compra.' }, { status: 400 })
    }

    if (!quantity) {
      return NextResponse.json({ error: 'La cantidad de cartones debe ser entre 1 y 10.' }, { status: 400 })
    }

    if (paymentMode === 'receipt') {
      if (!paymentReceiptUrl || !paymentMethod || !paymentReference) {
        return NextResponse.json({ error: 'Faltan datos del comprobante.' }, { status: 400 })
      }

      if (!/^[a-zA-Z0-9 .:_-]{4,60}$/.test(paymentReference)) {
        return NextResponse.json({ error: 'El numero de operacion debe tener entre 4 y 60 caracteres validos.' }, { status: 400 })
      }
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
      .select('*')
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

    const email = clean(profile.email || user.email).toLowerCase()

    let economy: { depositId: string | null; purchaseId: string | null } = { depositId: null, purchaseId: null }
    let cardStatus: 'reserved' | 'active' = 'reserved'
    let paymentStatus: 'pending' | 'approved' = 'pending'
    let walletBalanceAfter: number | null = null
    let cardPaymentMethod = paymentMethod
    let cardPaymentReference = paymentReference
    let cardReceiptUrl = paymentReceiptUrl

    if (paymentMode === 'wallet') {
      const unitPrice = getRaffleCardPrice(raffle)
      if (!unitPrice) {
        return NextResponse.json({ error: 'Este sorteo no tiene un precio de carton configurado para comprar con saldo.' }, { status: 409 })
      }

      const totalPrice = unitPrice * quantity
      const snapshot = await getWalletSnapshot(serviceClient, user.id)
      const available = walletKind === 'bonus_points' ? Number(snapshot.bonus_points_balance ?? 0) : Number(snapshot.cash_credits_balance ?? 0)

      if (available < totalPrice) {
        const walletLabel = walletKind === 'bonus_points' ? 'LBB Points' : 'creditos cash'
        return NextResponse.json({ error: `Saldo insuficiente. Necesitas ${totalPrice} ${walletLabel} y tenes ${available}.` }, { status: 409 })
      }

      try {
        const result = await purchaseCardsWithWallet(serviceClient, {
          userId: user.id,
          walletKind,
          amount: totalPrice,
          quantity,
          raffleId,
          raffleName: raffle.name,
        })
        economy = { depositId: null, purchaseId: result.purchaseId }
        walletBalanceAfter = result.balanceAfter
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo debitar el saldo.'
        return NextResponse.json({ error: message }, { status: 409 })
      }

      cardStatus = 'active'
      paymentStatus = 'approved'
      cardPaymentMethod = walletKind === 'bonus_points' ? 'Saldo LBB Points' : 'Saldo creditos cash'
      cardPaymentReference = `WALLET-${(economy.purchaseId ?? '').slice(0, 12) || nanoid(8)}`
      cardReceiptUrl = `wallet:${walletKind}`
    } else {
      economy = await createEconomyTrace({
        serviceClient,
        userId: user.id,
        email,
        quantity,
        amount: receiptAmount,
        paymentMethod,
        paymentReference,
        paymentReceiptUrl,
        raffleId,
        raffleName: raffle.name,
      })
    }

    const seenCards = new Set<string>()
    const buyerSnapshot = {
      user_id: user.id,
      full_name: clean(profile.full_name),
      dni: clean(profile.dni),
      address: clean(profile.address),
      phone: clean(profile.phone),
      email,
      payout_account_kind: clean(profile.payout_account_kind),
      payout_account: clean(profile.payout_account),
      payout_holder_name: clean(profile.payout_holder_name),
    }

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
        user_id: user.id,
        purchase_id: economy.purchaseId,
        deposit_id: economy.depositId,
        card_status: cardStatus,
        generated_seed: nanoid(14),
        buyer_snapshot: buyerSnapshot,
        full_name: buyerSnapshot.full_name,
        dni: buyerSnapshot.dni,
        address: buyerSnapshot.address,
        phone: buyerSnapshot.phone,
        email: buyerSnapshot.email,
        payment_receipt_url: cardReceiptUrl,
        payment_method: cardPaymentMethod,
        payment_reference: cardPaymentReference,
        payout_account_kind: buyerSnapshot.payout_account_kind,
        payout_account: buyerSnapshot.payout_account,
        payout_holder_name: buyerSnapshot.payout_holder_name,
        session_token: sessionToken,
        bingo_numbers: bingoNumbers,
        payment_status: paymentStatus,
      }
    })

    let { data: cards, error: insertError } = await serviceClient
      .from('bingo_cards')
      .insert(cardsToInsert)
      .select()

    if (insertError && /(purchase_id|deposit_id|user_id|card_status|buyer_snapshot|generated_seed)/i.test(insertError.message)) {
      const legacyPayload = cardsToInsert.map(({ user_id, purchase_id, deposit_id, card_status, generated_seed, buyer_snapshot, ...card }) => card)
      const fallback = await serviceClient.from('bingo_cards').insert(legacyPayload).select()
      cards = fallback.data
      insertError = fallback.error
    }

    if (insertError) {
      console.error('Customer purchase insert error:', insertError)
      return NextResponse.json({ error: 'Error al crear los cartones.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      quantity,
      payment_mode: paymentMode,
      status: paymentStatus,
      deposit_id: economy.depositId,
      purchase_id: economy.purchaseId,
      wallet_balance_after: walletBalanceAfter,
      message:
        paymentMode === 'wallet'
          ? 'Compra confirmada con tu saldo. Tus cartones ya estan activos para el sorteo.'
          : 'Recibimos tu compra. Tus cartones quedan pendientes hasta aprobar el comprobante.',
      cards: cards ?? [],
    })
  } catch (error) {
    console.error('Customer purchase error:', error)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
