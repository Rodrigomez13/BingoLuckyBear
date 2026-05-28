'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BearLogo } from '@/components/bear-logo'
import { CheckCircle, Download, Eye, X, Hash, Trophy } from 'lucide-react'
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

export function BingoCardDisplay({ card, raffleName, drawnNumbers = [], compact = false }: BingoCardDisplayProps) {
  const [showModal, setShowModal] = useState(false)

  const formattedDate = new Date(card.created_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const rows = getBingoRows(card.bingo_numbers)
  const columnLabels = getBingoColumnLabels(card.bingo_numbers)
  const winningLines = getWinningLines(card.bingo_numbers, drawnNumbers)
  const isWinner = winningLines.length > 0

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  const drawCenteredText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSize: number,
    weight = '700',
    color = '#ffffff'
  ) => {
    let size = fontSize
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = color

    do {
      ctx.font = `${weight} ${size}px Arial`
      size -= 1
    } while (ctx.measureText(text).width > maxWidth && size > 14)

    ctx.fillText(text, x, y)
  }

  const drawLogoMark = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    const gradient = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius)
    gradient.addColorStop(0, '#fbbf24')
    gradient.addColorStop(1, '#f97316')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#451a03'
    ctx.beginPath()
    ctx.arc(x - radius * 0.42, y - radius * 0.58, radius * 0.22, 0, Math.PI * 2)
    ctx.arc(x + radius * 0.42, y - radius * 0.58, radius * 0.22, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#fff7ed'
    ctx.beginPath()
    ctx.arc(x, y + radius * 0.14, radius * 0.48, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#451a03'
    ctx.beginPath()
    ctx.arc(x - radius * 0.18, y - radius * 0.04, radius * 0.06, 0, Math.PI * 2)
    ctx.arc(x + radius * 0.18, y - radius * 0.04, radius * 0.06, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.arc(x, y + radius * 0.18, radius * 0.08, 0, Math.PI * 2)
    ctx.fill()
  }

  const loadLogoImage = () =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = '/logo-solo.svg'
    })

  const downloadCard = async () => {
    try {
      const canvas = document.createElement('canvas')
      const scale = 2
      const width = 720
      const height = 980
      canvas.width = width * scale
      canvas.height = height * scale

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.scale(scale, scale)

      const background = ctx.createLinearGradient(0, 0, width, height)
      background.addColorStop(0, '#09090b')
      background.addColorStop(0.62, '#18181b')
      background.addColorStop(1, '#3f1d08')
      ctx.fillStyle = background
      ctx.fillRect(0, 0, width, height)

      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 4
      drawRoundedRect(ctx, 32, 32, width - 64, height - 64, 22)
      ctx.stroke()

      try {
        const logo = await loadLogoImage()
        const logoSize = 76
        ctx.drawImage(logo, width / 2 - logoSize / 2, 48, logoSize, logoSize)
      } catch {
        drawLogoMark(ctx, width / 2, 86, 38)
      }
      drawCenteredText(ctx, 'Lucky Bingo Bear', width / 2, 150, 610, 34, '800')
      drawCenteredText(ctx, raffleName, width / 2, 190, 610, 22, '600', '#fde68a')

      ctx.fillStyle = '#f59e0b'
      drawRoundedRect(ctx, width / 2 - 145, 216, 290, 42, 20)
      ctx.fill()
      drawCenteredText(ctx, card.card_number, width / 2, 238, 245, 22, '900', '#111827')

      const gridX = 45
      const gridY = 292
      const columnCount = columnLabels.length
      const rowCount = rows.length
      const labelWidth = columnCount === 9 ? 42 : 0
      const cellSize = columnCount === 9 ? 70 : 112
      const headerHeight = 52
      const headerColors = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#3b82f6', '#0ea5e9', '#8b5cf6', '#ec4899', '#10b981']

      ctx.lineWidth = 6
      ctx.strokeStyle = '#fbbf24'
      drawRoundedRect(ctx, gridX - 3, gridY - 3, labelWidth + cellSize * columnCount + 6, headerHeight + cellSize * rowCount + 6, 16)
      ctx.stroke()

      if (labelWidth > 0) {
        ctx.fillStyle = '#78350f'
        ctx.fillRect(gridX, gridY, labelWidth, headerHeight)
        drawCenteredText(ctx, 'P', gridX + labelWidth / 2, gridY + headerHeight / 2, labelWidth - 8, 14, '700')
      }

      columnLabels.forEach((letter, index) => {
        ctx.fillStyle = headerColors[index]
        ctx.fillRect(gridX + labelWidth + index * cellSize, gridY, cellSize, headerHeight)
        ctx.fillStyle = '#ffffff'
        drawCenteredText(ctx, letter, gridX + labelWidth + index * cellSize + cellSize / 2, gridY + headerHeight / 2, cellSize - 10, columnCount === 9 ? 12 : 28, '600')
      })

      rows.forEach((row, rowIndex) => {
        if (labelWidth > 0) {
          const labelY = gridY + headerHeight + rowIndex * cellSize
          ctx.fillStyle = '#f59e0b'
          ctx.fillRect(gridX, labelY, labelWidth, cellSize)
          ctx.strokeStyle = '#fde68a'
          ctx.lineWidth = 2
          ctx.strokeRect(gridX, labelY, labelWidth, cellSize)
          drawCenteredText(ctx, `P${rowIndex + 1}`, gridX + labelWidth / 2, labelY + cellSize / 2, labelWidth - 8, 15, '700', '#111827')
        }

        row.forEach((cell, colIndex) => {
          const x = gridX + labelWidth + colIndex * cellSize
          const y = gridY + headerHeight + rowIndex * cellSize
          const marked = isMarked(cell, drawnNumbers)

          ctx.fillStyle = cell === null ? '#09090b' : cell === 'FREE' ? '#f59e0b' : marked ? '#10b981' : '#111827'
          ctx.fillRect(x, y, cellSize, cellSize)
          ctx.strokeStyle = '#fde68a'
          ctx.lineWidth = 2
          ctx.strokeRect(x, y, cellSize, cellSize)

          if (cell !== null) {
            drawCenteredText(ctx, String(cell), x + cellSize / 2, y + cellSize / 2, cellSize - 16, cell === 'FREE' ? 16 : 28, '700')
          }
        })
      })

      drawCenteredText(ctx, card.full_name, width / 2, 920, 610, 26, '800', '#fff7ed')
      drawCenteredText(ctx, formattedDate, width / 2, 950, 610, 18, '500', '#fcd34d')

      const link = document.createElement('a')
      link.download = `bingo-card-${card.card_number}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error downloading card:', error)
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
          <BingoCardVisual />

          {/* Action Buttons */}
          <div className="grid gap-3 mt-4 sm:grid-cols-2">
            <Button
              onClick={() => setShowModal(true)}
              variant="outline"
              className="h-11 w-full border-amber-400/40 bg-transparent text-sm font-semibold text-amber-200 hover:bg-amber-400/10"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Carton Completo
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
          <div className="relative flex max-h-[calc(100dvh-1.5rem)] w-[min(94vw,430px)] flex-col overflow-hidden rounded-lg border border-amber-400/25 bg-zinc-950/95 shadow-2xl shadow-black/50">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-3 top-3 z-20 rounded-full bg-zinc-900/90 p-2 transition-colors hover:bg-zinc-800"
            >
              <X className="w-5 h-5 text-amber-200" />
            </button>
            
            <div className="min-h-0 flex-1 p-3 sm:p-4">
              <BingoCardVisual forDownload={true} />
            </div>

            <div className="shrink-0 border-t border-zinc-800 bg-zinc-950/95 p-3">
              <Button
                onClick={downloadCard}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
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
