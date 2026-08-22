'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, FileDown } from 'lucide-react'
import Link from 'next/link'

interface BingoCard {
  id: string
  card_number: string
  full_name: string
  created_at: string
  bingo_numbers: number[][]
  payment_status?: 'pending' | 'approved' | 'rejected' | null
}

interface PurchaseConfirmationProps {
  cards: BingoCard[]
  raffle: {
    id: string
    name: string
    draw_date?: string | null
  }
  receiptUrl?: string
  onContinue: () => void
}

export function PurchaseConfirmation({ 
  cards, 
  raffle, 
  receiptUrl, 
  onContinue 
}: PurchaseConfirmationProps) {
  const handleDownloadReceipt = async () => {
    if (!receiptUrl) return

    try {
      const response = await fetch(`/api/file?pathname=${encodeURIComponent(receiptUrl)}`)
      if (!response.ok) {
        throw new Error('No se pudo descargar el comprobante')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      // Determine file extension based on receipt URL
      const ext = receiptUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'png'
      link.download = `comprobante-${cards[0].card_number}.${ext}`
      link.href = url
      link.click()
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading receipt:', error)
      alert('No se pudo descargar el comprobante. Intenta nuevamente.')
    }
  }

  const formattedDate = new Date(cards[0].created_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <Card className="w-full max-w-2xl border-emerald-400/50 bg-zinc-950/95 shadow-2xl shadow-emerald-950/50 backdrop-blur-sm">
        <CardHeader className="border-b border-emerald-400/30 text-center">
          <div className="mb-4 flex justify-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 animate-bounce" />
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-300">
            ¡Compra Realizada!
          </CardTitle>
          <CardDescription className="text-zinc-300">
            Tu{' '}
            {cards.length === 1
              ? `carton ${cards[0].card_number} para ${raffle.name}`
              : `${cards.length} cartones para ${raffle.name}`}{' '}
            ha sido creado exitosamente
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Confirmation Details */}
          <div className="space-y-4 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-emerald-200">Detalles de la compra:</p>
              <div className="grid gap-2 text-sm text-zinc-300">
                <div className="flex justify-between">
                  <span>Cartones:</span>
                  <span className="font-semibold text-white">{cards.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Numeros de carton:</span>
                  <span className="font-semibold text-white">
                    {cards.map((c) => c.card_number).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Nombre:</span>
                  <span className="font-semibold text-white">{cards[0].full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fecha de compra:</span>
                  <span className="font-semibold text-white">{formattedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sorteo:</span>
                  <span className="font-semibold text-white">{raffle.name}</span>
                </div>
              </div>
            </div>
          </div>

          {receiptUrl && <div className="space-y-3 rounded-lg border border-amber-400/20 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-amber-200">
              Tu comprobante de pago
            </p>
            <p className="text-xs text-zinc-400">
              Descarga el comprobante de transferencia que subiste. Lo necesitaras como referencia de tu pago.
            </p>
            <Button
              onClick={handleDownloadReceipt}
              className="w-full bg-amber-500 font-bold text-zinc-950 hover:bg-amber-400"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Descargar Comprobante
            </Button>
          </div>}

          {/* Next Steps */}
          <div className="space-y-3 rounded-lg border border-blue-400/20 bg-blue-500/10 p-4">
            <p className="text-sm font-semibold text-blue-200">Próximos pasos:</p>
            <ul className="space-y-2 text-xs text-zinc-300">
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                <span>{cards[0].payment_status === 'approved' ? 'Tu cartón ya está participando en el sorteo.' : 'Tu cartón participará cuando el comprobante sea aprobado.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                <span>Cuando inicie el sorteo, verás las bolillas en vivo.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                <span>Si ganas, recibirás un WhatsApp con el premio y monto.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                <span>Comparte tu carton con amigos usando el botón de compartir.</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              asChild
              variant="outline"
              className="border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-900"
            >
              <Link href="/en-vivo">
                Ver sorteo
              </Link>
            </Button>
            <Button
              onClick={onContinue}
              className="bg-emerald-500 font-bold text-white hover:bg-emerald-600"
            >
              Continuar Comprando
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
