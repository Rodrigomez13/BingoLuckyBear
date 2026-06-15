import sharp from 'sharp'
import { tmpdir } from 'node:os'
import { type ParsedReceiptData, parseMoneyValue } from '@/lib/receipt-validation'

interface ReceiptOcrInput {
  bytes: Buffer
  contentType: string
  filename: string
  expectedAmount?: string | number | null
  expectedOperationNumber?: string | null
  expectedDestinationAccounts?: Array<string | null | undefined>
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
    .normalize('NFKC')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function compactIdentifier(value?: string | null) {
  return (value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function lineWindows(text: string) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  return lines.flatMap((line, index) => [
    line,
    index < lines.length - 1 ? `${line} ${lines[index + 1]}` : '',
  ]).filter(Boolean)
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

function moneyCandidates(value: string) {
  const amountPattern = /(?:ARS|AR\$|\$)?\s*([0-9]{1,3}(?:[.\s][0-9]{3})*(?:[,.]\d{1,2})?|[0-9]+(?:[,.]\d{1,2})?)/gi
  return [...value.matchAll(amountPattern)]
    .map((match) => parseDetectedMoney(match[1]))
    .filter((amount): amount is number => amount !== null && amount > 0 && amount < 100_000_000)
}

function findAmount(text: string, expectedAmount?: string | number | null) {
  const expected = parseMoneyValue(expectedAmount)
  if (expected !== null) {
    const expectedSeen = moneyCandidates(text).find((candidate) => Math.abs(candidate - expected) < 1)
    if (expectedSeen !== undefined) return expectedSeen
  }

  for (const line of lineWindows(text)) {
    if (!/\b(monto|importe|total|transferido|enviaste|pagado|pago|acreditado)\b/i.test(line)) continue
    const candidates = moneyCandidates(line)
    if (candidates.length) return Math.max(...candidates)
  }

  const currencyCandidates = [...text.matchAll(/(?:ARS|AR\$|\$)\s*([0-9][0-9.\s]*(?:,\d{1,2})?)/gi)]
    .map((match) => parseDetectedMoney(match[1]))
    .filter((amount): amount is number => amount !== null && amount > 0 && amount < 100_000_000)

  return currencyCandidates.length ? Math.max(...currencyCandidates) : null
}

function isLikelyAccountOrDocument(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 22 || digits.length === 11 || digits.length === 8
}

function findOperationNumber(text: string, expectedOperationNumber?: string | null) {
  const expected = compactIdentifier(expectedOperationNumber)
  if (expected && compactIdentifier(text).includes(expected)) return expectedOperationNumber?.trim() ?? expected

  const labels = /\b(?:n(?:ro|umero|úmero)?\.?\s*(?:de\s*)?)?(?:operaci[oó]n|comprobante|referencia|transacci[oó]n|movimiento|coelsa|id)\b/i
  for (const line of lineWindows(text)) {
    if (!labels.test(line)) continue
    const tail = line.replace(/^.*?\b(?:operaci[oó]n|comprobante|referencia|transacci[oó]n|movimiento|coelsa|id)\b\s*[:#.-]?\s*/i, '')
    const candidates = tail.match(/[A-Z0-9][A-Z0-9._-]{5,79}/gi) ?? []
    const candidate = candidates.find((value) => !isLikelyAccountOrDocument(value))
    if (candidate) return candidate.replace(/[^\w.-]/g, '').trim()
  }

  return null
}

function findDestinationAccount(text: string, expectedDestinationAccounts: Array<string | null | undefined>) {
  const expected = expectedDestinationAccounts
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))

  const compactText = compactIdentifier(text)
  const expectedMatch = expected.find((value) => compactText.includes(compactIdentifier(value)))
  if (expectedMatch) return expectedMatch

  for (const line of lineWindows(text)) {
    if (!/\b(destino|destinatario|para|alias|cbu|cvu|cuenta receptora)\b/i.test(line)) continue
    const bankAccount = line.match(/\b\d(?:[\s.-]?\d){21}\b/)
    if (bankAccount) return bankAccount[0].replace(/\D/g, '')
    const alias = line.match(/\b[A-Z0-9][A-Z0-9._-]{5,60}\b/gi)
      ?.find((value) => /[A-Z]/i.test(value) && !/^(DESTINO|DESTINATARIO|ALIAS|CUENTA|TRANSFERENCIA)$/i.test(value))
    if (alias) return alias
  }

  return null
}

function findSenderDocument(text: string) {
  const preferredLabels = /\b(?:emisor|origen|ordenante|titular)\b.*?\b(?:dni|documento|cuil|cuit)\b|\b(?:dni|documento|cuil|cuit)\b.*?\b(?:emisor|origen|ordenante|titular)\b/i
  const genericLabels = /\b(?:dni|documento|cuil|cuit)\b/i

  for (const labels of [preferredLabels, genericLabels]) {
    for (const line of lineWindows(text)) {
      if (!labels.test(line)) continue
      const values = line.match(/\b\d(?:[\s.-]?\d){6,10}\b/g) ?? []
      const document = values
        .map((value) => value.replace(/\D/g, ''))
        .find((value) => value.length >= 7 && value.length <= 11)
      if (document) return document
    }
  }

  return null
}

function findSenderName(text: string) {
  for (const line of lineWindows(text)) {
    const match = line.match(/\b(?:de|emisor|origen|ordenante|titular)\s*[:.-]?\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ' ]{4,70})/i)
    if (!match?.[1]) continue
    const name = match[1]
      .split(/\b(?:dni|documento|cuil|cuit|cuenta|alias|cbu|cvu|operaci[oó]n|referencia)\b/i)[0]
      .replace(/\s+/g, ' ')
      .trim()
    if (name.length >= 5 && !/\b(?:transferencia|mercado pago)\b/i.test(name)) return name
  }
  return null
}

function findIsoDate(text: string) {
  const matches = [...text.matchAll(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:[ ,]+(\d{1,2}):(\d{2})(?::\d{2})?)?\b/g)]

  for (const match of matches) {
    const day = Number(match[1])
    const month = Number(match[2])
    const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3])
    const hour = Number(match[4] ?? 0)
    const minute = Number(match[5] ?? 0)
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2020 || hour > 23 || minute > 59) continue

    // Receipt timestamps are interpreted in Argentina time (UTC-3).
    const date = new Date(Date.UTC(year, month - 1, day, hour + 3, minute))
    if (
      date.getUTCDate() === day
      && date.getUTCMonth() === month - 1
      && date.getUTCFullYear() === year
    ) {
      return date.toISOString()
    }
  }

