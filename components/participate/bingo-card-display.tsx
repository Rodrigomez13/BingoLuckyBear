'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BearLogo } from '@/components/bear-logo'
import { CheckCircle, Download, Eye, X, Hash, Trophy } from 'lucide-react'
import { getBingoRows, getWinningLines, isMarked } from '@/lib/bingo'

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
}

const BINGO_HEADERS = ['B', 'I', 'N', 'G', 'O']
const HEADER_COLORS = [
  'bg-red-500',
  'bg-orange-500', 
  'bg-amber-500',
  'bg-green-500',
  'bg-blue-500',
]

export function BingoCardDisplay({ card, raffleName, drawnNumbers = [] }: BingoCardDisplayProps) {
  const [showModal, setShowModal] = useState(false)

  const formattedDate = new Date(card.created_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const rows = getBingoRows(card.bingo_numbers)
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

  const downloadCard = () => {
    try {
      const canvas = document.createElement('canvas')
      const scale = 2
      const width = 760
      const height = 980
      canvas.width = width * scale
      canvas.height = height * scale

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.scale(scale, scale)

      const background = ctx.createLinearGradient(0, 0, width, height)
      background.addColorStop(0, '#09090b')
      background.addColorStop(0.58, '#18181b')
      background.addColorStop(1, '#451a03')
      ctx.fillStyle = background
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(108, 104, 46, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#78350f'
      ctx.beginPath()
      ctx.arc(91, 72, 15, 0, Math.PI * 2)
      ctx.arc(125, 72, 15, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff7ed'
      ctx.beginPath()
      ctx.arc(108, 112, 25, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#451a03'
      ctx.beginPath()
      ctx.arc(99, 100, 4, 0, Math.PI * 2)
      ctx.arc(117, 100, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillText('●', 103, 119)

      ctx.fillStyle = '#ffffff'
      ctx.font = '700 42px Arial'
      ctx.fillText('Lucky Bingo Bear', 172, 100)

      ctx.fillStyle = '#fde68a'
      ctx.font = '24px Arial'
      ctx.fillText(raffleName, 172, 137)

      ctx.fillStyle = '#f59e0b'
      drawRoundedRect(ctx, 172, 158, 250, 42, 18)
      ctx.fill()
      ctx.fillStyle = '#111827'
      ctx.font = '700 22px Arial'
      ctx.fillText(card.card_number, 195, 186)

      const gridX = 70
      const gridY = 260
      const cellSize = 124
      const headerHeight = 78
      const headerColors = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#3b82f6']

      ctx.lineWidth = 6
      ctx.strokeStyle = '#fbbf24'
      drawRoundedRect(ctx, gridX - 3, gridY - 3, cellSize * 5 + 6, headerHeight + cellSize * 5 + 6, 12)
      ctx.stroke()

      BINGO_HEADERS.forEach((letter, index) => {
        ctx.fillStyle = headerColors[index]
        ctx.fillRect(gridX + index * cellSize, gridY, cellSize, headerHeight)
        ctx.fillStyle = '#ffffff'
        ctx.font = '900 48px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(letter, gridX + index * cellSize + cellSize / 2, gridY + headerHeight / 2)
      })

      rows.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const x = gridX + colIndex * cellSize
          const y = gridY + headerHeight + rowIndex * cellSize
          const marked = isMarked(cell, drawnNumbers)

          ctx.fillStyle = cell === 'FREE' ? '#f59e0b' : marked ? '#10b981' : '#111827'
          ctx.fillRect(x, y, cellSize, cellSize)
          ctx.strokeStyle = '#fde68a'
          ctx.lineWidth = 2
          ctx.strokeRect(x, y, cellSize, cellSize)

          ctx.fillStyle = '#ffffff'
          ctx.font = cell === 'FREE' ? '800 24px Arial' : '900 42px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(String(cell), x + cellSize / 2, y + cellSize / 2)
        })
      })

      ctx.textAlign = 'center'
      ctx.fillStyle = '#fff7ed'
      ctx.font = '700 28px Arial'
      ctx.fillText(card.full_name, width / 2, 920)
      ctx.fillStyle = '#fcd34d'
      ctx.font = '20px Arial'
      ctx.fillText(formattedDate, width / 2, 950)

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
      className={`bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950 ${forDownload ? 'p-8' : 'p-4'} rounded-lg`}
    >
      {/* Card Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BearLogo size={forDownload ? 48 : 32} />
          <h2
            className={`font-bold text-white ${forDownload ? 'text-2xl' : 'text-lg'}`}
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            Lucky Bingo Bear
          </h2>
        </div>
        <p className={`text-amber-200 ${forDownload ? 'text-base' : 'text-sm'}`}>{raffleName}</p>
        <Badge className="mt-2 bg-amber-500 hover:bg-amber-500 text-white">
          <Hash className="w-3 h-3 mr-1" />
          {card.card_number}
        </Badge>
      </div>

      {/* Bingo Grid */}
      <div className="bg-zinc-950 rounded-lg shadow-lg overflow-hidden border-4 border-amber-400">
        {/* BINGO Header */}
        <div className="grid grid-cols-5">
          {BINGO_HEADERS.map((letter, i) => (
            <div 
              key={letter}
              className={`${HEADER_COLORS[i]} text-white font-bold ${forDownload ? 'text-3xl py-4' : 'text-xl py-2'} text-center`}
              style={{ fontFamily: 'var(--font-fredoka)' }}
            >
              {letter}
            </div>
          ))}
        </div>

        {/* Numbers Grid */}
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-5 border-t border-amber-200">
            {row.map((cell, colIndex) => {
              const marked = isMarked(cell, drawnNumbers)
              return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  ${forDownload ? 'h-16 text-xl' : 'h-12 text-lg'} 
                  flex items-center justify-center font-bold border-r last:border-r-0 border-amber-200
                  ${cell === 'FREE' 
                    ? 'bg-gradient-to-br from-amber-400 to-orange-400 text-white' 
                    : marked
                      ? 'bg-emerald-500 text-white shadow-inner'
                      : 'text-zinc-100 hover:bg-white/5'
                  }
                `}
              >
                {cell === 'FREE' ? (
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
      <div className={`mt-4 text-center ${forDownload ? 'text-base' : 'text-sm'} text-amber-100`}>
        <p className="font-medium">{card.full_name}</p>
        <p className="text-amber-300">{formattedDate}</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15 mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-300" />
        </div>
        <h1 
          className="text-3xl font-bold text-white mb-2"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          {isWinner ? 'Tenemos un ganador' : 'Ya estas participando'}
        </h1>
        <p className="text-zinc-300">
          {isWinner
            ? `Tu carton completo: ${winningLines.join(', ')}`
            : 'Tu carton de bingo ha sido generado exitosamente'}
        </p>
      </div>

      {isWinner && (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4 text-center text-emerald-100">
          <Trophy className="mx-auto mb-2 h-7 w-7 text-emerald-300" />
          Aviso automatico: este carton tiene bingo con los numeros cantados.
        </div>
      )}

      {/* Bingo Card Preview */}
      <Card className="bg-zinc-950/85 backdrop-blur-sm border-zinc-800 shadow-xl overflow-hidden">
        <CardContent className="p-4">
          <BingoCardVisual />

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => setShowModal(true)}
              variant="outline"
              className="flex-1 border-amber-400/40 bg-transparent text-amber-200 hover:bg-amber-400/10"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Carton Completo
            </Button>
            <Button
              onClick={downloadCard}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="relative bg-zinc-950 rounded-lg max-w-md w-full max-h-[90vh] overflow-auto border border-zinc-800">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-amber-200" />
            </button>
            
            <div className="p-2">
              <BingoCardVisual forDownload={true} />
            </div>

            <div className="p-4 border-t border-zinc-800">
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
