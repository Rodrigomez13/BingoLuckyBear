'use client'

import { useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BearLogo } from '@/components/bear-logo'
import { CheckCircle, Download, Eye, X, Hash } from 'lucide-react'

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
}

const BINGO_HEADERS = ['B', 'I', 'N', 'G', 'O']
const HEADER_COLORS = [
  'bg-red-500',
  'bg-orange-500', 
  'bg-amber-500',
  'bg-green-500',
  'bg-blue-500',
]

export function BingoCardDisplay({ card, raffleName }: BingoCardDisplayProps) {
  const [showModal, setShowModal] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const formattedDate = new Date(card.created_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Convert column-based array to row-based for display
  const getRows = () => {
    const rows: (number | string)[][] = []
    for (let row = 0; row < 5; row++) {
      const rowData: (number | string)[] = []
      for (let col = 0; col < 5; col++) {
        const num = card.bingo_numbers[col][row]
        rowData.push(num === 0 ? 'FREE' : num)
      }
      rows.push(rowData)
    }
    return rows
  }

  const rows = getRows()

  const downloadCard = async () => {
    if (!cardRef.current) return

    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#FFFBEB',
        useCORS: true,
      })
      
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
      ref={forDownload ? cardRef : undefined}
      className={`bg-gradient-to-br from-amber-50 to-orange-50 ${forDownload ? 'p-8' : 'p-4'} rounded-xl`}
    >
      {/* Card Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BearLogo size={forDownload ? 48 : 32} />
          <h2 
            className={`font-bold text-amber-900 ${forDownload ? 'text-2xl' : 'text-lg'}`}
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            Lucky Bingo Bear
          </h2>
        </div>
        <p className={`text-amber-600 ${forDownload ? 'text-base' : 'text-sm'}`}>{raffleName}</p>
        <Badge className="mt-2 bg-amber-500 hover:bg-amber-500 text-white">
          <Hash className="w-3 h-3 mr-1" />
          {card.card_number}
        </Badge>
      </div>

      {/* Bingo Grid */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border-4 border-amber-400">
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
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  ${forDownload ? 'h-16 text-xl' : 'h-12 text-lg'} 
                  flex items-center justify-center font-bold border-r last:border-r-0 border-amber-200
                  ${cell === 'FREE' 
                    ? 'bg-gradient-to-br from-amber-400 to-orange-400 text-white' 
                    : 'text-amber-900 hover:bg-amber-50'
                  }
                `}
              >
                {cell === 'FREE' ? (
                  <div className="text-center">
                    <span className={forDownload ? 'text-sm' : 'text-xs'}>FREE</span>
                  </div>
                ) : (
                  cell
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Card Footer */}
      <div className={`mt-4 text-center ${forDownload ? 'text-base' : 'text-sm'} text-amber-700`}>
        <p className="font-medium">{card.full_name}</p>
        <p className="text-amber-500">{formattedDate}</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 
          className="text-3xl font-bold text-amber-900 mb-2"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          Ya estas participando
        </h1>
        <p className="text-amber-700">
          Tu carton de bingo ha sido generado exitosamente
        </p>
      </div>

      {/* Bingo Card Preview */}
      <Card className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-xl overflow-hidden">
        <CardContent className="p-4">
          <BingoCardVisual />

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => setShowModal(true)}
              variant="outline"
              className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
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
      <div className="bg-amber-100 border border-amber-200 rounded-lg p-4">
        <p className="text-amber-800 text-sm">
          <strong>Importante:</strong> Guarda tu numero de carton <strong>{card.card_number}</strong>. 
          Lo necesitaras para verificar si ganaste cuando se realice el sorteo.
          Te recomendamos descargar la imagen de tu carton.
        </p>
      </div>

      {/* Full Screen Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="relative bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-amber-100 hover:bg-amber-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-amber-700" />
            </button>
            
            <div ref={cardRef} className="p-2">
              <BingoCardVisual forDownload={true} />
            </div>

            <div className="p-4 border-t border-amber-100">
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
