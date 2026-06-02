'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CalendarDays, ClipboardCopy, DollarSign, ExternalLink, Gift, Landmark, Plus, RefreshCw, Save, Search, Trash2, Trophy, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DrawControls } from './draw-controls'
import {
  getCurrentPrizeTarget,
  getPrizeAmounts,
  getPrizeAwards,
  getBingoColumnLabels,
  getBingoRows,
  isMarked,
  normalizePrizeAmounts,
} from '@/lib/bingo'

interface Raffle {
  id: string
  name: string
  description: string | null
  prize?: string | null
  additional_prizes?: string[] | null
  amount?: string | null
  bundle_offers?: string[] | null
  draw_date?: string | null
  is_active: boolean
  created_at: string
  draw_status?: 'idle' | 'running' | 'finished' | null
  countdown_seconds?: number | null
  draw_started_at?: string | null
  drawn_numbers?: number[] | null
  payment_account_id?: string | null
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
  payout_account_kind?: string | null
  payout_account?: string | null
  payout_holder_name?: string | null
  created_at: string
  bingo_numbers: number[][] | null
}

interface RaffleParticipantsProps {
  raffle: Raffle
  paymentAccounts: PaymentAccount[]
  onRaffleUpdated: (raffle: Raffle) => void
}

interface PaymentAccount {
  id: string
  name: string
  holder: string
  alias?: string | null
  cbu?: string | null
  is_default: boolean
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

function MiniBingoCard({
  numbers,
  drawnNumbers = [],
  prominent = false,
}: {
  numbers: number[][] | null
  drawnNumbers?: number[]
  prominent?: boolean
}) {
  const rows = getBingoRows(numbers)
  const columnLabels = getBingoColumnLabels(numbers)

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-zinc-700 bg-zinc-950 p-4 text-center text-sm text-zinc-400">
        Este carton no tiene numeros validos cargados.
      </div>
    )
  }

  return (
    <div className={`rounded-md border border-amber-400/40 bg-zinc-950 p-2 ${prominent ? 'shadow-xl shadow-amber-950/20' : ''}`}>
      <div
        className="grid overflow-hidden rounded-t-sm"
        style={{ gridTemplateColumns: `${columnLabels.length === 9 ? '2.25rem ' : ''}repeat(${columnLabels.length}, minmax(0, 1fr))` }}
      >
        {columnLabels.length === 9 && (
          <div className={`bg-amber-800 py-1 text-center font-medium leading-none text-amber-100 ${prominent ? 'text-[10px]' : 'text-[9px]'}`}>P</div>
        )}
        {columnLabels.map((letter) => (
          <div key={letter} className={`bg-amber-400 px-0.5 py-1 text-center font-medium leading-none tracking-tight text-zinc-950 ${prominent ? 'text-[9px] sm:text-[10px]' : 'text-[8px]'}`}>
            {letter}
          </div>
        ))}
      </div>
      <div className="grid" style={{ gridTemplateColumns: `${columnLabels.length === 9 ? '2.25rem ' : ''}repeat(${columnLabels.length}, minmax(0, 1fr))` }}>
        {rows.flatMap((row, rowIndex) =>
          [
            ...(columnLabels.length === 9
              ? [
                  <div
                    key={`prize-${rowIndex}`}
                    className={`flex aspect-square items-center justify-center border border-zinc-800 bg-amber-400 font-semibold text-zinc-950 ${
                      prominent ? 'text-[10px]' : 'text-[9px]'
                    }`}
                  >
                    P{rowIndex + 1}
                  </div>,
                ]
              : []),
            ...row.map((cell, colIndex) => {
            const marked = isMarked(cell, drawnNumbers)

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`flex aspect-square items-center justify-center border border-zinc-800 font-semibold ${
                  prominent ? 'text-sm sm:text-[15px]' : 'text-xs'
                } ${
                  cell === null
                    ? 'bg-black/50 text-transparent'
                    : cell === 'FREE'
                    ? 'bg-amber-500 text-white'
                    : marked
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-900 text-zinc-100'
                }`}
              >
                {cell}
              </div>
            )
          }),
          ]
        )}
      </div>
    </div>
  )
}

