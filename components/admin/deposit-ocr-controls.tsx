'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  disabled,
}: {
  id: string
  disabled?: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<'ocr' | 'manual' | null>(null)

  const run = async (action: 'ocr' | 'manual') => {
    setBusy(action)
    try {
      const response = await fetch(`/api/admin/deposits/${id}/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(action === 'manual' ? { action: 'manual' } : {}),
      })
      const data = await readApiResponse(response)
      if (!response.ok) throw new Error(data.error || 'No se pudo revisar el comprobante')
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo revisar el comprobante')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled={disabled || busy !== null}
        data-sound="ui.open"
        onClick={() => void run('ocr')}
        title="Leer y validar comprobante con OCR gratuito"
        className="border-sky-400/40 bg-transparent text-sky-200 hover:bg-sky-500/10"
      >
        {busy === 'ocr' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
      </Button>
      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled={disabled || busy !== null}
        data-sound="ui.click"
        onClick={() => void run('manual')}
        title="Marcar comprobante como revisado manualmente"
        className="border-zinc-600 bg-transparent text-zinc-300 hover:bg-white/10"
      >
        {busy === 'manual' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  )
}