  return null
}

function buildParsedReceipt(
  text: string,
  input: ReceiptOcrInput,
  engineConfidence: number | null,
  source: ParsedReceiptData['source'],
): ParsedReceiptData {
  const rawText = normalizeText(text)
  const amount = findAmount(rawText, input.expectedAmount)
  const operationNumber = findOperationNumber(rawText, input.expectedOperationNumber)
  const destinationAccount = findDestinationAccount(rawText, input.expectedDestinationAccounts ?? [])
  const senderDocument = findSenderDocument(rawText)
  const senderName = findSenderName(rawText)
  const date = findIsoDate(rawText)
  const hits = [amount !== null, operationNumber, destinationAccount, senderDocument, date].filter(Boolean).length
  const fieldConfidence = 0.18 + hits * 0.14
  const confidence = Math.min(0.98, Math.max(0, engineConfidence === null
    ? fieldConfidence
    : fieldConfidence * 0.55 + engineConfidence * 0.45))

  const warnings: string[] = []
  if (source === 'pdf_text') warnings.push('Se extrajo texto nativo del PDF; revisá visualmente que corresponda al comprobante.')
  if (confidence < 0.62) warnings.push('La calidad de lectura es baja. Requiere revisión manual.')

  return {
    amount,
    operationNumber,
    destinationAccount,
    senderDocument,
    senderName,
    date,
    rawText,
    confidence,
    source,
    warnings,
  }
}

