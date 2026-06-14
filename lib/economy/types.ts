export type WalletKind = 'cash_credits' | 'bonus_points'
export type DepositStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type GameType = 'bingo' | 'truco' | 'tournament'
export type PurchaseType = 'bingo_card' | 'truco_entry_fee' | 'tournament_entry' | 'pack' | 'manual'
export type GamePurchaseStatus = 'pending' | 'paid' | 'cancelled' | 'refunded' | 'failed'

export interface PaymentDepositInput {
  userId?: string | null
  customerEmail?: string | null
  amount: number
  currency?: string
  walletKind?: WalletKind
  paymentMethod: string
  paymentReference?: string | null
  receiptUrl?: string | null
  receiptAmount?: number | null
  receiptOperationNumber?: string | null
  receiptDestinationAccount?: string | null
  receiptRawText?: string | null
  metadata?: Record<string, unknown>
}

export interface GamePurchaseInput {
  userId?: string | null
  gameType: GameType
  purchaseType: PurchaseType
  walletKind?: WalletKind
  amount: number
  quantity?: number
  status?: GamePurchaseStatus
  walletTransactionId?: string | null
  depositId?: string | null
  relatedType?: string | null
  relatedId?: string | null
  description?: string | null
  metadata?: Record<string, unknown>
}
