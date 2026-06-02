export interface PaymentAccountInfo {
  holder: string
  alias: string
  cbu: string
  bank: string
  concept: string
  amount: string
  note: string
}

export type PaymentAccountInput = Partial<Record<keyof PaymentAccountInfo, string | null>>

export const PAYMENT_INFO: PaymentAccountInfo = {
  holder: process.env.NEXT_PUBLIC_PAYMENT_HOLDER || 'Lucky Bingo Bear',
  alias: process.env.NEXT_PUBLIC_PAYMENT_ALIAS || 'CONFIGURAR.ALIAS',
  cbu: process.env.NEXT_PUBLIC_PAYMENT_CBU || '0000000000000000000000',
  bank: process.env.NEXT_PUBLIC_PAYMENT_BANK || 'Cuenta bancaria o billetera virtual',
  concept: process.env.NEXT_PUBLIC_PAYMENT_CONCEPT || 'BINGO + tu nombre',
  amount: process.env.NEXT_PUBLIC_PAYMENT_AMOUNT || 'Ver monto del sorteo vigente',
  note:
    process.env.NEXT_PUBLIC_PAYMENT_NOTE ||
    'El comprobante debe mostrar fecha, importe, cuenta de destino y numero de operacion.',
}

export function normalizePaymentAccountInfo(account?: PaymentAccountInput | null) {
  return {
    holder: account?.holder?.trim() || PAYMENT_INFO.holder,
    alias: account?.alias?.trim() || PAYMENT_INFO.alias,
    cbu: account?.cbu?.trim() || PAYMENT_INFO.cbu,
    bank: account?.bank?.trim() || PAYMENT_INFO.bank,
    concept: account?.concept?.trim() || PAYMENT_INFO.concept,
    note: account?.note?.trim() || PAYMENT_INFO.note,
  }
}

export const PAYMENT_METHODS = [
  'Mercado Pago',
  'Transferencia bancaria',
  'Cuenta DNI',
  'MODO',
  'Otra billetera virtual',
] as const
