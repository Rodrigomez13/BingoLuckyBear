import { parseReceiptText } from '@/lib/receipt-ocr'
import type { ParsedReceiptData } from '@/lib/receipt-validation'

interface ReceiptOcrInput {
  bytes: Buffer
  contentType: string
  filename: string
  expectedAmount?: string | number | null
  expectedOperationNumber?: string | null
  expectedDestinationAccounts?: Array<string | null | undefined>
}

interface PaddleOcrResponse {
  rawText?: unknown
  text?: unknown
  confidence?: unknown
  lines?: unknown
  error?: unknown
}

const PADDLE_TIMEOUT_MS = 45_000
const IMAGE_CONTENT_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'])

export function isPaddleOcrConfigured() {
  return Boolean(process.env.PADDLE_OCR_ENDPOINT?.trim())
}

function getPaddleEndpoint() {
  const raw = process.env.PADDLE_OCR_ENDPOINT?.trim()
  if (!raw) return null

  const url = new URL(raw)
  if (!url.pathname || url.pathname === '/') url.pathname = '/ocr'
  return url
}

function getResponseText(data: PaddleOcrResponse) {
  if (typeof data.rawText === 'string') return data.rawText
  if (typeof data.text === 'string') return data.text
  if (Array.isArray(data.lines)) {
    return data.lines
      .map((line) => {
        if (typeof line === 'string') return line
        if (line && typeof line === 'object' && 'text' in line) return String((line as { text?: unknown }).text ?? '')
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }
  return ''
}

export async function parseReceiptWithPaddleOcr(input: ReceiptOcrInput): Promise<ParsedReceiptData> {
  const endpoint = getPaddleEndpoint()
  if (!endpoint) throw new Error('PaddleOCR no está configurado.')

  const contentType = input.contentType.toLowerCase().split(';')[0]
  if (!IMAGE_CONTENT_TYPES.has(contentType)) {
    throw new Error('PaddleOCR solo se usa para imágenes JPG, PNG, WebP, BMP o TIFF.')
  }

  const formData = new FormData()
  formData.set(
    'file',
    new Blob([new Uint8Array(input.bytes)], { type: contentType }),
    input.filename || 'comprobante',
  )

  const headers: HeadersInit = {}
  const apiKey = process.env.PADDLE_OCR_API_KEY?.trim()
  if (apiKey) headers.authorization = `Bearer ${apiKey}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: formData,
    signal: AbortSignal.timeout(PADDLE_TIMEOUT_MS),
  })

  const data = await response.json().catch(() => ({})) as PaddleOcrResponse
  if (!response.ok) {
    const message = typeof data.error === 'string' ? data.error : `PaddleOCR respondió ${response.status}`
    throw new Error(message)
  }

  const rawText = getResponseText(data).trim()
  if (rawText.length < 20) throw new Error('PaddleOCR no detectó texto suficiente en el comprobante.')

  const confidence = typeof data.confidence === 'number' && Number.isFinite(data.confidence)
    ? Math.max(0, Math.min(1, data.confidence))
    : null

  return parseReceiptText(rawText, input, { confidence, source: 'paddle_ocr' })
}
