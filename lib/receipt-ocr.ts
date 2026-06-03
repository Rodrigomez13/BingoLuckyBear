import { type ParsedReceiptData } from '@/lib/receipt-validation'

interface FreeOcrInput {
  bytes: Buffer
  contentType: string
  filename: string
  expectedDestinationAccount?: string | null
}

const IMAGE_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/tiff',
])

function normalizeText(value: string) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function parseDetectedMoney(value: string) {
  const clean = value.replace(/[^\d,.]/g, '')
  if (!clean) return null

  const lastComma = clean.lastIndexOf(',')
  const lastDot = clean.lastIndexOf('.')
  let normalized = clean

  if (lastComma >= 0 && lastDot >= 0) {
    normalized = lastComma > lastDot
      ? clean.replace(/\./g, '').replace(',', '.')
      : clean.replace(/,/g, '')
  } else if (lastComma >= 0) {
    const decimals = clean.length - lastComma - 1
    normalized = decimals > 0 && decimals <= 2
      ? clean.replace(',', '.')
      : clean.replace(/,/g, '')
  } else if (lastDot >= 0) {
    const decimals = clean.length - lastDot - 1
    normalized = decimals > 0 && decimals <= 2 && !/^\d{1,3}(?:\.\d{3})+$/.test(clean)
      ? clean
      : clean.replace(/\./g, '')
  }

  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : null
}

function findAmount(text: string) {
  const amountPattern = /\$?\s*([0-9]{1,3}(?:[.\s][0-9]{3})*(?:[,.]\d{1,2})?|[0-9]+(?:[,.]\d{1,2})?)/g
  const priorityLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /\b(monto|importe|total|valor|transferido|pagado|pago)\b/i.test(line))

  for (const line of priorityLines) {
    const candidates = [...line.matchAll(amountPattern)]
      .map((match) => parseDetectedMoney(match[1]))
      .filter((amount): amount is number => amount !== null && amount > 0 && amount < 100000000)

    if (candidates.length) return Math.max(...candidates)
  }

  const currencyCandidates = [...text.matchAll(/\$\s*([0-9]{1,3}(?:[.\s][0-9]{3})*(?:[,.]\d{1,2})?|[0-9]+(?:[,.]\d{1,2})?)/g)]
    .map((match) => parseDetectedMoney(match[1]))
    .filter((amount): amount is number => amount !== null && amount > 0 && amount < 100000000)

  return currencyCandidates.length ? Math.max(...currencyCandidates) : null
}

function findOperationNumber(text: string) {
  const patterns = [
    /(?:operaci[oó]n|op\.?|comprobante|referencia|transacci[oó]n|movimiento|id)\D{0,30}([A-Z0-9][A-Z0-9._-]{4,80})/i,
    /(?:nro|numero|n[uú]mero|codigo|c[oó]digo)\D{0,30}([A-Z0-9][A-Z0-9._-]{4,80})/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].replace(/[^\w.-]/g, '').trim()
  }

  const longNumeric = text.match(/\b\d{7,30}\b/)
  return longNumeric?.[0] ?? null
}

function findDestinationAccount(text: string, expectedDestinationAccount?: string | null) {
  if (expectedDestinationAccount) {
    const compactText = text.toLowerCase().replace(/[\s.-]/g, '')
    const compactExpected = expectedDestinationAccount.toLowerCase().replace(/[\s.-]/g, '')
    if (compactExpected && compactText.includes(compactExpected)) return expectedDestinationAccount
  }

  const match = text.match(/(?:destino|para|alias|cbu|cvu|cuenta)\D{0,35}([A-Z0-9][A-Z0-9._-]{5,80})/i)
  return match?.[1]?.replace(/[^\w.-]/g, '').trim() || null
}

function findIsoDate(text: string) {
  const match = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?\b/)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3])
  const hour = Number(match[4] ?? 0)
  const minute = Number(match[5] ?? 0)

  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || hour > 23 || minute > 59) {
    return null
  }

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute))
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function buildParsedReceipt(text: string, expectedDestinationAccount?: string | null): ParsedReceiptData {
  const rawText = normalizeText(text)
  const amount = findAmount(rawText)
  const operationNumber = findOperationNumber(rawText)
  const destinationAccount = findDestinationAccount(rawText, expectedDestinationAccount)
  const date = findIsoDate(rawText)
  const hits = [amount !== null, Boolean(operationNumber), Boolean(destinationAccount), Boolean(date)]
    .filter(Boolean).length

  return {
    amount,
    operationNumber,
    destinationAccount,
    date,
    rawText,
    confidence: Math.min(0.25 + hits * 0.18, 0.85),
    warnings: [
      'Lectura realizada con OCR gratuito. Revisar manualmente antes de aprobar si algun dato se ve dudoso.',
    ],
  }
}

export async function parseReceiptWithFreeOcr(input: FreeOcrInput): Promise<ParsedReceiptData> {
  const contentType = input.contentType.toLowerCase().split(';')[0]

  if (contentType === 'application/pdf' || input.filename.toLowerCase().endsWith('.pdf')) {
    throw new Error('El OCR gratuito no procesa PDFs escaneados. Subi una captura JPG/PNG/WebP del comprobante o revisalo manualmente.')
  }

  if (!IMAGE_CONTENT_TYPES.has(contentType)) {
    throw new Error('El OCR gratuito solo puede leer imagenes JPG, PNG, WebP, BMP o TIFF.')
  }

  const { recognize } = await import('tesseract.js')
  const dataUrl = `data:${contentType};base64,${input.bytes.toString('base64')}`
  const result = await recognize(dataUrl, 'spa+eng', {
    logger: () => undefined,
  })

  const text = result.data.text
  if (!text.trim()) {
    throw new Error('No se detecto texto en el comprobante. Revisa la imagen o carga una captura mas nitida.')
  }

  return buildParsedReceipt(text, input.expectedDestinationAccount)
}
