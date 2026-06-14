import type { SupabaseClient } from '@supabase/supabase-js'
import type { GamePurchaseInput, PaymentDepositInput, WalletKind } from './types'
import { applyWalletTransaction } from '@/lib/wallet/server'

function cleanText(value: unknown, max = 180) {
  return String(value ?? '').trim().slice(0, max)
}

function positiveInteger(value: number, fallback = 0) {
  const amount = Math.trunc(Number(value))
  return Number.isFinite(amount) && amount > 0 ? amount : fallback
}

export async function createPaymentDeposit(serviceClient: SupabaseClient, input: PaymentDepositInput) {
  const amount = positiveInteger(input.amount)
  if (!amount) throw new Error('El monto del deposito debe ser mayor a cero')
  if (!cleanText(input.paymentMethod, 60)) throw new Error('Indica el metodo de pago')

  const { data, error } = await serviceClient
    .from('payment_deposits')
    .insert({
      user_id: input.userId ?? null,
      customer_email: input.customerEmail?.toLowerCase() ?? null,
      amount,
      currency: cleanText(input.currency || 'ARS', 8) || 'ARS',
      wallet_kind: input.walletKind ?? 'cash_credits',
      payment_method: cleanText(input.paymentMethod, 80),
      payment_reference: cleanText(input.paymentReference, 80) || null,
      receipt_url: cleanText(input.receiptUrl, 600) || null,
      receipt_amount: input.receiptAmount ? positiveInteger(input.receiptAmount) : null,
      receipt_operation_number: cleanText(input.receiptOperationNumber, 100) || null,
      receipt_destination_account: cleanText(input.receiptDestinationAccount, 120) || null,
      receipt_raw_text: cleanText(input.receiptRawText, 6000) || null,
      metadata: input.metadata ?? {},
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function createGamePurchase(serviceClient: SupabaseClient, input: GamePurchaseInput) {
  const amount = Math.trunc(Number(input.amount))
  const quantity = Math.trunc(Number(input.quantity ?? 1))
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Monto de compra invalido')
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Cantidad de compra invalida')

  const basePayload = {
    user_id: input.userId ?? null,
    game_type: input.gameType,
    purchase_type: input.purchaseType,
    wallet_kind: input.walletKind ?? 'cash_credits',
    amount,
    quantity,
    status: input.status ?? 'pending',
    wallet_transaction_id: input.walletTransactionId ?? null,
    deposit_id: input.depositId ?? null,
    related_type: input.relatedType ?? null,
    related_id: input.relatedId ?? null,
    description: cleanText(input.description, 240) || null,
    metadata: input.metadata ?? {},
  }

  let { data, error } = await serviceClient
    .from('game_purchases')
    .insert({ ...basePayload, payment_source: input.paymentSource ?? 'receipt' })
    .select('*')
    .single()

  // payment_source se agrega en 20260619_card_price_and_purchase_modes.sql.
  // Si todavia no se aplico la migracion, reintentamos sin esa columna.
  if (error && /payment_source/i.test(error.message)) {
    const fallback = await serviceClient.from('game_purchases').insert(basePayload).select('*').single()
    data = fallback.data
    error = fallback.error
  }

  if (error) throw error
  return data
}

export async function debitWalletForPurchase(
  serviceClient: SupabaseClient,
  input: {
    userId: string
    purchaseId: string
    walletKind?: 'cash_credits' | 'bonus_points'
    transactionType?: 'bingo_purchase' | 'truco_entry_fee' | 'tournament_entry' | 'game_purchase'
    amount: number
    description: string
    metadata?: Record<string, unknown>
  },
) {
  const amount = positiveInteger(input.amount)
  if (!amount) throw new Error('Monto de consumo invalido')

  return applyWalletTransaction(serviceClient, {
    userId: input.userId,
    walletKind: input.walletKind ?? 'cash_credits',
    type: input.transactionType ?? 'game_purchase',
    amount: -amount,
    relatedType: 'game_purchase',
    relatedId: input.purchaseId,
    description: input.description,
    metadata: input.metadata ?? {},
  })
}

export async function approveDepositAndCreditWallet(
  serviceClient: SupabaseClient,
  input: {
    depositId: string
    adminUserId: string
    notes?: string
  },
) {
  const { data: deposit, error: depositError } = await serviceClient
    .from('payment_deposits')
    .select('*')
    .eq('id', input.depositId)
    .single()

  if (depositError) throw depositError
  if (!deposit) throw new Error('Deposito no encontrado')
  if (deposit.status === 'approved') return deposit
  if (deposit.status !== 'pending') throw new Error('Solo se pueden aprobar depositos pendientes')
  if (!deposit.user_id) throw new Error('El deposito no tiene usuario vinculado')

  const balanceAfter = await applyWalletTransaction(serviceClient, {
    userId: deposit.user_id,
    walletKind: deposit.wallet_kind,
    type: 'deposit_approved',
    amount: Number(deposit.amount),
    relatedType: 'payment_deposit',
    relatedId: deposit.id,
    description: `Deposito aprobado (${deposit.amount} ${deposit.currency})`,
    metadata: {
      adminUserId: input.adminUserId,
      paymentMethod: deposit.payment_method,
      paymentReference: deposit.payment_reference,
    },
  })

  const { data: tx } = await serviceClient
    .from('lbb_wallet_transactions')
    .select('id')
    .eq('user_id', deposit.user_id)
    .eq('transaction_type', 'deposit_approved')
    .eq('related_type', 'payment_deposit')
    .eq('related_id', deposit.id)
    .maybeSingle()

  const { data: updated, error: updateError } = await serviceClient
    .from('payment_deposits')
    .update({
      status: 'approved',
      reviewed_by: input.adminUserId,
      reviewed_at: new Date().toISOString(),
      review_notes: input.notes ?? null,
      wallet_transaction_id: tx?.id ?? null,
      metadata: {
        ...(deposit.metadata ?? {}),
        balanceAfter,
      },
    })
    .eq('id', deposit.id)
    .select('*')
    .single()

  if (updateError) throw updateError
  return updated
}

async function loadDepositLinks(serviceClient: SupabaseClient, depositId: string) {
  const [{ data: purchases }, { data: cards }] = await Promise.all([
    serviceClient.from('game_purchases').select('id, status').eq('deposit_id', depositId),
    serviceClient.from('bingo_cards').select('id').eq('deposit_id', depositId),
  ])

  return {
    purchases: (purchases ?? []) as { id: string; status: string | null }[],
    cardCount: (cards ?? []).length,
  }
}

// Aprueba un deposito vinculado a una compra de cartones (pago por comprobante):
// confirma el pago y activa los cartones, sin acreditar saldo en la wallet.
export async function approveCardPurchaseDeposit(
  serviceClient: SupabaseClient,
  input: { depositId: string; adminUserId: string; notes?: string },
) {
  const { data: deposit, error: depositError } = await serviceClient
    .from('payment_deposits')
    .select('*')
    .eq('id', input.depositId)
    .single()

  if (depositError) throw depositError
  if (!deposit) throw new Error('Deposito no encontrado')
  if (deposit.status === 'approved') return deposit
  if (deposit.status !== 'pending') throw new Error('Solo se pueden aprobar depositos pendientes')

  const reviewedAt = new Date().toISOString()

  await serviceClient
    .from('game_purchases')
    .update({ status: 'paid' })
    .eq('deposit_id', deposit.id)

  await serviceClient
    .from('bingo_cards')
    .update({ card_status: 'active', payment_status: 'approved', payment_reviewed_at: reviewedAt, payment_reviewed_by: input.adminUserId })
    .eq('deposit_id', deposit.id)

  const { data: updated, error: updateError } = await serviceClient
    .from('payment_deposits')
    .update({
      status: 'approved',
      reviewed_by: input.adminUserId,
      reviewed_at: reviewedAt,
      review_notes: input.notes ?? null,
    })
    .eq('id', deposit.id)
    .select('*')
    .single()

  if (updateError) throw updateError
  return updated
}

// Aprobacion inteligente: si el deposito esta vinculado a una compra de cartones
// confirma el pago de los cartones; si es una recarga, acredita la wallet.
export async function approveDeposit(
  serviceClient: SupabaseClient,
  input: { depositId: string; adminUserId: string; notes?: string },
) {
  const { purchases, cardCount } = await loadDepositLinks(serviceClient, input.depositId)
  const isCardPurchase = cardCount > 0 || purchases.some((p) => p.status !== 'refunded')

  if (isCardPurchase) {
    const deposit = await approveCardPurchaseDeposit(serviceClient, input)
    return { deposit, mode: 'card_purchase' as const }
  }

  const deposit = await approveDepositAndCreditWallet(serviceClient, input)
  return { deposit, mode: 'wallet_credit' as const }
}

// Rechaza un deposito pendiente y cancela los cartones y la compra asociada.
export async function rejectDepositAndCancelCards(
  serviceClient: SupabaseClient,
  input: { depositId: string; adminUserId: string; notes?: string },
) {
  const { data: deposit, error: depositError } = await serviceClient
    .from('payment_deposits')
    .select('*')
    .eq('id', input.depositId)
    .single()

  if (depositError) throw depositError
  if (!deposit) throw new Error('Deposito no encontrado')
  if (deposit.status === 'rejected') return deposit
  if (deposit.status !== 'pending') throw new Error('Solo se pueden rechazar depositos pendientes')

  const reviewedAt = new Date().toISOString()

  await serviceClient
    .from('game_purchases')
    .update({ status: 'cancelled' })
    .eq('deposit_id', deposit.id)

  await serviceClient
    .from('bingo_cards')
    .update({ card_status: 'cancelled', payment_status: 'rejected', payment_reviewed_at: reviewedAt, payment_reviewed_by: input.adminUserId })
    .eq('deposit_id', deposit.id)

  const { data: updated, error: updateError } = await serviceClient
    .from('payment_deposits')
    .update({
      status: 'rejected',
      reviewed_by: input.adminUserId,
      reviewed_at: reviewedAt,
      review_notes: input.notes ?? null,
    })
    .eq('id', deposit.id)
    .select('*')
    .single()

  if (updateError) throw updateError
  return updated
}

// Debita la wallet del usuario para una compra de cartones pagada con saldo.
export async function purchaseCardsWithWallet(
  serviceClient: SupabaseClient,
  input: {
    userId: string
    walletKind: WalletKind
    amount: number
    quantity: number
    raffleId: string
    raffleName: string
    description?: string
    metadata?: Record<string, unknown>
  },
) {
  const amount = positiveInteger(input.amount)
  if (!amount) throw new Error('El precio total de la compra debe ser mayor a cero')

  const purchase = await createGamePurchase(serviceClient, {
    userId: input.userId,
    gameType: 'bingo',
    purchaseType: 'bingo_card',
    walletKind: input.walletKind,
    paymentSource: 'wallet',
    amount,
    quantity: input.quantity,
    status: 'paid',
    relatedType: 'raffle',
    relatedId: input.raffleId,
    description: input.description ?? `Compra de ${input.quantity} carton${input.quantity === 1 ? '' : 'es'} para ${input.raffleName}`,
    metadata: { source: 'account_purchase_wallet', ...(input.metadata ?? {}) },
  })

  // El RPC lanza "Saldo insuficiente" si la wallet no alcanza, de forma atomica.
  const balanceAfter = await applyWalletTransaction(serviceClient, {
    userId: input.userId,
    walletKind: input.walletKind,
    type: 'bingo_purchase',
    amount: -amount,
    relatedType: 'game_purchase',
    relatedId: purchase.id,
    description: `Compra de ${input.quantity} carton${input.quantity === 1 ? '' : 'es'} (${input.raffleName})`,
    metadata: { raffleId: input.raffleId, quantity: input.quantity },
  })

  const { data: tx } = await serviceClient
    .from('lbb_wallet_transactions')
    .select('id')
    .eq('user_id', input.userId)
    .eq('transaction_type', 'bingo_purchase')
    .eq('related_type', 'game_purchase')
    .eq('related_id', purchase.id)
    .maybeSingle()

  if (tx?.id) {
    await serviceClient.from('game_purchases').update({ wallet_transaction_id: tx.id }).eq('id', purchase.id)
  }

  return { purchaseId: purchase.id as string, balanceAfter }
}
