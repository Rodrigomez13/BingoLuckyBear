'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BearLogo } from '@/components/bear-logo'
import { CheckCircle, Calendar, Hash } from 'lucide-react'

interface BingoCard {
  id: string
  card_number: string
  full_name: string
  created_at: string
}

interface BingoCardDisplayProps {
  card: BingoCard
  raffleName: string
}

export function BingoCardDisplay({ card, raffleName }: BingoCardDisplayProps) {
  const formattedDate = new Date(card.created_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

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
          Tu carton de bingo ha sido registrado exitosamente
        </p>
      </div>

      {/* Bingo Card */}
      <Card className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BearLogo size={48} className="bg-white rounded-full p-1" />
              <div>
                <h2 
                  className="text-white font-bold text-xl"
                  style={{ fontFamily: 'var(--font-fredoka)' }}
                >
                  Lucky Bingo Bear
                </h2>
                <p className="text-amber-100 text-sm">{raffleName}</p>
              </div>
            </div>
            <Badge className="bg-white text-amber-700 hover:bg-white text-lg px-4 py-1">
              <Hash className="w-4 h-4 mr-1" />
              {card.card_number}
            </Badge>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Card Details */}
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
              <div>
                <p className="text-sm text-amber-600 mb-1">Participante</p>
                <p className="font-semibold text-amber-900">{card.full_name}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
              <div>
                <p className="text-sm text-amber-600 mb-1">Numero de Carton</p>
                <p className="font-bold text-2xl text-amber-900">{card.card_number}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm text-amber-600 mb-1">Fecha de Registro</p>
                <p className="font-medium text-amber-900">{formattedDate}</p>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-amber-100 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm">
              <strong>Importante:</strong> Guarda tu numero de carton <strong>{card.card_number}</strong>. 
              Lo necesitaras para verificar si ganaste cuando se realice el sorteo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