async function extractPdfText(bytes: Buffer) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const document = await getDocument({
    data: new Uint8Array(bytes),
    disableFontFace: true,
    useSystemFonts: true,
  }).promise
  const pages: string[] = []

  for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, 6); pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    const lines = new Map<number, string[]>()

    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue
      const y = Math.round(('transform' in item ? item.transform[5] : 0) / 3) * 3
      lines.set(y, [...(lines.get(y) ?? []), item.str.trim()])
    }

    pages.push([...lines.entries()]
      .sort(([a], [b]) => b - a)
      .map(([, words]) => words.join(' '))
      .join('\n'))
  }

  return normalizeText(pages.join('\n\n'))
}

async function preprocessImage(bytes: Buffer, threshold = false) {
  let pipeline = sharp(bytes)
    .rotate()
    .flatten({ background: '#ffffff' })
    .resize({ width: 1800, height: 2400, fit: 'inside', withoutEnlargement: false })
    .grayscale()
    .normalize()
    .sharpen()

  if (threshold) pipeline = pipeline.threshold(178)
  return pipeline.png({ compressionLevel: 6 }).toBuffer()
}

async function recognizeImage(bytes: Buffer) {
  const { createWorker, PSM } = await import('tesseract.js')
  const worker = await createWorker('spa+eng', 1, {
    cachePath: tmpdir(),
    cacheMethod: 'write',
    logger: () => undefined,
  })

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
    })
    const primary = await worker.recognize(await preprocessImage(bytes))
    let best = primary

    if (primary.data.confidence < 58 || primary.data.text.trim().length < 45) {
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT })
      const fallback = await worker.recognize(await preprocessImage(bytes, true))
      if (fallback.data.confidence > primary.data.confidence || fallback.data.text.length > primary.data.text.length * 1.25) {
        best = fallback
      }
    }

    return {
      text: best.data.text,
      confidence: Number.isFinite(best.data.confidence) ? best.data.confidence / 100 : null,
    }
  } finally {
    await worker.terminate()
  }
}

export function parseReceiptText(
  text: string,
  input: Omit<ReceiptOcrInput, 'bytes' | 'contentType' | 'filename'> = {},
  options: { confidence?: number | null; source?: ParsedReceiptData['source'] } = {},
) {
  return buildParsedReceipt(text, {
    bytes: Buffer.alloc(0),
    contentType: 'text/plain',
    filename: 'receipt.txt',
    ...input,
  }, options.confidence ?? null, options.source ?? 'image_ocr')
}

export async function parseReceiptWithFreeOcr(input: ReceiptOcrInput): Promise<ParsedReceiptData> {
  const contentType = input.contentType.toLowerCase().split(';')[0]
  const isPdf = contentType === 'application/pdf' || input.filename.toLowerCase().endsWith('.pdf')

  if (isPdf) {
    const text = await extractPdfText(input.bytes)
    if (text.length < 30) {
      throw new Error('El PDF no contiene texto seleccionable. Abrilo y marcá revisión manual, o subí una captura JPG/PNG/WebP.')
    }
    return buildParsedReceipt(text, input, null, 'pdf_text')
  }

  if (!IMAGE_CONTENT_TYPES.has(contentType)) {
    throw new Error('El OCR solo puede leer imágenes JPG, PNG, WebP, BMP, TIFF o comprobantes PDF.')
  }

  const result = await recognizeImage(input.bytes)
  if (!result.text.trim()) {
    throw new Error('No se detectó texto. Subí una captura completa, derecha y con buena resolución.')
  }

  return buildParsedReceipt(result.text, input, result.confidence, 'image_ocr')
}
