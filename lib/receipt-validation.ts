export type PaymentStatus = 'pending' | 'approved' | 'rejected'
export type ReceiptParseStatus = 'not_parsed' | 'parsed' | 'failed' | 'not_configured'

export interface ParsedReceiptData {
  amount: number | null
  operationNumber: string | null
  destinationAccount: string | null
  date: string | null
  rawText: string | null
  confidence: number | null
  warnings: string[]
}

export interface ReceiptValidationContext {
  expectedAmount?: string | null
  expectedOperationNumber?: string | null
  expectedDestinationAccount?: string | null
}

export function parseMoneyValue(value?: string | number | null) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const normalized = (value ?? '')
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const amount = Number(normalized)

  return Number.isFinite(amount) ? amount : null
}

export function normalizeAccountReference(value?: string | null) {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[.-]/g, '')
}

export function normalizeOperationNumber(value?: string | null) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, '')
}

export function validateParsedReceipt(parsed: ParsedReceiptData, context: ReceiptValidationContext) {
  const warnings: string[] = [...parsed.warnings]
  const expectedAmount = parseMoneyValue(context.expectedAmount)
  const amountMatches = expectedAmount === null || parsed.amount === null
    ? null
    : Math.abs(parsed.amount - expectedAmount) < 1
  const expectedOperation = normalizeOperationNumber(context.expectedOperationNumber)
  const operationMatches = !expectedOperation || !parsed.operationNumber
    ? null
    : normalizeOperationNumber(parsed.operationNumber) === expectedOperation
  const expectedDestination = normalizeAccountReference(context.expectedDestinationAccount)
  const parsedDestination = normalizeAccountReference(parsed.destinationAccount)
  const destinationMatches = !expectedDestination || !parsedDestination
    ? null
    : parsedDestination.includes(expectedDestination) || expectedDestination.includes(parsedDestination)

  if (amountMatches === false) warnings.push('El monto detectado no coincide con el monto del carton.')
  if (operationMatches === false) warnings.push('El numero de operacion detectado no coincide con el informado.')
  if (destinationMatches === false) warnings.push('La cuenta destino detectada no coincide con la billetera de cobro.')
  if (parsed.amount === null) warnings.push('No se detecto un monto claro en el comprobante.')
  if (!parsed.operationNumber) warnings.push('No se detecto un numero de operacion claro.')
  if (!parsed.destinationAccount) warnings.push('No se detecto una cuenta destino clara.')

  const hardMismatch = [amountMatches, operationMatches, destinationMatches].some((value) => value === false)
  const hasCoreData = parsed.amount !== null && Boolean(parsed.operationNumber)
  const hasRequiredDestination = !expectedDestination || Boolean(parsedDestination)

  return {
    warnings: [...new Set(warnings)],
    suggestedStatus: hardMismatch || !hasCoreData || !hasRequiredDestination ? 'pending' as const : 'approved' as const,
    amountMatches,
    operationMatches,
    destinationMatches,
  }
}

export function coerceParsedReceiptData(value: unknown): ParsedReceiptData {
  const record = typeof value === 'object' && value ? value as Record<string, unknown> : {}
  const amount = parseMoneyValue(record.amount as string | number | null)
  const confidence = Number(record.confidence)

  return {
    amount,
    operationNumber: typeof record.operationNumber === 'string' ? record.operationNumber.trim() || null : null,
    destinationAccount: typeof record.destinationAccount === 'string' ? record.destinationAccount.trim() || null : null,
    date: typeof record.date === 'string' ? record.date.trim() || null : null,
    rawText: typeof record.rawText === 'string' ? record.rawText.trim() || null : null,
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : null,
    warnings: Array.isArray(record.warnings) ? record.warnings.map(String).filter(Boolean) : [],
  }
}
