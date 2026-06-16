import { nanoid } from 'nanoid'
import { NextRequest, NextResponse } from 'next/server'
import { generateBingoNumbers } from '@/lib/bingo'
import { createGamePurchase, createPaymentDeposit, debitWalletForPurchase } from '@/lib/economy/server'
import { processDepositReceipt } from '@/lib/receipt-processing'
import { applyWalletTransaction, ensurePlayerAccount } from '@/lib/wallet/server'
import { getPurchaseAvailability, syncRaffleLifecycle } from '@/lib/raffle-lifecycle'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

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
      clean(profile.payout_holder_name),
  )
}

export async function POST(request: NextRequest) {
  let walletPurchase: {
    purchaseId: string
    userId: string
    amount: number
    debited: boolean
  } | null = null

  let receiptPurchase: { purchaseId: string; depositId: string } | null = null

  try {
    const authClient = await createClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Para comprar cartones primero tenes que ingresar con tu cuenta.' },
        { status: 401 },
      )
    }

    const body = await request.json()
    const raffleId = clean(body.raffle_id)
    const sessionToken = clean(body.session_token)
    const quantity = normalizeQuantity(body.quantity)
    const paymentSource = body.payment_source === 'wallet' ? 'wallet' : 'receipt'
    const paymentReceiptUrl = clean(body.payment_receipt_url)
    const paymentMethod = clean(body.payment_method)
    const paymentReference = clean(body.payment_reference)

    if (!raffleId || !sessionToken || !quantity) {
      return NextResponse.json(
        { error: 'Faltan datos de la compra o la cantidad no es válida.' },
        { status: 400 },
      )
    }

    if (paymentSource === 'receipt') {
      if (!paymentReceiptUrl || !paymentMethod || !paymentReference) {
        return NextResponse.json(
          { error: 'Faltan datos de la compra o del comprobante.' },
          { status: 400 },
        )
      }

      if (!/^[a-zA-Z0-9 .:_-]{4,60}$/.test(paymentReference)) {
        return NextResponse.json(
          { error: 'El número de operación debe tener entre 4 y 60 caracteres válidos.' },
          { status: 400 },
        )
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
      return NextResponse.json(
        { error: 'Completa tus datos de jugador antes de comprar cartones.' },
        { status: 409 },
      )
    }

    const { data: raffle, error: raffleError } = await serviceClient
      .from('raffles')
      .select(
        'id, name, is_active, draw_date, draw_status, draw_started_at, drawn_numbers, prize, additional_prizes, card_price',
      )
      .eq('id', raffleId)
      .eq('is_active', true)
      .single()

    if (raffleError || !raffle) {
      return NextResponse.json({ error: 'El sorteo no está disponible.' }, { status: 400 })
    }

    const syncedRaffle = await syncRaffleLifecycle(serviceClient, raffle)
    const availability = getPurchaseAvailability(syncedRaffle)

    if (!syncedRaffle.is_active || !availability.canPurchase) {
      const messages = {
        cutoff: 'La venta de cartones cierra 30 minutos antes del sorteo.',
        running: 'El sorteo ya está en curso y no permite nuevas compras.',
        closed: 'El sorteo ya está cerrado.',
        missing_date: 'El sorteo todavía no tiene fecha confirmada.',
      } as const

      return NextResponse.json(
        { error: messages[availability.reason ?? 'closed'] },
        { status: 409 },
      )
    }

    const cardPrice = Math.trunc(Number(syncedRaffle.card_price ?? 0))

    if (!Number.isFinite(cardPrice) || cardPrice <= 0) {
      return NextResponse.json(
        { error: 'Este sorteo todavía no tiene un precio numérico por cartón.' },
        { status: 409 },
      )
    }

    const totalAmount = cardPrice * quantity
    const email = clean(profile.email || user.email).toLowerCase()

    let depositId: string | null = null
    let purchaseId: string
    let walletTransactionId: string | null = null

    if (paymentSource === 'receipt') {
      const deposit = await createPaymentDeposit(serviceClient, {
        userId: user.id,
        customerEmail: email,
        amount: totalAmount,
        walletKind: 'general',
        paymentMethod,
        paymentReference,
        receiptUrl: paymentReceiptUrl,
        metadata: {
          source: 'bingo_card_receipt_purchase',
          raffleId,
          raffleName: syncedRaffle.name,
          quantity,
          cardPrice,
        },
      })

      depositId = deposit.id as string

      const purchase = await createGamePurchase(serviceClient, {
        userId: user.id,
        gameType: 'bingo',
        purchaseType: 'bingo_card',
        walletKind: 'general',
        amount: totalAmount,
        quantity,
        status: 'pending',
        depositId,
        relatedType: 'raffle',
        relatedId: raffleId,
        description: `Compra de ${quantity} cartón${quantity === 1 ? '' : 'es'} para ${syncedRaffle.name}`,
        metadata: {
          source: 'account_purchase_form',
          cardPrice,
          paymentReference,
        },
      })

      purchaseId = purchase.id as string
      receiptPurchase = { purchaseId, depositId }
    } else {
      await ensurePlayerAccount(serviceClient, user)

      const purchase = await createGamePurchase(serviceClient, {
        userId: user.id,
        gameType: 'bingo',
        purchaseType: 'bingo_card',
        walletKind: 'general',
        amount: totalAmount,
        quantity,
        status: 'pending',
        relatedType: 'raffle',
        relatedId: raffleId,
        description: `Compra directa de ${quantity} cartón${quantity === 1 ? '' : 'es'} para ${syncedRaffle.name}`,
        metadata: {
          source: 'wallet_bingo_purchase',
          cardPrice,
        },
      })

      purchaseId = purchase.id as string
      walletPurchase = {
        purchaseId,
        userId: user.id,
        amount: totalAmount,
        debited: false,
      }

      await debitWalletForPurchase(serviceClient, {
        userId: user.id,
        purchaseId,
        walletKind: 'general',
        transactionType: 'bingo_purchase',
        amount: totalAmount,
        description: `${quantity} cartón${quantity === 1 ? '' : 'es'} de ${syncedRaffle.name}`,
        metadata: {
          raffleId,
          quantity,
          cardPrice,
        },
      })

      walletPurchase.debited = true

      const { data: transaction } = await serviceClient
        .from('lbb_wallet_transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('transaction_type', 'bingo_purchase')
        .eq('related_type', 'game_purchase')
        .eq('related_id', purchaseId)
        .maybeSingle()

      walletTransactionId = transaction?.id ?? null

      const { error: purchaseUpdateError } = await serviceClient
        .from('game_purchases')
        .update({
          status: 'paid',
          wallet_transaction_id: walletTransactionId,
        })
        .eq('id', purchaseId)

      if (purchaseUpdateError) throw purchaseUpdateError
    }

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

    const seenCards = new Set<string>()
    const isPaid = paymentSource === 'wallet'

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
        purchase_id: purchaseId,
        deposit_id: depositId,
        card_status: isPaid ? 'active' : 'reserved',
        generated_seed: nanoid(14),
        buyer_snapshot: buyerSnapshot,
        full_name: buyerSnapshot.full_name,
        dni: buyerSnapshot.dni,
        address: buyerSnapshot.address,
        phone: buyerSnapshot.phone,
        email: buyerSnapshot.email,
        payment_receipt_url: paymentReceiptUrl,
        payment_method: isPaid ? 'Saldo de cuenta' : paymentMethod,
        payment_reference: isPaid ? walletTransactionId || purchaseId : paymentReference,
        payout_account_kind: buyerSnapshot.payout_account_kind,
        payout_account: buyerSnapshot.payout_account,
        payout_holder_name: buyerSnapshot.payout_holder_name,
        session_token: sessionToken,
        bingo_numbers: bingoNumbers,
        payment_status: isPaid ? 'approved' : 'pending',
        receipt_amount: cardPrice,
        issued_at: isPaid ? new Date().toISOString() : null,
      }
    })

    let { data: cards, error: insertError } = await serviceClient
      .from('bingo_cards')
      .insert(cardsToInsert)
      .select()

    if (
      insertError &&
      /(purchase_id|deposit_id|user_id|card_status|buyer_snapshot|generated_seed|issued_at)/i.test(
        insertError.message,
      )
    ) {
      const legacyPayload = cardsToInsert.map((card) => {
        const legacyCard = { ...card } as Record<string, unknown>

        for (const field of [
          'user_id',
          'purchase_id',
          'deposit_id',
          'card_status',
          'generated_seed',
          'buyer_snapshot',
          'issued_at',
        ]) {
          delete legacyCard[field]
        }

        return legacyCard
      })

      const fallback = await serviceClient.from('bingo_cards').insert(legacyPayload).select()
      cards = fallback.data
      insertError = fallback.error
    }

    if (insertError) throw insertError

    let receiptOcrOutcome: 'auto_approved' | 'auto_rejected' | 'pending' = 'pending'

    if (paymentSource === 'receipt' && depositId) {
      try {
        const processed = await processDepositReceipt(serviceClient, {
          depositId,
          actorUserId: null,
          autoApprove: true,
          autoReject: true,
        })

        if (processed.autoApproved) receiptOcrOutcome = 'auto_approved'
        else if (processed.autoRejected) receiptOcrOutcome = 'auto_rejected'
      } catch (ocrError) {
        console.error('[v0] Automatic receipt processing failed (purchase):', ocrError)
      }

      if (receiptOcrOutcome !== 'pending') {
        const { data: refreshedCards } = await serviceClient
          .from('bingo_cards')
          .select('*')
          .eq('purchase_id', purchaseId)

        if (refreshedCards?.length) cards = refreshedCards
      }
    }

    walletPurchase = null
    receiptPurchase = null

    const finalStatus =
      isPaid || receiptOcrOutcome === 'auto_approved'
        ? 'approved'
        : receiptOcrOutcome === 'auto_rejected'
          ? 'rejected'
          : 'pending'

    const messageByStatus = {
      approved: isPaid
        ? 'Compra aprobada. Tus cartones ya están participando.'
        : 'Comprobante validado automáticamente. Tus cartones ya están participando.',
      rejected:
        'El comprobante no superó la verificación automática y fue rechazado. Revisá que el monto, la cuenta destino y el número de operación sean correctos y volvé a cargarlo.',
      pending: 'Recibimos tu compra. Tus cartones quedan pendientes hasta aprobar el comprobante.',
    } as const

    return NextResponse.json({
      success: true,
      quantity,
      status: finalStatus,
      deposit_id: depositId,
      purchase_id: purchaseId,
      total_amount: totalAmount,
      message: messageByStatus[finalStatus],
      auto_approved: receiptOcrOutcome === 'auto_approved',
      auto_rejected: receiptOcrOutcome === 'auto_rejected',
      cards: cards ?? [],
    })
  } catch (error) {
    if (walletPurchase) {
      try {
        const serviceClient = await createServiceClient()

        if (walletPurchase.debited) {
          await applyWalletTransaction(serviceClient, {
            userId: walletPurchase.userId,
            walletKind: 'general',
            type: 'game_refund',
            amount: walletPurchase.amount,
            relatedType: 'game_purchase',
            relatedId: walletPurchase.purchaseId,
            description: 'Reintegro automático por compra de cartones no completada',
          })

          await serviceClient
            .from('game_purchases')
            .update({ status: 'refunded' })
            .eq('id', walletPurchase.purchaseId)
        } else {
          await serviceClient
            .from('game_purchases')
            .update({ status: 'failed' })
            .eq('id', walletPurchase.purchaseId)
        }
      } catch (refundError) {
        console.error('Wallet purchase refund error:', refundError)
      }
    }

    if (receiptPurchase) {
      try {
        const serviceClient = await createServiceClient()

        await Promise.all([
          serviceClient
            .from('game_purchases')
            .update({ status: 'failed' })
            .eq('id', receiptPurchase.purchaseId),
          serviceClient
            .from('payment_deposits')
            .update({
              status: 'cancelled',
              review_notes: 'Compra no completada al generar cartones',
            })
            .eq('id', receiptPurchase.depositId),
        ])
      } catch (cleanupError) {
        console.error('Receipt purchase cleanup error:', cleanupError)
      }
    }

    console.error('Customer purchase error:', error)

    const message = error instanceof Error ? error.message : 'Error interno del servidor.'
    const status = /saldo|insuficiente|balance/i.test(message) ? 409 : 500

    return NextResponse.json({ error: message }, { status })
  }
}