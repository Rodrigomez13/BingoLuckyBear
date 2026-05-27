export const PAYMENT_INFO = {
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

export const PAYMENT_METHODS = [
  'Mercado Pago',
  'Transferencia bancaria',
  'Cuenta DNI',
  'MODO',
  'Otra billetera virtual',
] as const
