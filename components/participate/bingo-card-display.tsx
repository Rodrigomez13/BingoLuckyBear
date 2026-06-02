'use client'

import { useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BearLogo } from '@/components/bear-logo'
import { CheckCircle, Download, Eye, X, Hash, Trophy, Share2 } from 'lucide-react'
import { getBingoColumnLabels, getBingoRows, getWinningLines, isMarked } from '@/lib/bingo'

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
}

const HEADER_COLORS = [
  'bg-red-500',
  'bg-orange-500', 
  'bg-amber-500',
  'bg-green-500',
  'bg-blue-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-pink-500',
  'bg-emerald-500',
]

export function BingoCardDisplay({ card, raffleName, drawnNumbers = [], compact = false, autoOpen = false }: BingoCardDisplayProps) {
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

  const downloadCard = async () => {
    let downloadBtn: HTMLButtonElement | null = null
    try {
      // Buscar el botón de descarga y deshabilitarlo
      downloadBtn = document.querySelector('button:has(svg:nth-of-type(1))') as HTMLButtonElement
      if (downloadBtn) {
        downloadBtn.disabled = true
      }

      const target = modalCardRef.current ?? cardPreviewRef.current
      if (!target) {
        throw new Error('No se encontró el carton para descargar')
      }

      // Importar html2canvas
      const { default: html2canvas } = await import('html2canvas')
      
      // Esperar un poco para que todo esté renderizado
      await new Promise(resolve => setTimeout(resolve, 500))

      // Esperar a que las imágenes se carguen
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

      // Generar canvas con opciones optimizadas
      const canvas = await html2canvas(target, {
        backgroundColor: '#09090b',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: target.scrollWidth,
        windowHeight: target.scrollHeight,
        imageTimeout: 10000,
        foreignObjectRendering: false,
      })

      // Convertir canvas a PNG blob
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
          
          // Limpiar
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
      // Re-habilitar botón
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
      className={`rounded-md bg-gradient-to-br from-zinc-950/95 via-zinc-900/95 to-amber-950/90 ${
        forDownload ? 'p-3 sm:p-4' : 'p-3 sm:p-4'
      }`}
    >
      {/* Card Header */}
      <div className="mb-3 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <BearLogo size={forDownload ? 38 : 30} />
          <h2
            className={`font-semibold tracking-tight text-white ${forDownload ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}`}
          >
            Lucky Bingo Bear
          </h2>
        </div>
        <p className={`text-amber-200 ${forDownload ? 'text-sm sm:text-base' : 'text-sm'}`}>{raffleName}</p>
        <Badge className="mt-2 bg-amber-500 hover:bg-amber-500 text-white">
          <Hash className="w-3 h-3 mr-1" />
          {card.card_number}
        </Badge>
      </div>

      {/* Bingo Grid */}
      <div className="overflow-hidden rounded-md border-[3px] border-amber-400 bg-zinc-950 shadow-lg">
        {/* Bingo Header */}
        <div
          className="grid"
          style={{ gridTemplateColumns: `${columnLabels.length === 9 ? '2.5rem ' : ''}repeat(${columnLabels.length}, minmax(0, 1fr))` }}
        >
          {columnLabels.length === 9 && (
            <div className="bg-amber-800 py-2 text-center text-[9px] font-medium leading-none text-amber-100">P</div>
          )}
          {columnLabels.map((letter, i) => (
            <div 
              key={letter}
              className={`${HEADER_COLORS[i]} text-center font-medium leading-none tracking-tight text-white ${forDownload ? 'px-0.5 py-2 text-[9px] sm:text-[10px]' : 'px-0.5 py-2 text-[8px] sm:text-[9px]'}`}
            >
              {letter}
            </div>
          ))}
        </div>

        {/* Numbers Grid */}
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="grid border-t border-amber-200"
            style={{ gridTemplateColumns: `${columnLabels.length === 9 ? '2.5rem ' : ''}repeat(${columnLabels.length}, minmax(0, 1fr))` }}
          >
            {columnLabels.length === 9 && (
              <div className="flex items-center justify-center border-r border-amber-200 bg-amber-400 text-[10px] font-semibold text-zinc-950">
                P{rowIndex + 1}
              </div>
            )}
            {row.map((cell, colIndex) => {
              const marked = isMarked(cell, drawnNumbers)
              return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  ${forDownload ? 'h-9 text-sm sm:h-11 sm:text-base' : 'h-8 text-sm sm:h-10 sm:text-[15px]'} 
                  flex items-center justify-center border-r border-amber-200 font-semibold last:border-r-0
                  ${cell === null
                    ? 'bg-black/50 text-transparent'
                    : cell === 'FREE' 
                    ? 'bg-gradient-to-br from-amber-400 to-orange-400 text-white' 
                    : marked
                      ? 'bg-emerald-500 text-white shadow-inner'
                      : 'text-zinc-100 hover:bg-white/5'
                  }
                `}
              >
                {cell === null ? null : cell === 'FREE' ? (
                  <div className="text-center">
                    <span className={forDownload ? 'text-sm' : 'text-xs'}>FREE</span>
                  </div>
                ) : (
                  <span className={marked ? 'rounded-full bg-white/20 px-2 py-1' : ''}>{cell}</span>
                )}
              </div>
            )})}
          </div>
        ))}
      </div>

      {/* Card Footer */}
      <div className={`mt-3 text-center ${forDownload ? 'text-sm' : 'text-sm'} text-amber-100`}>
        <p className="font-medium">{card.full_name}</p>
        <p className="font-medium text-amber-300">{formattedDate}</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {!compact && <div className="text-center">
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
      </div>}

      {isWinner && (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4 text-center text-emerald-100">
          <Trophy className="mx-auto mb-2 h-7 w-7 text-emerald-300" />
          Aviso automatico: este carton tiene una fila premiada con los numeros cantados.
        </div>
      )}

      {/* Bingo Card Preview */}
      <Card className="overflow-hidden border-zinc-800 bg-zinc-950/85 shadow-xl backdrop-blur-sm">
        <CardContent className="p-3 sm:p-4">
          <div ref={cardPreviewRef}>
            <BingoCardVisual />
          </div>

          {/* Action Buttons */}
          <div className="grid gap-3 mt-4 sm:grid-cols-3">
            <Button
              onClick={() => setShowModal(true)}
              variant="outline"
              className="h-11 w-full border-amber-400/40 bg-transparent text-sm font-semibold text-amber-200 hover:bg-amber-400/10"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Carton Completo
            </Button>
            <Button
              onClick={shareCard}
              variant="outline"
              className="h-11 w-full border-sky-300/40 bg-transparent text-sm font-semibold text-sky-100 hover:bg-sky-400/10"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </Button>
            <Button
              onClick={downloadCard}
              className="h-11 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-semibold text-white hover:from-amber-600 hover:to-orange-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <div className="bg-amber-400/10 border border-amber-400/25 rounded-lg p-4">
        <p className="text-amber-100 text-sm">
          <strong>Importante:</strong> Guarda tu numero de carton <strong>{card.card_number}</strong>. 
          Lo necesitaras para verificar si ganaste cuando se realice el sorteo.
          Te recomendamos descargar la imagen de tu carton.
        </p>
      </div>

      {/* Full Screen Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm">
          <div className="relative flex max-h-[calc(100dvh-1.5rem)] w-[min(96vw,520px)] flex-col overflow-hidden rounded-[1.25rem] border border-amber-400/25 bg-zinc-950/95 shadow-2xl shadow-black/50">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-3 top-3 z-20 rounded-full bg-zinc-900/90 p-2 transition-colors hover:bg-zinc-800"
            >
              <X className="w-5 h-5 text-amber-200" />
            </button>
            
            <div className="min-h-0 flex-1 p-3 sm:p-4">
              <div ref={modalCardRef}>
              <BingoCardVisual forDownload={true} />
              </div>
            </div>

            <div className="grid shrink-0 gap-2 border-t border-zinc-800 bg-zinc-950/95 p-3 sm:grid-cols-2">
              <Button onClick={shareCard} variant="outline" className="w-full border-sky-300/40 bg-transparent text-sky-100 hover:bg-sky-400/10">
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </Button>
              <Button
                onClick={downloadCard}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar Carton
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
