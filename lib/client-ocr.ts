'use client'

export interface ClientOcrResult {
  text: string
  confidence: number | null
}

const PDF_EXTENSION = /\.pdf$/i

export function isPdfReceipt(value?: string | null) {
  return Boolean(value && (PDF_EXTENSION.test(value) || value.toLowerCase().includes('application/pdf')))
}

/**
 * Runs Tesseract OCR entirely in the browser. This avoids the Vercel serverless
 * limits (cold starts, missing sharp/libvips binaries, function timeouts) that
 * make server-side OCR unreliable. The worker downloads the WASM core and the
 * Spanish/English language data from the CDN on first use and caches it.
 */
export async function runClientOcr(
  image: Blob,
  onProgress?: (ratio: number) => void,
): Promise<ClientOcrResult> {
  const { createWorker, PSM } = await import('tesseract.js')

  const worker = await createWorker('spa+eng', 1, {
    logger: (message) => {
      if (message.status === 'recognizing text' && typeof message.progress === 'number') {
        onProgress?.(message.progress)
      }
    },
  })

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
    })

    const result = await worker.recognize(image)
    const confidence = Number.isFinite(result.data.confidence) ? result.data.confidence / 100 : null

    return { text: result.data.text ?? '', confidence }
  } finally {
    await worker.terminate().catch(() => undefined)
  }
}

/** Downloads a private receipt image so the browser can OCR it. */
export async function fetchReceiptBlob(pathname: string): Promise<Blob> {
  const response = await fetch(`/api/file?pathname=${encodeURIComponent(pathname)}`, {
    headers: { Accept: 'image/*' },
  })
  if (!response.ok) {
    throw new Error(`No se pudo descargar el comprobante (HTTP ${response.status}).`)
  }
  return response.blob()
}
