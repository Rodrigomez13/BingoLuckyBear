'use client'

import { useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BearLogo } from '@/components/bear-logo'
import { CheckCircle, Download, Eye, X, Hash, Trophy, Share2 } from 'lucide-react'
import { getBingoColumnLabels, getBingoRows, getWinningLines, isMarked } from '@/lib/bingo'
import { cn } from '@/lib/utils'

interface BingoCard {
  id: string
  card_number: string
  full_name: string
  created_at: string
  bingo_numbers: number[][]
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

  const formattedDate = new Date(card.created_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const rows = getBingoRows(card.bingo_numbers)
  const columnLabels = getBingoColumnLabels(card.bingo_numbers)
  const winningLines = getWinningLines(card.bingo_numbers, drawnNumbers)
  const isWinner = winningLines.length > 0
  const hasPrizeColumn = columnLabels.length === 9
  const prizeColumnWidth = dense ? 'clamp(1.55rem, 6vw, 2.6rem)' : 'clamp(1.85rem, 7vw, 3.45rem)'
  const gridTemplateColumns = `${hasPrizeColumn ? `${prizeColumnWidth} ` : ''}repeat(${columnLabels.length}, minmax(0, 1fr))`

  const downloadCard = async () => {
    let downloadBtn: HTMLButtonElement | null = null
    try {
      downloadBtn = document.querySelector('button:has(svg:nth-of-type(1))') as HTMLButtonElement
      if (downloadBtn) {
        downloadBtn.disabled = true
      }

      const target = modalCardRef.current ?? cardPreviewRef.current
      if (!target) {
        throw new Error('No se encontro el carton para descargar')
      }

      const { default: html2canvas } = await import('html2canvas')

      await new Promise((resolve) => setTimeout(resolve, 500))

      await Promise.all(
        Array.from(target.querySelectorAll('img')).map((image: HTMLImageElement) => {
          return new Promise<void>((resolve) => {
            if (image.complete) {
              resolve()
            } else {
              const timeout = setTimeout(() => {
                image.removeEventListener('load', onLoad)
                image.removeEventListener('error', onError)
                resolve()
              }, 3000)

              const onLoad = () => {
                clearTimeout(timeout)
                image.removeEventListener('load', onLoad)
                image.removeEventListener('error', onError)
                resolve()
              }
              const onError = () => {
                clearTimeout(timeout)
                image.removeEventListener('load', onLoad)
                image.removeEventListener('error', onError)
                resolve()
              }
              image.addEventListener('load', onLoad)
              image.addEventListener('error', onError)
            }
          })
        })
      )

      const canvas = await html2canvas(target, {
        backgroundColor: '#060a08',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: target.scrollWidth,
        windowHeight: target.scrollHeight,
        imageTimeout: 10000,
        foreignObjectRendering: false,
      })

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            throw new Error('No se pudo generar la imagen del carton')
          }

          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `carton-${card.card_number}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          setTimeout(() => {
            URL.revokeObjectURL(url)
          }, 100)
        },
        'image/png',
        0.95
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      console.error('Error downloading card:', error)
      alert(`No se pudo descargar el carton: ${message}. Intenta nuevamente.`)
    } finally {
      if (downloadBtn) {
        downloadBtn.disabled = false
      }
    }
  }

  const shareCard = async () => {
    const text = `Mi carton ${card.card_number} participa en ${raffleName}.`
    const url = `${window.location.origin}/participar`

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Lucky Bingo Bear',
          text,
          url,
        })
        return
      }

      await navigator.clipboard.writeText(`${text} ${url}`)
    } catch (error) {
      console.error('Error sharing card:', error)
    }
  }

  const BingoCardVisual = ({ forDownload = false }: { forDownload?: boolean }) => (
    <div
      className={cn(
        'relative mx-auto w-full max-w-[720px] overflow-hidden rounded-[clamp(1rem,4vw,1.5rem)] border border-amber-500/20 bg-gradient-to-b from-[#0a1410] via-[#08100c] to-[#060a08] shadow-2xl shadow-black/40',
        dense && !forDownload && 'max-w-[560px] rounded-[clamp(0.85rem,3vw,1.25rem)]',
        forDownload ? 'p-4 sm:p-6 md:p-8' : dense ? 'p-2.5 sm:p-3.5' : 'p-3 sm:p-5'
      )}
    >
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col items-center gap-2.5 text-center sm:gap-3">
          <div className="flex max-w-full items-center justify-center gap-2">
            <BearLogo size={forDownload ? 44 : dense ? 28 : 34} className="shrink-0" />
            <h2
              className={cn(
                'min-w-0 text-balance font-extrabold tracking-tight text-amber-50',
                forDownload ? 'text-xl sm:text-2xl md:text-3xl' : dense ? 'text-base sm:text-lg' : 'text-lg sm:text-xl md:text-2xl'
              )}
            >
              Lucky Bingo Bear
            </h2>
          </div>
          <p className={cn('max-w-full text-balance font-semibold leading-snug text-amber-300', forDownload ? 'text-sm sm:text-base md:text-lg' : dense ? 'text-xs sm:text-sm' : 'text-sm sm:text-base')}>
            {raffleName}
          </p>
          <Badge className={cn(
            'max-w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-amber-950 shadow-lg shadow-orange-900/40 hover:from-amber-500 hover:to-orange-500',
            dense && !forDownload ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs sm:px-4 sm:text-sm'
          )}>
            <Hash className="mr-1 h-3.5 w-3.5 opacity-70" />
            <span className="min-w-0 truncate">{card.card_number}</span>
          </Badge>
        </div>

        <div className={cn(
          'overflow-hidden rounded-[clamp(0.75rem,3vw,1rem)] border-2 border-amber-500/60 bg-black p-[clamp(0.2rem,0.9vw,0.375rem)] shadow-inner',
          dense && !forDownload ? 'mt-3 sm:mt-4' : 'mt-4 sm:mt-6'
        )}>
          <div className="grid gap-[clamp(0.125rem,0.8vw,0.25rem)]" style={{ gridTemplateColumns }}>
            {hasPrizeColumn && (
              <HeaderCell className="bg-gradient-to-b from-amber-400 to-amber-500 text-amber-950">
                P
              </HeaderCell>
            )}
            {columnLabels.map((label) => (
              <HeaderCell key={label} className="bg-emerald-900 text-amber-200 ring-1 ring-inset ring-emerald-700/50">
                {label}
              </HeaderCell>
            ))}
          </div>

          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="mt-[clamp(0.125rem,0.8vw,0.25rem)] grid gap-[clamp(0.125rem,0.8vw,0.25rem)]" style={{ gridTemplateColumns }}>
              {hasPrizeColumn && (
                <div
                  className={cn(
                    'flex aspect-[0.72/1] min-h-8 items-center justify-center rounded-[clamp(0.45rem,2vw,0.75rem)] bg-gradient-to-b from-amber-400 to-amber-500 font-extrabold leading-none text-amber-950',
                    forDownload ? 'text-sm sm:text-base' : dense ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm md:text-base',
                    dense && !forDownload && 'min-h-6'
                  )}
                >
                  P{rowIndex + 1}
                </div>
              )}
              {row.map((cell, colIndex) => {
                const marked = isMarked(cell, drawnNumbers)

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={cn(
                      'flex aspect-[0.72/1] min-h-8 items-center justify-center rounded-[clamp(0.45rem,2vw,0.75rem)] bg-[#0a0a0a] font-extrabold leading-none tabular-nums text-white',
                      forDownload ? 'text-lg sm:text-xl md:text-2xl' : dense ? 'text-sm sm:text-base md:text-lg' : 'text-base sm:text-xl md:text-2xl',
                      dense && !forDownload && 'min-h-6',
                      cell === null && 'text-transparent',
                      cell === 'FREE' && (dense && !forDownload ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-[10px] text-amber-950 sm:text-xs' : 'bg-gradient-to-b from-amber-400 to-amber-500 text-sm text-amber-950 sm:text-base'),
                      marked && cell !== null && 'bg-emerald-600 text-white ring-2 ring-inset ring-amber-300/60 shadow-inner'
                    )}
                  >
                    {cell ?? ''}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className={cn('text-center', dense && !forDownload ? 'mt-3' : 'mt-4 sm:mt-5')}>
          <p className={cn('break-words font-bold text-amber-50', dense && !forDownload ? 'text-xs sm:text-sm' : 'text-sm sm:text-base')}>{card.full_name}</p>
          <p className={cn('font-semibold text-amber-300', dense && !forDownload ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm')}>{formattedDate}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {!compact && (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15 mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-300" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {isWinner ? 'Tenemos un ganador' : 'Ya estas participando'}
          </h1>
          <p className="text-zinc-300">
            {isWinner
              ? `Fila premiada: ${winningLines.join(', ')}`
              : 'Tu carton de bingo ha sido generado exitosamente'}
          </p>
        </div>
      )}

      {isWinner && (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4 text-center text-emerald-100">
          <Trophy className="mx-auto mb-2 h-7 w-7 text-emerald-300" />
          Aviso automatico: este carton tiene una fila premiada con los numeros cantados.
        </div>
      )}

      <Card className="overflow-hidden border-zinc-800 bg-zinc-950/85 shadow-xl backdrop-blur-sm">
        <CardContent className={cn(dense ? 'p-2 sm:p-3' : 'p-2 sm:p-4')}>
          <div ref={cardPreviewRef}>
            <BingoCardVisual />
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

      <div className={cn('rounded-lg border border-amber-400/25 bg-amber-400/10', dense ? 'p-3' : 'p-4')}>
        <p className="text-amber-100 text-sm">
          <strong>Importante:</strong> Guarda tu numero de carton <strong>{card.card_number}</strong>.
          Lo necesitaras para verificar si ganaste cuando se realice el sorteo.
          Te recomendamos descargar la imagen de tu carton.
        </p>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm">
          <div className="relative flex max-h-[calc(100dvh-1.5rem)] w-[min(96vw,760px)] flex-col overflow-hidden rounded-3xl border border-amber-400/25 bg-zinc-950/95 shadow-2xl shadow-black/50">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 z-20 text-amber-300/80 transition hover:text-amber-200"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-4">
              <div ref={modalCardRef}>
                <BingoCardVisual forDownload={true} />
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

function HeaderCell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex aspect-[0.72/1] min-h-8 items-center justify-center rounded-[clamp(0.45rem,2vw,0.75rem)] px-0.5 text-center text-[clamp(0.58rem,2.25vw,0.875rem)] font-bold leading-tight sm:px-1', className)}>
      {children}
    </div>
  )
}
