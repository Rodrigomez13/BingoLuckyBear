import type { SupabaseClient } from '@supabase/supabase-js'
import type { GamePurchaseInput, PaymentDepositInput } from './types'
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

  const { data, error } = await serviceClient
    .from('game_purchases')
    .insert({
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
    })
    .select('*')
    .single()

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
