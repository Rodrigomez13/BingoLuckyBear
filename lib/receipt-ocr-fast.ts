import { tmpdir } from 'node:os'
import { parseReceiptText, formatReceiptOcrError } from '@/lib/receipt-ocr'
import type { ParsedReceiptData } from '@/lib/receipt-validation'

interface ReceiptOcrInput {
  bytes: Buffer
  contentType: string
  filename: string
  expectedAmount?: string | number | null
  expectedOperationNumber?: string | null
  expectedDestinationAccounts?: Array<string | null | undefined>
}

const IMAGE_CONTENT_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'])

function withTimeout<T>(promise: Promise<T>, ms: number, message: string) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ])
}

function normalizeText(value: string) {
  return value.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

async function extractPdfText(bytes: Buffer) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const document = await withTimeout(
    getDocument({ data: new Uint8Array(bytes), disableFontFace: true, useSystemFonts: true }).promise,
    10_000,
    'La lectura del PDF demoró demasiado. Usá revisión manual o subí una captura JPG/PNG/WebP.',
  )
  const pages: string[] = []

  for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, 3); pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    const lines = new Map<number, string[]>()

    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue
      const y = Math.round(('transform' in item ? item.transform[5] : 0) / 3) * 3
      lines.set(y, [...(lines.get(y) ?? []), item.str.trim()])
    }

    pages.push([...lines.entries()].sort(([a], [b]) => b - a).map(([, words]) => words.join(' ')).join('\n'))
  }

  return normalizeText(pages.join('\n\n'))
}

async function preprocessForTesseract(bytes: Buffer) {
  const sharp = await import('sharp').then((mod) => mod.default).catch((error) => {
    throw new Error(formatReceiptOcrError(error))
  })

  const metadata = await withTimeout(
    sharp(bytes, { limitInputPixels: 25_000_000 }).metadata(),
    2_000,
    'No se pudo inspeccionar la imagen a tiempo. Subí una captura más liviana o usá revisión manual.',
  )

  const smallImage = Number(metadata.width ?? 0) > 0 && Number(metadata.width ?? 0) < 700 && bytes.byteLength < 2_500_000

  return withTimeout(
    sharp(bytes, { limitInputPixels: 25_000_000 })
      .rotate()
      .flatten({ background: '#ffffff' })
      .resize({ width: 1000, height: 1350, fit: 'inside', withoutEnlargement: !smallImage })
      .grayscale()
      .normalize()
      .sharpen({ sigma: 0.65 })
      .png({ compressionLevel: 9, palette: true })
      .toBuffer(),
    5_000,
    'La preparación de imagen demoró demasiado. Subí una captura más liviana o usá revisión manual.',
  )
}

async function recognizeFast(bytes: Buffer) {
  const { createWorker, PSM } = await import('tesseract.js')
  const worker = await withTimeout(
    createWorker('eng', 1, { cachePath: tmpdir(), cacheMethod: 'write', logger: () => undefined }),
    20_000,
    'El motor OCR no pudo iniciar en Vercel. Usá revisión manual para este comprobante.',
  )

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      preserve_interword_spaces: '1',
      user_defined_dpi: '220',
    })

    const prepared = await preprocessForTesseract(bytes)
    const result = await withTimeout(
      worker.recognize(prepared),
      22_000,
      'El OCR demoró demasiado. Subí una captura más liviana o usá revisión manual.',
    )

    return {
      text: result.data.text,
      confidence: Number.isFinite(result.data.confidence) ? result.data.confidence / 100 : null,
    }
  } finally {
    await worker.terminate().catch(() => undefined)
  }
}

export async function parseReceiptWithFreeOcr(input: ReceiptOcrInput): Promise<ParsedReceiptData> {
  const contentType = input.contentType.toLowerCase().split(';')[0]
  const isPdf = contentType === 'application/pdf' || input.filename.toLowerCase().endsWith('.pdf')

  if (isPdf) {
    const text = await extractPdfText(input.bytes)
    if (text.length < 30) throw new Error('El PDF no contiene texto seleccionable. Usá revisión manual o subí una captura JPG/PNG/WebP.')
    return parseReceiptText(text, input, { confidence: null, source: 'pdf_text' })
  }

  if (!IMAGE_CONTENT_TYPES.has(contentType)) {
    throw new Error('El OCR solo puede leer JPG, PNG, WebP, BMP, TIFF o PDF.')
  }

  const result = await recognizeFast(input.bytes)
  if (!result.text.trim()) throw new Error('No se detectó texto. Usá una captura completa y legible o revisión manual.')

  return parseReceiptText(result.text, input, { confidence: result.confidence, source: 'image_ocr' })
}
