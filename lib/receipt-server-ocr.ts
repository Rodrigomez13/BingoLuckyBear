import { parseReceiptWithFreeOcr } from '@/lib/receipt-ocr-fast'
import { isPaddleOcrConfigured, parseReceiptWithPaddleOcr } from '@/lib/receipt-paddle-ocr'
import type { ParsedReceiptData } from '@/lib/receipt-validation'

interface ReceiptOcrInput {
  bytes: Buffer
  contentType: string
  filename: string
  expectedAmount?: string | number | null
  expectedOperationNumber?: string | null
  expectedDestinationAccounts?: Array<string | null | undefined>
}

function isPdf(input: ReceiptOcrInput) {
  const contentType = input.contentType.toLowerCase().split(';')[0]
  return contentType === 'application/pdf' || input.filename.toLowerCase().endsWith('.pdf')
}

export async function parseReceiptWithServerOcr(input: ReceiptOcrInput): Promise<ParsedReceiptData> {
  if (isPdf(input)) return parseReceiptWithFreeOcr(input)

  const errors: string[] = []

  if (isPaddleOcrConfigured()) {
    try {
      return await parseReceiptWithPaddleOcr(input)
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
    }
  }

  try {
    return await parseReceiptWithFreeOcr(input)
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error))
  }

  throw new Error(errors.filter(Boolean).join(' | ') || 'No se pudo leer el comprobante.')
}
