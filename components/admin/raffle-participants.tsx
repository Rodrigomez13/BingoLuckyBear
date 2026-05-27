'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClipboardCopy, ExternalLink, RefreshCw, Search, Trophy, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DrawControls } from './draw-controls'
import { getBingoRows, getWinningLines, isMarked } from '@/lib/bingo'

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
  payment_method?: string | null
  payment_reference?: string | null
  created_at: string
  bingo_numbers: number[][] | null
}

interface RaffleParticipantsProps {
  raffle: Raffle
  onRaffleUpdated: (raffle: Raffle) => void
}

const BINGO_HEADERS = ['B', 'I', 'N', 'G', 'O']

function MiniBingoCard({ numbers, drawnNumbers = [] }: { numbers: number[][] | null; drawnNumbers?: number[] }) {
  const rows = getBingoRows(numbers)

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-zinc-700 bg-zinc-950 p-4 text-center text-sm text-zinc-400">
        Este carton no tiene numeros validos cargados.
      </div>
    )
  }

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
  const [searchTerm, setSearchTerm] = useState('')
  const [winnerOnly, setWinnerOnly] = useState(false)

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

  const drawnNumbers = useMemo(() => raffle.drawn_numbers ?? [], [raffle.drawn_numbers])
  const winnerCards = useMemo(
    () => cards.filter((card) => getWinningLines(card.bingo_numbers, drawnNumbers).length > 0),
    [cards, drawnNumbers]
  )
  const filteredCards = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return cards.filter((card) => {
      const matchesWinner = !winnerOnly || getWinningLines(card.bingo_numbers, drawnNumbers).length > 0
      const matchesSearch =
        !normalizedSearch ||
        [card.card_number, card.full_name, card.dni, card.phone, card.email, card.payment_reference ?? '']
          .some((value) => value.toLowerCase().includes(normalizedSearch))

      return matchesWinner && matchesSearch
    })
  }, [cards, drawnNumbers, searchTerm, winnerOnly])

  const copyToClipboard = async (path: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`)
  }

  const exportToCSV = () => {
    if (filteredCards.length === 0) return

    const headers = ['Numero Carton', 'Nombre Completo', 'DNI', 'Direccion', 'Telefono', 'Email', 'Metodo Pago', 'Operacion', 'Fecha Registro']
    const rows = filteredCards.map(card => [
      card.card_number,
      card.full_name,
      card.dni,
      card.address,
      card.phone,
      card.email,
      card.payment_method ?? '',
      card.payment_reference ?? '',
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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => copyToClipboard('/participar')}
              variant="outline"
              className="border-amber-400/40 bg-transparent text-amber-200 hover:bg-amber-400/10"
            >
              <ClipboardCopy className="mr-2 h-4 w-4" />
              Copiar Link
            </Button>
            <Button asChild variant="outline" className="border-emerald-400/40 bg-transparent text-emerald-200 hover:bg-emerald-400/10">
              <Link href="/en-vivo" target="_blank">
                En Vivo
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              onClick={fetchCards}
              variant="outline"
              className="border-zinc-600 bg-transparent text-zinc-200 hover:bg-white/10"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <Button 
              onClick={exportToCSV}
              disabled={filteredCards.length === 0}
              variant="outline"
              className="border-amber-400/40 bg-transparent text-amber-200 hover:bg-amber-400/10"
            >
              Exportar CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <SummaryTile icon={<Users className="h-5 w-5" />} label="Participantes" value={String(cards.length)} />
          <SummaryTile icon={<Trophy className="h-5 w-5" />} label="Ganadores detectados" value={String(winnerCards.length)} />
          <SummaryTile icon={<Search className="h-5 w-5" />} label="Vista actual" value={String(filteredCards.length)} />
        </div>

        <div className="mb-5 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por carton, nombre, DNI, telefono, email u operacion"
              className="border-zinc-700 bg-zinc-900 pl-9 text-white focus:border-amber-400"
            />
          </div>
          <Button
            type="button"
            variant={winnerOnly ? 'default' : 'outline'}
            onClick={() => setWinnerOnly((value) => !value)}
            className={
              winnerOnly
                ? 'bg-emerald-500 font-bold text-white hover:bg-emerald-600'
                : 'border-emerald-400/40 bg-transparent text-emerald-200 hover:bg-emerald-400/10'
            }
          >
            <Trophy className="mr-2 h-4 w-4" />
            Solo ganadores
          </Button>
        </div>

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
        ) : filteredCards.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-700 p-8 text-center text-zinc-400">
            No hay participantes que coincidan con los filtros.
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
            {filteredCards.map((card) => {
              const winningLines = getWinningLines(card.bingo_numbers, drawnNumbers)

              return (
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
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate font-medium text-white">{card.full_name}</p>
                      {winningLines.length > 0 && <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Bingo</Badge>}
                    </div>
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
              )
            })}
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
                  <div className="min-w-0 rounded-md border border-zinc-800 bg-white/[0.03] p-2 sm:p-3">
                    <p className="text-zinc-400">Metodo de Pago</p>
                    <p className="truncate font-medium text-white">{selectedCard.payment_method ?? 'Sin registrar'}</p>
                  </div>
                  <div className="min-w-0 rounded-md border border-zinc-800 bg-white/[0.03] p-2 sm:p-3">
                    <p className="text-zinc-400">Operacion</p>
                    <p className="truncate font-medium text-white">{selectedCard.payment_reference ?? 'Sin registrar'}</p>
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
                <ReceiptPreview pathname={selectedCard.payment_receipt_url} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
    </div>
  )
}

function ReceiptPreview({ pathname }: { pathname: string }) {
  const fileUrl = `/api/file?pathname=${encodeURIComponent(pathname)}`
  const isPdf = pathname.toLowerCase().endsWith('.pdf')

  return (
    <div className="space-y-3">
      <div className="flex aspect-[4/5] max-h-[52dvh] items-center justify-center overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
        {isPdf ? (
          <iframe src={fileUrl} title="Comprobante de pago PDF" className="h-full w-full bg-white" />
        ) : (
          <img
            src={fileUrl}
            alt="Comprobante de pago"
            className="h-full w-full object-contain"
          />
        )}
      </div>
      <Button asChild variant="outline" className="w-full border-amber-400/40 bg-transparent text-amber-200 hover:bg-amber-400/10">
        <a href={fileUrl} target="_blank" rel="noreferrer">
          Abrir comprobante
          <ExternalLink className="ml-2 h-4 w-4" />
        </a>
      </Button>
    </div>
  )
}

function SummaryTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-200">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  )
}
