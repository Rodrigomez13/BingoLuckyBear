'use client'

import { useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, Download, Eye, Share2, Trophy, X } from 'lucide-react'
import { getWinningLines } from '@/lib/bingo'
import { cn } from '@/lib/utils'
import { BingoCardArtboard } from './bingo-card-artboard'

interface BingoCard {
  id: string
  card_number: string
  full_name: string
  created_at: string
  bingo_numbers: number[][]
  payment_status?: 'pending' | 'approved' | 'rejected' | null
}

interface BingoCardDisplayProps {
  card: BingoCard
  raffleName: string
  drawnNumbers?: number[]
  compact?: boolean
  autoOpen?: boolean
  dense?: boolean
}

export function BingoCardDisplay({ card, raffleName, drawnNumbers = [], compact = false, autoOpen = false, dense = false }: BingoCardDisplayProps) {
  const [showModal, setShowModal] = useState(autoOpen)
  const cardPreviewRef = useRef<HTMLDivElement>(null)
  const modalCardRef = useRef<HTMLDivElement>(null)
  const paymentStatus = card.payment_status ?? 'pending'
  const isApproved = paymentStatus === 'approved'
  const isRejected = paymentStatus === 'rejected'
  const winningLines = isApproved ? getWinningLines(card.bingo_numbers, drawnNumbers) : []
  const isWinner = winningLines.length > 0

  const downloadCard = async () => {
    try {
      const target = modalCardRef.current ?? cardPreviewRef.current
      if (!target) throw new Error('No se encontro el carton para descargar')

      const { default: html2canvas } = await import('html2canvas')
      await new Promise((resolve) => setTimeout(resolve, 250))

      await Promise.all(
        Array.from(target.querySelectorAll('img')).map((image: HTMLImageElement) => {
          return new Promise<void>((resolve) => {
            if (image.complete) return resolve()
            const timeout = window.setTimeout(resolve, 2500)
            image.addEventListener('load', () => {
              window.clearTimeout(timeout)
              resolve()
            }, { once: true })
            image.addEventListener('error', () => {
              window.clearTimeout(timeout)
              resolve()
            }, { once: true })
          })
        }),
      )

      const artboard = target.querySelector('[data-bingo-artboard="true"]') as HTMLElement | null
      const exportTarget = artboard ?? target
      const canvas = await html2canvas(exportTarget, {
        backgroundColor: '#06100c',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 10000,
        foreignObjectRendering: false,
      })

      canvas.toBlob((blob) => {
        if (!blob) throw new Error('No se pudo generar la imagen del carton')
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `carton-${card.card_number}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.setTimeout(() => URL.revokeObjectURL(url), 100)
      }, 'image/png', 0.95)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      console.error('Error downloading card:', error)
      alert(`No se pudo descargar el carton: ${message}. Intenta nuevamente.`)
    }
  }

  const shareCard = async () => {
    const text = isApproved
      ? `Mi carton ${card.card_number} participa en ${raffleName}.`
      : `Mi solicitud de carton ${card.card_number} para ${raffleName} esta pendiente de aprobacion.`
    const url = `${window.location.origin}/participar`

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Lucky Bingo Bear', text, url })
        return
      }
      await navigator.clipboard.writeText(`${text} ${url}`)
    } catch (error) {
      console.error('Error sharing card:', error)
    }
  }

  return (
    <div className="space-y-6">
      {!compact && (
        <div className="text-center">
          <div className={cn('mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full', isApproved ? 'bg-emerald-500/15' : 'bg-amber-400/15')}>
            {isApproved ? <CheckCircle className="h-8 w-8 text-emerald-300" /> : <AlertTriangle className="h-8 w-8 text-amber-300" />}
          </div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {isWinner ? 'Tenemos un ganador' : isApproved ? 'Ya estas participando' : 'Carton pendiente de aprobacion'}
          </h1>
          <p className="text-zinc-300">
            {isWinner
              ? `Fila premiada: ${winningLines.join(', ')}`
              : isApproved
                ? 'Tu carton de bingo fue aprobado y participa oficialmente.'
                : 'Recibimos tu comprobante. El carton se habilita cuando el administrador apruebe el pago.'}
          </p>
        </div>
      )}

      {isWinner && (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4 text-center text-emerald-100">
          <Trophy className="mx-auto mb-2 h-7 w-7 text-emerald-300" />
          Aviso automatico: este carton tiene una fila premiada con los numeros cantados.
        </div>
      )}

      {!isApproved && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-center text-amber-100">
          <AlertTriangle className="mx-auto mb-2 h-6 w-6" />
          {isRejected
            ? 'El pago de este carton fue rechazado. Contacta al administrador para regularizarlo.'
            : 'Este carton esta registrado, pero todavia no participa del sorteo hasta que el pago sea aprobado.'}
        </div>
      )}

      <Card className="overflow-hidden border-zinc-800 bg-zinc-950/85 shadow-xl backdrop-blur-sm">
        <CardContent className={cn(dense ? 'p-2 sm:p-3' : 'p-2 sm:p-4')}>
          <div ref={cardPreviewRef}>
            <BingoCardArtboard card={card} raffleName={raffleName} drawnNumbers={drawnNumbers} />
          </div>

          <div className={cn('grid gap-3 min-[560px]:grid-cols-3', dense ? 'mt-3' : 'mt-4')}>
            <Button
              onClick={() => setShowModal(true)}
              variant="outline"
              className={cn('h-auto w-full whitespace-normal border-amber-400/40 bg-transparent px-3 font-semibold leading-tight text-amber-200 hover:bg-amber-400/10', dense ? 'min-h-10 py-2 text-xs' : 'min-h-11 py-2.5 text-sm')}
            >
              <Eye className="mr-2 h-4 w-4 shrink-0" />
              Ver Carton Completo
            </Button>
            <Button
              onClick={shareCard}
              variant="outline"
              className={cn('h-auto w-full whitespace-normal border-sky-300/40 bg-transparent px-3 font-semibold leading-tight text-sky-100 hover:bg-sky-400/10', dense ? 'min-h-10 py-2 text-xs' : 'min-h-11 py-2.5 text-sm')}
            >
              <Share2 className="mr-2 h-4 w-4 shrink-0" />
              Compartir
            </Button>
            <Button
              onClick={downloadCard}
              className={cn('h-auto w-full whitespace-normal bg-gradient-to-r from-amber-500 to-orange-500 px-3 font-semibold leading-tight text-white hover:from-amber-600 hover:to-orange-600', dense ? 'min-h-10 py-2 text-xs' : 'min-h-11 py-2.5 text-sm')}
            >
              <Download className="mr-2 h-4 w-4 shrink-0" />
              Descargar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-50">
        <p>
          <strong>Importante:</strong> Guarda tu numero de carton <strong>{card.card_number}</strong>.
          {isApproved
            ? ' Este carton participa oficialmente del sorteo.'
            : ' Este carton queda pendiente hasta aprobar el comprobante.'}
        </p>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm">
          <div className="relative flex max-h-[calc(100dvh-1.5rem)] w-[min(96vw,820px)] flex-col overflow-hidden rounded-3xl border border-amber-400/25 bg-zinc-950/95 shadow-2xl shadow-black/50">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 z-20 text-amber-300/80 transition hover:text-amber-200"
              aria-label="Cerrar"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-4">
              <div ref={modalCardRef}>
                <BingoCardArtboard card={card} raffleName={raffleName} drawnNumbers={drawnNumbers} forDownload />
              </div>
            </div>

            <div className="grid shrink-0 gap-3 border-t border-amber-500/15 bg-black/40 p-3 sm:grid-cols-2 sm:p-5">
              <Button onClick={shareCard} variant="outline" className="h-auto min-h-12 w-full rounded-xl border-amber-500/30 bg-white/5 py-3 font-semibold text-amber-50 hover:bg-white/10">
                <Share2 className="mr-2 h-4 w-4 shrink-0" />
                Compartir
              </Button>
              <Button
                onClick={downloadCard}
                className="h-auto min-h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 font-bold text-amber-950 shadow-lg shadow-orange-900/40 hover:brightness-105"
              >
                <Download className="mr-2 h-4 w-4 shrink-0" />
                Descargar Carton
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
