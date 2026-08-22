import { generateText, Output } from 'ai'
import * as z from 'zod'
import { type ParsedReceiptData, parseMoneyValue } from '@/lib/receipt-validation'

interface ReceiptAiInput {
  bytes: Buffer
  contentType: string
  filename: string
  expectedAmount?: string | number | null
  expectedOperationNumber?: string | null
  expectedDestinationAccounts?: Array<string | null | undefined>
}

// Vision-capable, fast and economical model served through the Vercel AI Gateway.
const RECEIPT_VISION_MODEL = 'google/gemini-3.5-flash'
const AI_GATEWAY_RECOVERABLE_ERROR_PATTERN = /(?:AI Gateway|gateway|valid credit card|free credits|payment required|status\s*402|\b402\b|rate limit|\b429\b|quota|payload|too large|body.*large|timeout|timed out|fetch failed|network|ECONNRESET|ETIMEDOUT)/i

const IMAGE_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/heic',
  'image/heif',
])

const receiptSchema = z.object({
  amount: z
    .string()
    .nullable()
    .describe('Importe principal transferido tal cual aparece, por ejemplo "15.000,00" o "15000.00". null si no se ve.'),
  operationNumber: z
    .string()
    .nullable()
    .describe('Número de operación, comprobante, referencia, transacción o código COELSA. null si no se ve.'),
  destinationAccount: z
    .string()
    .nullable()
    .describe('Alias, CBU o CVU de la cuenta que RECIBE el dinero (destino). null si no se ve.'),
  senderName: z
    .string()
    .nullable()
    .describe('Nombre y apellido de quien ENVÍA el dinero (ordenante / origen). null si no se ve.'),
  senderDocument: z
    .string()
    .nullable()
    .describe('DNI, CUIT o CUIL de quien ENVÍA el dinero, solo dígitos. null si no se ve.'),
  date: z
    .string()
    .nullable()
    .describe('Fecha y hora de la transferencia en formato ISO 8601 (ej: 2026-06-15T14:30:00). null si no se ve.'),
  isReceipt: z
    .boolean()
    .describe('true si la imagen es realmente un comprobante de pago/transferencia bancaria o de billetera virtual.'),
  confidence: z
    .number()
    .describe('Qué tan legible y confiable fue la lectura, entre 0 y 1.'),
  rawText: z
    .string()
    .describe('Todo el texto visible en el comprobante, transcripto lo más fiel posible.'),
})

function detectMediaType(contentType: string, filename: string) {
  const normalized = contentType.toLowerCase().split(';')[0].trim()
  const lowerName = filename.toLowerCase()
  if (normalized === 'application/pdf' || lowerName.endsWith('.pdf')) return 'application/pdf'
  if (IMAGE_CONTENT_TYPES.has(normalized)) return normalized
  if (lowerName.endsWith('.png')) return 'image/png'
  if (lowerName.endsWith('.webp')) return 'image/webp'
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg'
  return null
}

function buildContextHint(input: ReceiptAiInput) {
  const expectedAmount = parseMoneyValue(input.expectedAmount)
  const destinations = (input.expectedDestinationAccounts ?? [])
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))

  const lines: string[] = []
  if (expectedAmount !== null) lines.push(`- Monto informado por el cliente: ${expectedAmount}`)
  if (input.expectedOperationNumber?.trim()) lines.push(`- Número de operación informado: ${input.expectedOperationNumber.trim()}`)
  if (destinations.length) lines.push(`- Cuentas de cobro propias (posibles destinos): ${destinations.join(', ')}`)

  if (!lines.length) return ''
  return [
    '',
    'Datos declarados por el cliente (úsalos solo como pista, NO los inventes si no aparecen en la imagen):',
    ...lines,
  ].join('\n')
}

function normalizeDocument(value: string | null) {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  return digits.length >= 7 ? digits : null
}

function normalizeDate(value: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null
}

function clampConfidence(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.max(0, Math.min(1, value))
}

export function isRecoverableReceiptAiError(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : ''

  return AI_GATEWAY_RECOVERABLE_ERROR_PATTERN.test(message)
}

export async function parseReceiptWithAi(input: ReceiptAiInput): Promise<ParsedReceiptData> {
  const mediaType = detectMediaType(input.contentType, input.filename)
  if (!mediaType) {
    throw new Error('El comprobante debe ser una imagen (JPG, PNG, WebP) o un PDF para poder leerlo.')
  }

  const contextHint = buildContextHint(input)
  const base64 = input.bytes.toString('base64')

  const { output } = await generateText({
    model: RECEIPT_VISION_MODEL,
    output: Output.object({ schema: receiptSchema }),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: [
              'Sos un validador de comprobantes de transferencias bancarias y billeteras virtuales de Argentina ',
              '(Mercado Pago, Cuenta DNI, banco, etc.). Analizá la imagen o PDF del comprobante adjunto y extraé ',
              'los datos solicitados con la mayor precisión posible. Distinguí siempre entre quien ENVÍA (ordenante/origen) ',
              'y la cuenta que RECIBE (destino). Si un dato no está visible, devolvé null en ese campo en lugar de inventarlo.',
              contextHint,
            ].join(''),
          },
          {
            type: 'file',
            data: base64,
            mediaType,
            filename: input.filename || (mediaType === 'application/pdf' ? 'comprobante.pdf' : 'comprobante.jpg'),
          },
        ],
      },
    ],
  })

  if (!output.isReceipt) {
    throw new Error('La imagen subida no parece un comprobante de transferencia. Pedí al cliente una captura del comprobante.')
  }

  const amount = parseMoneyValue(output.amount)
  const operationNumber = output.operationNumber?.trim() || null
  const destinationAccount = output.destinationAccount?.trim() || null
  const senderName = output.senderName?.trim() || null
  const senderDocument = normalizeDocument(output.senderDocument)
  const date = normalizeDate(output.date)
  const rawText = output.rawText?.trim() || null

  const hits = [amount !== null, operationNumber, destinationAccount, senderDocument, date].filter(Boolean).length
  const modelConfidence = clampConfidence(output.confidence)
  // Blend the model's self-reported confidence with how many key fields it actually found.
  const fieldConfidence = 0.2 + hits * 0.16
  const confidence = Math.min(
    0.99,
    modelConfidence === null ? fieldConfidence : fieldConfidence * 0.45 + modelConfidence * 0.55,
  )

  const warnings: string[] = []
  if (confidence < 0.62) warnings.push('La lectura automática tiene baja confianza. Requiere revisión manual.')
  if (amount === null) warnings.push('La IA no detectó un monto claro en el comprobante.')
  if (!operationNumber) warnings.push('La IA no detectó un número de operación claro.')

  return {
    amount,
    operationNumber,
    destinationAccount,
    senderDocument,
    senderName,
    date,
    rawText,
    confidence,
    source: 'ai_vision',
    warnings,
  }
}
