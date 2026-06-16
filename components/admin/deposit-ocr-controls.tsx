'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchReceiptBlob, isPdfReceipt, runClientOcr } from '@/lib/client-ocr'

async function readApiResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  const snippet = text.replace(/\s+/g, ' ').slice(0, 180)
  throw new Error(
    `El servidor no devolvió JSON. Estado HTTP ${response.status}. `
    + `Respuesta recibida: ${snippet || 'vacía'}. `
    + 'Esto suele indicar una ruta API inexistente, un error HTML de Vercel/Next.js, sesión expirada o timeout del OCR.',
  )
}

export function DepositOcrControls({
  id,
  receiptUrl,
  disabled,
}: {
  id: string
  receiptUrl?: string | null
  disabled?: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<'ocr' | 'manual' | null>(null)
  const [progress, setProgress] = useState<string | null>(null)

  const run = async (action: 'ocr' | 'manual') => {
    setBusy(action)
    setProgress(null)
    try {
      let payload: Record<string, unknown> = action === 'manual' ? { action: 'manual' } : {}

      // Para imágenes corremos el OCR en el navegador (gratis y sin los límites
      // de Vercel) y enviamos solo el texto. Los PDF se leen en el servidor.
      if (action === 'ocr' && receiptUrl && !isPdfReceipt(receiptUrl)) {
        setProgress('Descargando…')
        const blob = await fetchReceiptBlob(receiptUrl)
        setProgress('OCR 0%')
        const { text, confidence } = await runClientOcr(blob, (ratio) => {
          setProgress(`OCR ${Math.round(ratio * 100)}%`)
        })
        setProgress('Validando…')
        payload = { ocrText: text, ocrConfidence: confidence }
      }

      const response = await fetch(`/api/admin/deposits/${id}/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await readApiResponse(response)
      if (!response.ok) throw new Error(data.error || 'No se pudo revisar el comprobante')
      if (data.ok === false && data.error) throw new Error(data.error)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo revisar el comprobante')
    } finally {
      setBusy(null)
      setProgress(null)
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {busy === 'ocr' && progress && <span className="text-xs font-semibold text-sky-300">{progress}</span>}
      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled={disabled || busy !== null}
        onClick={() => void run('ocr')}
        title="Leer y validar comprobante con OCR gratuito (se procesa en tu navegador)"
        className="border-sky-400/40 bg-transparent text-sky-200 hover:bg-sky-500/10"
      >
        {busy === 'ocr' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
      </Button>
      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled={disabled || busy !== null}
        onClick={() => void run('manual')}
        title="Marcar comprobante como revisado manualmente"
        className="border-zinc-600 bg-transparent text-zinc-300 hover:bg-white/10"
      >
        {busy === 'manual' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  )
}
