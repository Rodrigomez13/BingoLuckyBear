'use client'

export interface BrowserReceiptOcrResult {
  rawText: string
  confidence: number | null
  source: 'browser_ocr'
}

export interface BrowserReceiptOcrProgress {
  status: string
  progress: number
}

const IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'])

function normalizeText(value: string) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function canReadReceiptInBrowser(file: File | null | undefined) {
  if (!file) return false
  return IMAGE_TYPES.has(file.type.toLowerCase())
}

export async function readReceiptTextInBrowser(
  file: File,
  onProgress?: (progress: BrowserReceiptOcrProgress) => void,
): Promise<BrowserReceiptOcrResult | null> {
  if (!canReadReceiptInBrowser(file)) return null

  const { createWorker, PSM } = await import('tesseract.js')
  const worker = await createWorker('eng', 1, {
    logger: (message) => {
      if (typeof message.status !== 'string') return
      onProgress?.({
        status: message.status,
        progress: typeof message.progress === 'number' ? message.progress : 0,
      })
    },
  })

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      preserve_interword_spaces: '1',
      user_defined_dpi: '220',
    })

    const result = await worker.recognize(file)
    const rawText = normalizeText(result.data.text)
    if (!rawText) return null

    return {
      rawText,
      confidence: Number.isFinite(result.data.confidence) ? result.data.confidence / 100 : null,
      source: 'browser_ocr',
    }
  } finally {
    await worker.terminate().catch(() => undefined)
  }
}
