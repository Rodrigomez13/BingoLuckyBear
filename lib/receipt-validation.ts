export type PaymentStatus = 'pending' | 'approved' | 'rejected'
export type ReceiptParseStatus = 'not_parsed' | 'parsed' | 'failed' | 'not_configured'
export type ReceiptReviewRecommendation = 'ready_for_review' | 'manual_review' | 'mismatch'

export interface ParsedReceiptData {
  amount: number | null
  operationNumber: string | null
  destinationAccount: string | null
  senderDocument: string | null
  senderName: string | null
  date: string | null
  rawText: string | null
  confidence: number | null
  source: 'image_ocr' | 'pdf_text' | 'external' | 'ai_vision'
  warnings: string[]
}

export interface ReceiptValidationContext {
  expectedAmount?: string | number | null
  expectedOperationNumber?: string | null
  expectedDestinationAccounts?: Array<string | null | undefined>
  expectedSenderDocument?: string | null
  submittedAt?: string | null
  maxAgeDays?: number
}

export function parseMoneyValue(value?: string | number | null) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null

  const clean = (value ?? '').replace(/[^\d,.-]/g, '')
  if (!clean) return null
  const lastComma = clean.lastIndexOf(',')
  const lastDot = clean.lastIndexOf('.')
  let normalized = clean

  if (lastComma >= 0 && lastDot >= 0) {
    normalized = lastComma > lastDot
      ? clean.replace(/\./g, '').replace(',', '.')
      : clean.replace(/,/g, '')
  } else if (lastComma >= 0) {
    normalized = clean.length - lastComma - 1 <= 2
      ? clean.replace(/\./g, '').replace(',', '.')
      : clean.replace(/,/g, '')
  } else if (lastDot >= 0) {
    normalized = clean.length - lastDot - 1 <= 2 && !/^\d{1,3}(?:\.\d{3})+$/.test(clean)
      ? clean
      : clean.replace(/\./g, '')
  }

  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : null
}

export function normalizeAccountReference(value?: string | null) {
  return (value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function normalizeOperationNumber(value?: string | null) {
  return (value ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function documentIdentityKeys(value?: string | null) {
  const digits = (value ?? '').replace(/\D/g, '').replace(/^0+/, '')
  if (!digits) return []
  const keys = new Set([digits])
  if (digits.length === 11) keys.add(digits.slice(2, -1).replace(/^0+/, ''))
  return [...keys].filter((key) => key.length >= 7)
}

function referencesMatch(actual?: string | null, expected?: string | null) {
  const actualValue = normalizeAccountReference(actual)
  const expectedValue = normalizeAccountReference(expected)
  if (!actualValue || !expectedValue) return null
  return actualValue === expectedValue
    || (Math.min(actualValue.length, expectedValue.length) >= 6
      && (actualValue.includes(expectedValue) || expectedValue.includes(actualValue)))
}

function validateReceiptDate(date: string | null, submittedAt?: string | null, maxAgeDays = 30) {
  if (!date) return null
  const detected = new Date(date).getTime()
  const submitted = submittedAt ? new Date(submittedAt).getTime() : Date.now()
  if (!Number.isFinite(detected) || !Number.isFinite(submitted)) return false
  const futureTolerance = 36 * 60 * 60 * 1000
  return detected <= submitted + futureTolerance
    && detected >= submitted - maxAgeDays * 24 * 60 * 60 * 1000
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
  const expectedDestinations = (context.expectedDestinationAccounts ?? []).filter(Boolean) as string[]
  const destinationComparisons = expectedDestinations.map((expected) => referencesMatch(parsed.destinationAccount, expected))
  const destinationMatches = expectedDestinations.length === 0 || !parsed.destinationAccount
    ? null
    : destinationComparisons.some(Boolean)
  const expectedDocumentKeys = documentIdentityKeys(context.expectedSenderDocument)
  const parsedDocumentKeys = documentIdentityKeys(parsed.senderDocument)
  const senderDocumentMatches = expectedDocumentKeys.length === 0 || parsedDocumentKeys.length === 0
    ? null
    : parsedDocumentKeys.some((key) => expectedDocumentKeys.includes(key))
  const dateIsPlausible = validateReceiptDate(parsed.date, context.submittedAt, context.maxAgeDays)

  if (amountMatches === false) warnings.push('El monto detectado no coincide con el monto informado.')
  if (operationMatches === false) warnings.push('El número de operación detectado no coincide con el informado.')
  if (destinationMatches === false) warnings.push('La cuenta destino no coincide con una cuenta de cobro configurada.')
  if (senderDocumentMatches === false) warnings.push('El documento del emisor no coincide con el DNI del usuario vinculado.')
  if (dateIsPlausible === false) warnings.push('La fecha detectada es futura o demasiado anterior a la solicitud.')
  if (parsed.amount === null) warnings.push('No se detectó un monto claro.')
  if (!parsed.operationNumber) warnings.push('No se detectó un número de operación claro.')
  if (expectedDestinations.length > 0 && !parsed.destinationAccount) warnings.push('No se detectó una cuenta destino clara.')
  if (expectedDocumentKeys.length > 0 && !parsed.senderDocument) warnings.push('No se detectó el documento del emisor.')

  const hardMismatch = [amountMatches, operationMatches, destinationMatches, senderDocumentMatches, dateIsPlausible]
    .some((value) => value === false)
  const hasCoreData = parsed.amount !== null && Boolean(parsed.operationNumber)
  const hasRequiredDestination = expectedDestinations.length === 0 || Boolean(parsed.destinationAccount)
  const confidenceEnough = (parsed.confidence ?? 0) >= 0.62
  const reviewRecommendation: ReceiptReviewRecommendation = hardMismatch
    ? 'mismatch'
    : hasCoreData && hasRequiredDestination && confidenceEnough
      ? 'ready_for_review'
      : 'manual_review'

  return {
    warnings: [...new Set(warnings)],
    // OCR is evidence, never authorization to move money.
    suggestedStatus: 'pending' as const,
    reviewRecommendation,
    amountMatches,
    operationMatches,
    destinationMatches,
    senderDocumentMatches,
    dateIsPlausible,
  }
}

export function coerceParsedReceiptData(value: unknown): ParsedReceiptData {
  const record = typeof value === 'object' && value ? value as Record<string, unknown> : {}
  const amount = parseMoneyValue(record.amount as string | number | null)
  const confidence = Number(record.confidence)
  const source = record.source === 'pdf_text' || record.source === 'image_ocr' || record.source === 'ai_vision'
    ? record.source
    : 'external'

  return {
    amount,
    operationNumber: typeof record.operationNumber === 'string' ? record.operationNumber.trim() || null : null,
    destinationAccount: typeof record.destinationAccount === 'string' ? record.destinationAccount.trim() || null : null,
    senderDocument: typeof record.senderDocument === 'string' ? record.senderDocument.trim() || null : null,
    senderName: typeof record.senderName === 'string' ? record.senderName.trim() || null : null,
    date: typeof record.date === 'string' ? record.date.trim() || null : null,
    rawText: typeof record.rawText === 'string' ? record.rawText.trim() || null : null,
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : null,
    source,
    warnings: Array.isArray(record.warnings) ? record.warnings.map(String).filter(Boolean) : [],
  }
}