export function RaffleParticipants({ raffle, paymentAccounts, onRaffleUpdated }: RaffleParticipantsProps) {
  const [cards, setCards] = useState<BingoCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [selectedCard, setSelectedCard] = useState<BingoCard | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [winnerOnly, setWinnerOnly] = useState(false)
  const [details, setDetails] = useState({
    prize: raffle.prize ?? '',
    additional_prizes: raffle.additional_prizes ?? [],
    amount: raffle.amount ?? '',
    payment_account_id: raffle.payment_account_id ?? '',
    bundle_offers: raffle.bundle_offers ?? [],
    draw_date: toDateTimeLocalValue(raffle.draw_date ?? null),
  })
  const detailPrizeValues = [details.prize, details.additional_prizes[0] ?? '', details.additional_prizes[1] ?? '']

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

  useEffect(() => {
    setDetails({
      prize: raffle.prize ?? '',
      additional_prizes: raffle.additional_prizes ?? [],
      amount: raffle.amount ?? '',
      payment_account_id: raffle.payment_account_id ?? '',
      bundle_offers: raffle.bundle_offers ?? [],
      draw_date: toDateTimeLocalValue(raffle.draw_date ?? null),
    })
  }, [raffle.id, raffle.prize, raffle.additional_prizes, raffle.amount, raffle.payment_account_id, raffle.bundle_offers, raffle.draw_date])

  const drawnNumbers = useMemo(() => raffle.drawn_numbers ?? [], [raffle.drawn_numbers])
  const prizeAmounts = useMemo(() => getPrizeAmounts(raffle.prize, raffle.additional_prizes), [raffle.prize, raffle.additional_prizes])
  const prizeAwards = useMemo(() => getPrizeAwards(cards, drawnNumbers, prizeAmounts), [cards, drawnNumbers, prizeAmounts])
  const currentPrizeTarget = useMemo(() => getCurrentPrizeTarget(cards, drawnNumbers, prizeAmounts), [cards, drawnNumbers, prizeAmounts])
  const awardedCardIds = useMemo(
    () => new Set(prizeAwards.flatMap((award) => award.winners.map((winner) => winner.id))),
    [prizeAwards]
  )
  const filteredCards = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return cards.filter((card) => {
      const matchesWinner = !winnerOnly || awardedCardIds.has(card.id)
      const matchesSearch =
        !normalizedSearch ||
        [card.card_number, card.full_name, card.dni, card.phone, card.email, card.payment_reference ?? '', card.payout_account ?? '', card.payout_holder_name ?? '']
          .some((value) => value.toLowerCase().includes(normalizedSearch))

      return matchesWinner && matchesSearch
    })
  }, [awardedCardIds, cards, searchTerm, winnerOnly])

  const statusLabel =
    raffle.draw_status === 'finished'
      ? 'Cerrado'
      : raffle.draw_status === 'running'
        ? 'En vivo'
        : raffle.is_active
          ? 'Disponible'
          : 'Pausado'
  const statusClass =
    raffle.draw_status === 'finished'
      ? 'bg-zinc-600 text-white hover:bg-zinc-600'
      : raffle.draw_status === 'running'
        ? 'bg-red-500 text-white hover:bg-red-500'
        : raffle.is_active
          ? 'bg-green-500 text-white hover:bg-green-500'
          : 'bg-gray-400 text-zinc-950 hover:bg-gray-400'

  const updateDetailPrize = (index: number, value: string) => {
    setDetails((current) => {
      if (index === 0) {
        return { ...current, prize: value }
      }

      const additionalPrizes = [current.additional_prizes[0] ?? '', current.additional_prizes[1] ?? '']
      additionalPrizes[index - 1] = value
      return { ...current, additional_prizes: additionalPrizes }
    })
  }

  const copyToClipboard = async (path: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`)
  }

  const saveRaffleDetails = async () => {
    setIsSavingDetails(true)
    try {
      const supabase = createClient()
      const sortedPrizes = normalizePrizeAmounts(detailPrizeValues)

      if (sortedPrizes.length !== 3) {
        alert('Carga los 3 montos de premios antes de guardar.')
        return
      }

      const payload = {
        prize: sortedPrizes[0],
        additional_prizes: [sortedPrizes[1], sortedPrizes[2]],
        amount: details.amount || null,
        payment_account_id: details.payment_account_id || null,
        bundle_offers: details.bundle_offers.map((item) => item.trim()).filter(Boolean),
        draw_date: details.draw_date || null,
      }
      const { data, error } = await supabase
        .from('raffles')
        .update(payload)
        .eq('id', raffle.id)
        .select('*')
        .single()

      if (error) throw error
      onRaffleUpdated(data as Raffle)
    } catch (error) {
      console.error('Error updating raffle details:', error)
    } finally {
      setIsSavingDetails(false)
    }
  }

  const exportToCSV = () => {
    if (filteredCards.length === 0) return

    const headers = ['Numero Carton', 'Nombre Completo', 'DNI', 'Direccion', 'Telefono', 'Email', 'Metodo Pago', 'Operacion', 'Tipo Cuenta Premio', 'Cuenta Premio', 'Titular Cuenta Premio', 'Fecha Registro']
    const rows = filteredCards.map(card => [
      card.card_number,
      card.full_name,
      card.dni,
      card.address,
      card.phone,
      card.email,
      card.payment_method ?? '',
      card.payment_reference ?? '',
      card.payout_account_kind ?? '',
      card.payout_account ?? '',
      card.payout_holder_name ?? '',
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
          <CardTitle className="flex items-center gap-2 text-white">
            <Gift className="h-5 w-5 text-amber-300" />
            Premio, monto y fecha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[180px_210px_minmax(220px,1fr)_auto] lg:items-end">
            <div className="space-y-2">
              <label htmlFor="raffle-amount" className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <DollarSign className="h-4 w-4 text-amber-200" />
                Monto del carton
              </label>
              <Input
                id="raffle-amount"
                value={details.amount}
                onChange={(event) => setDetails((current) => ({ ...current, amount: event.target.value }))}
                placeholder="$2.000"
                className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="raffle-date" className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <CalendarDays className="h-4 w-4 text-amber-200" />
                Fecha
              </label>
              <Input
                id="raffle-date"
                type="datetime-local"
                value={details.draw_date}
                onChange={(event) => setDetails((current) => ({ ...current, draw_date: event.target.value }))}
                className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="raffle-payment-account" className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Landmark className="h-4 w-4 text-amber-200" />
                Cuenta de cobro
              </label>
              <select
                id="raffle-payment-account"
                value={details.payment_account_id}
                onChange={(event) => setDetails((current) => ({ ...current, payment_account_id: event.target.value }))}
                className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-amber-400"
              >
                <option value="">Usar datos por defecto</option>
                {paymentAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}{account.is_default ? ' - predeterminada' : ''}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              onClick={saveRaffleDetails}
              disabled={isSavingDetails}
              className="w-full bg-amber-400 font-bold text-zinc-950 hover:bg-amber-300 lg:w-auto"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSavingDetails ? 'Guardando' : 'Guardar'}
            </Button>
          </div>

          <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3">
            <div>
              <p className="font-semibold text-white">Premios por fila</p>
              <p className="text-sm text-zinc-400">
                El sistema ordena estos tres montos de mayor a menor. El sorteo se juega en orden inverso: premio 3, premio 2 y premio 1.
              </p>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {detailPrizeValues.map((item, index) => (
                <div key={index} className="space-y-2">
                  <label htmlFor={`raffle-row-prize-${index}`} className="text-sm font-medium text-zinc-300">
                    Monto de premio {index + 1}
                  </label>
                    <Input
                      id={`raffle-row-prize-${index}`}
                      value={item}
                      onChange={(event) => updateDetailPrize(index, event.target.value)}
                      placeholder={index === 0 ? '$100.000' : index === 1 ? '$50.000' : '$25.000'}
                      className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400"
                    />
                  </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-white">Promos por cantidad</p>
                <p className="text-sm text-zinc-400">Ejemplo: 2 cartones por $3.500, 5 cartones por $8.000.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDetails((current) => ({ ...current, bundle_offers: [...current.bundle_offers, ''] }))}
                className="border-emerald-400/40 bg-transparent text-emerald-200 hover:bg-emerald-400/10"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar promo
              </Button>
            </div>

            {details.bundle_offers.length > 0 ? (
              <div className="mt-3 space-y-2">
                {details.bundle_offers.map((item, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <Input
                      value={item}
                      onChange={(event) =>
                        setDetails((current) => ({
                          ...current,
                          bundle_offers: current.bundle_offers.map((value, itemIndex) =>
                            itemIndex === index ? event.target.value : value
                          ),
                        }))
                      }
                      placeholder={`Promo ${index + 1}`}
                      className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setDetails((current) => ({
                          ...current,
                          bundle_offers: current.bundle_offers.filter((_, itemIndex) => itemIndex !== index),
                        }))
                      }
                      className="border-red-400/40 bg-transparent text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar promo</span>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Todavia no agregaste promos por cantidad.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-950/80 text-zinc-100 shadow-xl shadow-black/20">
      <CardHeader>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              {raffle.name}
              <Badge className={statusClass}>
                {statusLabel}
              </Badge>
            </CardTitle>
            <p className="text-sm text-zinc-400 mt-1">
              {cards.length} participante{cards.length !== 1 ? 's' : ''} registrado{cards.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
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
          <SummaryTile icon={<Trophy className="h-5 w-5" />} label="Premios adjudicados" value={`${prizeAwards.length}/3`} />
          <SummaryTile icon={<Search className="h-5 w-5" />} label="Vista actual" value={String(filteredCards.length)} />
        </div>

        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_1.35fr]">
          <div className="rounded-md border border-amber-400/25 bg-amber-400/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Premio en juego</p>
            <p className="mt-2 text-xl font-bold text-white">
              {currentPrizeTarget ? `Premio ${currentPrizeTarget.prizeNumber}` : 'Sorteo completo'}
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              {currentPrizeTarget
                ? `Fila ${currentPrizeTarget.rowIndex + 1} - ${currentPrizeTarget.amount || 'monto a confirmar'}`
                : 'Ya se adjudicaron los 3 premios.'}
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Orden del sorteo</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {[3, 2, 1].map((prizeNumber) => {
                const award = prizeAwards.find((item) => item.prizeNumber === prizeNumber)
                const amount = prizeAmounts[prizeNumber - 1] ?? 'A confirmar'

                return (
                  <div key={prizeNumber} className="rounded-md border border-white/10 bg-black/20 p-3">
                    <p className="font-bold text-white">Premio {prizeNumber}</p>
                    <p className="text-sm text-amber-100">{amount}</p>
                    <p className="mt-1 text-xs text-zinc-400">{award ? `Adjudicado con el ${award.drawnNumber}` : `Fila ${prizeNumber}`}</p>
                  </div>
                )
              })}
            </div>
          </div>
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
              const cardAwards = prizeAwards.filter((award) => award.winners.some((winner) => winner.id === card.id))

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
                      {cardAwards.map((award) => (
                        <Badge key={award.prizeNumber} className="bg-emerald-500 text-white hover:bg-emerald-500">
                          Premio {award.prizeNumber}
                        </Badge>
                      ))}
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
        <DialogContent className="flex max-h-[calc(100dvh-1.5rem)] w-[min(96vw,1180px)] max-w-none grid-rows-none flex-col overflow-hidden border-zinc-800 bg-zinc-950 p-0 text-zinc-100">
          <DialogHeader className="border-b border-zinc-800 px-5 py-4">
            <DialogTitle className="text-white">
              Detalles del Participante
            </DialogTitle>
          </DialogHeader>
            {selectedCard && (
            <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto xl:grid-cols-[minmax(0,0.95fr)_minmax(260px,0.8fr)_minmax(220px,320px)] xl:overflow-hidden">
              <div className="min-w-0 space-y-4 border-b border-zinc-800 p-4 sm:p-5 xl:border-b-0">
                <div className="rounded-md bg-gradient-to-r from-amber-400 to-orange-500 p-4">
                  <p className="text-sm font-medium text-zinc-950">Numero de Carton</p>
                  <p className="break-all font-mono text-xl font-bold text-zinc-950">
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
                  <div className="min-w-0 rounded-md border border-zinc-800 bg-white/[0.03] p-2 sm:p-3">
                    <p className="text-zinc-400">Tipo Cuenta Premio</p>
                    <p className="truncate font-medium text-white">{selectedCard.payout_account_kind ?? 'Sin registrar'}</p>
                  </div>
                  <div className="min-w-0 rounded-md border border-zinc-800 bg-white/[0.03] p-2 sm:p-3">
                    <p className="text-zinc-400">Cuenta Premio</p>
                    <p className="truncate font-medium text-white">{selectedCard.payout_account ?? 'Sin registrar'}</p>
                  </div>
                  <div className="col-span-2 min-w-0 rounded-md border border-zinc-800 bg-white/[0.03] p-2 sm:p-3">
                    <p className="text-zinc-400">Titular Cuenta Premio</p>
                    <p className="truncate font-medium text-white">{selectedCard.payout_holder_name ?? 'Sin registrar'}</p>
                  </div>
                  <div className="col-span-2 min-w-0 rounded-md border border-zinc-800 bg-white/[0.03] p-2 sm:p-3">
                    <p className="text-zinc-400">Fecha de Registro</p>
                    <p className="truncate font-medium text-white">
                      {new Date(selectedCard.created_at).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b border-zinc-800 bg-black/20 p-4 sm:p-5 xl:border-b-0 xl:border-l">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-300">Carton asignado</p>
                  <Badge className="bg-amber-400 text-zinc-950 hover:bg-amber-400">
                    {selectedCard.card_number}
                  </Badge>
                </div>
                <MiniBingoCard numbers={selectedCard.bingo_numbers} drawnNumbers={raffle.drawn_numbers ?? []} prominent />
              </div>

              <div className="bg-zinc-900/60 p-3 sm:p-5 xl:border-l xl:border-zinc-800">
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
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-200">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  )
}
