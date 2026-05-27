'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DrawControls } from './draw-controls'
import { getBingoRows, isMarked } from '@/lib/bingo'

interface Raffle {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  draw_status?: 'idle' | 'running' | 'finished' | null
  countdown_seconds?: number | null
  draw_started_at?: string | null
  drawn_numbers?: number[] | null
}

interface BingoCard {
  id: string
  card_number: string
  full_name: string
  dni: string
  address: string
  phone: string
  email: string
  payment_receipt_url: string
  created_at: string
  bingo_numbers: number[][]
}

interface RaffleParticipantsProps {
  raffle: Raffle
  onRaffleUpdated: (raffle: Raffle) => void
}

const BINGO_HEADERS = ['B', 'I', 'N', 'G', 'O']

function MiniBingoCard({ numbers, drawnNumbers = [] }: { numbers: number[][]; drawnNumbers?: number[] }) {
  const rows = getBingoRows(numbers)

  return (
    <div className="rounded-md border border-amber-400/40 bg-zinc-950 p-2">
      <div className="grid grid-cols-5 overflow-hidden rounded-t-sm">
        {BINGO_HEADERS.map((letter) => (
          <div key={letter} className="bg-amber-400 py-1 text-center text-xs font-black text-zinc-950">
            {letter}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5">
        {rows.flatMap((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const marked = isMarked(cell, drawnNumbers)

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`flex aspect-square items-center justify-center border border-zinc-800 text-xs font-bold ${
                  cell === 'FREE'
                    ? 'bg-amber-500 text-white'
                    : marked
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-900 text-zinc-100'
                }`}
              >
                {cell}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export function RaffleParticipants({ raffle, onRaffleUpdated }: RaffleParticipantsProps) {
  const [cards, setCards] = useState<BingoCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState<BingoCard | null>(null)

  const fetchCards = useCallback(async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('bingo_cards')
        .select('*')
        .eq('raffle_id', raffle.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCards(data || [])
    } catch (error) {
      console.error('Error fetching cards:', error)
    } finally {
      setIsLoading(false)
    }
  }, [raffle.id])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  const exportToCSV = () => {
    if (cards.length === 0) return

    const headers = ['Numero Carton', 'Nombre Completo', 'DNI', 'Direccion', 'Telefono', 'Email', 'Fecha Registro']
    const rows = cards.map(card => [
      card.card_number,
      card.full_name,
      card.dni,
      card.address,
      card.phone,
      card.email,
      new Date(card.created_at).toLocaleString('es-ES')
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${raffle.name.replace(/\s+/g, '_')}_participantes.csv`
    link.click()
  }

  return (
    <div className="space-y-5">
      <DrawControls raffle={raffle} cards={cards} onRaffleUpdated={onRaffleUpdated} />

      <Card className="border-zinc-800 bg-zinc-950/80 text-zinc-100 shadow-xl shadow-black/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              {raffle.name}
              <Badge 
                variant={raffle.is_active ? 'default' : 'secondary'}
                className={raffle.is_active ? 'bg-green-500' : 'bg-gray-400'}
              >
                {raffle.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </CardTitle>
            <p className="text-sm text-zinc-400 mt-1">
              {cards.length} participante{cards.length !== 1 ? 's' : ''} registrado{cards.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button 
            onClick={exportToCSV}
            disabled={cards.length === 0}
            variant="outline"
            className="border-amber-400/40 bg-transparent text-amber-200 hover:bg-amber-400/10"
          >
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-300">No hay participantes registrados aun.</p>
            {raffle.is_active && (
              <p className="text-sm text-zinc-500 mt-2">
                Comparte el link del sorteo para que las personas puedan participar.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="hidden grid-cols-[1.05fr_1.25fr_0.75fr_1fr_0.65fr_140px] gap-3 border-b border-zinc-800 px-3 pb-2 text-sm font-semibold text-amber-200 xl:grid">
              <span>Carton</span>
              <span>Nombre</span>
              <span>DNI</span>
              <span>Telefono</span>
              <span>Fecha</span>
              <span>Acciones</span>
            </div>
            {cards.map((card) => (
              <div
                key={card.id}
                className="grid gap-3 rounded-md border border-zinc-800 bg-white/[0.03] p-3 text-sm transition-colors hover:border-amber-400/40 hover:bg-white/[0.05] xl:grid-cols-[1.05fr_1.25fr_0.75fr_1fr_0.65fr_140px] xl:items-center"
              >
                <div>
                  <p className="text-xs text-zinc-500 xl:hidden">Carton</p>
                  <p className="break-all font-mono font-bold text-amber-300">{card.card_number}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500 xl:hidden">Nombre</p>
                  <p className="truncate font-medium text-white">{card.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 xl:hidden">DNI</p>
                  <p>{card.dni}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 xl:hidden">Telefono</p>
                  <p className="break-all">{card.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 xl:hidden">Fecha</p>
                  <p className="text-zinc-400">{new Date(card.created_at).toLocaleDateString('es-ES')}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedCard(card)}
                  className="w-full border-amber-400/40 bg-transparent text-amber-200 hover:bg-amber-400/10"
                >
                  Ver Detalles
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="flex max-h-[calc(100dvh-1.5rem)] w-[min(94vw,920px)] max-w-none grid-rows-none flex-col overflow-hidden border-zinc-800 bg-zinc-950 p-0 text-zinc-100">
          <DialogHeader className="border-b border-zinc-800 px-5 py-4">
            <DialogTitle className="text-white">
              Detalles del Participante
            </DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(112px,300px)] gap-0">
              <div className="min-w-0 space-y-4 p-4 sm:p-5">
                <div className="rounded-md bg-gradient-to-r from-amber-400 to-orange-500 p-4">
                  <p className="text-sm font-medium text-zinc-950">Numero de Carton</p>
                  <p className="break-all font-mono text-2xl font-bold text-zinc-950">
                    {selectedCard.card_number}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs sm:gap-3 sm:text-sm">
                  <div className="min-w-0 rounded-md border border-zinc-800 bg-white/[0.03] p-2 sm:p-3">
                    <p className="text-zinc-400">Nombre Completo</p>
                    <p className="truncate font-medium text-white">{selectedCard.full_name}</p>
                  </div>
                  <div className="min-w-0 rounded-md border border-zinc-800 bg-white/[0.03] p-2 sm:p-3">
                    <p className="text-zinc-400">DNI</p>
                    <p className="truncate font-medium text-white">{selectedCard.dni}</p>
                  </div>
                  <div className="min-w-0 rounded-md border border-zinc-800 bg-white/[0.03] p-2 sm:p-3">
                    <p className="text-zinc-400">Telefono</p>
                    <p className="truncate font-medium text-white">{selectedCard.phone}</p>
                  </div>
                  <div className="min-w-0 rounded-md border border-zinc-800 bg-white/[0.03] p-2 sm:p-3">
                    <p className="text-zinc-400">Email</p>
                    <p className="truncate font-medium text-white">{selectedCard.email}</p>
                  </div>
                  <div className="col-span-2 min-w-0 rounded-md border border-zinc-800 bg-white/[0.03] p-2 sm:p-3">
                    <p className="text-zinc-400">Direccion</p>
                    <p className="truncate font-medium text-white">{selectedCard.address}</p>
                  </div>
                  <div className="col-span-2 min-w-0 rounded-md border border-zinc-800 bg-white/[0.03] p-2 sm:p-3">
                    <p className="text-zinc-400">Fecha de Registro</p>
                    <p className="truncate font-medium text-white">
                      {new Date(selectedCard.created_at).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-zinc-300">Carton asignado</p>
                  <MiniBingoCard numbers={selectedCard.bingo_numbers} drawnNumbers={raffle.drawn_numbers ?? []} />
                </div>
              </div>

              <div className="border-l border-zinc-800 bg-zinc-900/60 p-3 sm:p-5">
                <p className="mb-3 text-sm font-medium text-zinc-300">Comprobante de Pago</p>
                <div className="flex aspect-[4/5] max-h-[52dvh] items-center justify-center overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
                  <img
                    src={`/api/file?pathname=${encodeURIComponent(selectedCard.payment_receipt_url)}`}
                    alt="Comprobante de pago"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
    </div>
  )
}
