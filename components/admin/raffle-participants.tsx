'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CalendarDays, CheckCircle2, ClipboardCopy, DollarSign, ExternalLink, Gift, Landmark, Plus, RefreshCw, Save, Search, Trash2, Trophy, Users, XCircle } from 'lucide-react'
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
  getPrizeSchedule,
  getBingoColumnLabels,
  getBingoRows,
  isMarked,
  normalizePrizeAmounts,
} from '@/lib/bingo'
import { formatArgentinaDate, formatArgentinaDateTime, parseArgentinaDateTimeLocal, toArgentinaDateTimeLocal } from '@/lib/date'
import { formatPhoneInput } from '@/lib/phone'

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
  payment_status?: 'pending' | 'approved' | 'rejected' | null
  receipt_amount?: number | null
  receipt_operation_number?: string | null
  receipt_destination_account?: string | null
  receipt_date?: string | null
  receipt_raw_text?: string | null
  receipt_parse_status?: 'not_parsed' | 'parsed' | 'failed' | 'not_configured' | null
  receipt_parse_error?: string | null
  receipt_validation_notes?: string | null
  receipt_parsed_at?: string | null
  winner_photo_url?: string | null
  winner_testimonial?: string | null
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
  const [isSavingShowcase, setIsSavingShowcase] = useState(false)
  const [selectedCard, setSelectedCard] = useState<BingoCard | null>(null)
  const [winnerPhotoFile, setWinnerPhotoFile] = useState<File | null>(null)
  const [winnerTestimonial, setWinnerTestimonial] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [winnerOnly, setWinnerOnly] = useState(false)
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [participantsPage, setParticipantsPage] = useState(1)
  const [details, setDetails] = useState({
    prize: raffle.prize ?? '',
    additional_prizes: raffle.additional_prizes ?? [],
    amount: raffle.amount ?? '',
    payment_account_id: raffle.payment_account_id ?? '',
    bundle_offers: raffle.bundle_offers ?? [],
    draw_date: toArgentinaDateTimeLocal(raffle.draw_date ?? null),
  })
  const detailPrizeValues = [details.prize, details.additional_prizes[0] ?? '', details.additional_prizes[1] ?? '', details.additional_prizes[2] ?? '']
  const detailPrizeTargets = getPrizeSchedule(detailPrizeValues)

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
      draw_date: toArgentinaDateTimeLocal(raffle.draw_date ?? null),
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
      const matchesPaymentStatus = paymentStatusFilter === 'all' || (card.payment_status ?? 'pending') === paymentStatusFilter
      const cardTime = new Date(card.created_at).getTime()
      const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null
      const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null
      const matchesDateFrom = fromTime === null || cardTime >= fromTime
      const matchesDateTo = toTime === null || cardTime <= toTime
      const matchesSearch =
        !normalizedSearch ||
        [card.card_number, card.full_name, card.dni, card.phone, card.email, card.payment_reference ?? '', card.receipt_operation_number ?? '', card.receipt_destination_account ?? '', card.payout_account ?? '', card.payout_holder_name ?? '']
          .some((value) => value.toLowerCase().includes(normalizedSearch))

      return matchesWinner && matchesPaymentStatus && matchesDateFrom && matchesDateTo && matchesSearch
    })
  }, [awardedCardIds, cards, dateFrom, dateTo, paymentStatusFilter, searchTerm, winnerOnly])
  const paymentStatusCounts = useMemo(() => ({
    pending: cards.filter((card) => (card.payment_status ?? 'pending') === 'pending').length,
    approved: cards.filter((card) => card.payment_status === 'approved').length,
    rejected: cards.filter((card) => card.payment_status === 'rejected').length,
  }), [cards])
  const participantsPerPage = 8
  const participantsPageCount = Math.max(1, Math.ceil(filteredCards.length / participantsPerPage))
  const visibleCards = filteredCards.slice((participantsPage - 1) * participantsPerPage, participantsPage * participantsPerPage)

  useEffect(() => {
    setParticipantsPage(1)
  }, [dateFrom, dateTo, paymentStatusFilter, searchTerm, winnerOnly, raffle.id])

  useEffect(() => {
    if (participantsPage > participantsPageCount) {
      setParticipantsPage(participantsPageCount)
    }
  }, [participantsPage, participantsPageCount])

  useEffect(() => {
    setWinnerPhotoFile(null)
    setWinnerTestimonial(selectedCard?.winner_testimonial ?? '')
  }, [selectedCard])

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

      const additionalPrizes = [current.additional_prizes[0] ?? '', current.additional_prizes[1] ?? '', current.additional_prizes[2] ?? '']
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

      if (sortedPrizes.length !== 4) {
        alert('Carga los 4 montos de premios antes de guardar.')
        return
      }

      const payload = {
        prize: sortedPrizes[0],
        additional_prizes: [sortedPrizes[1], sortedPrizes[2], sortedPrizes[3]],
        amount: details.amount || null,
        payment_account_id: details.payment_account_id || null,
        bundle_offers: details.bundle_offers.map((item) => item.trim()).filter(Boolean),
        draw_date: parseArgentinaDateTimeLocal(details.draw_date),
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

    const headers = ['Numero Carton', 'Nombre Completo', 'DNI', 'Direccion', 'Telefono', 'Email', 'Estado Pago', 'Metodo Pago', 'Operacion Informada', 'Monto Detectado', 'Operacion Detectada', 'Destino Detectado', 'Parseo', 'Notas Validacion', 'Tipo Cuenta Premio', 'Cuenta Premio', 'Titular Cuenta Premio', 'Fecha Registro']
    const rows = filteredCards.map(card => [
      card.card_number,
      card.full_name,
      card.dni,
      card.address,
      formatPhoneInput(card.phone),
      card.email,
      getPaymentStatusLabel(card.payment_status),
      card.payment_method ?? '',
      card.payment_reference ?? '',
      card.receipt_amount ?? '',
      card.receipt_operation_number ?? '',
      card.receipt_destination_account ?? '',
      getReceiptParseStatusLabel(card.receipt_parse_status),
      card.receipt_validation_notes ?? card.receipt_parse_error ?? '',
      card.payout_account_kind ?? '',
      card.payout_account ?? '',
      card.payout_holder_name ?? '',
      formatArgentinaDateTime(card.created_at)
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

  const saveWinnerShowcase = async () => {
    if (!selectedCard) return

    setIsSavingShowcase(true)

    try {
      let winnerPhotoUrl = selectedCard.winner_photo_url ?? null

      if (winnerPhotoFile) {
        const uploadForm = new FormData()
        uploadForm.append('file', winnerPhotoFile)
        uploadForm.append('purpose', 'winner-photo')

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadForm,
        })
        const uploadData = await uploadResponse.json()

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'No se pudo subir la foto')
        }

        winnerPhotoUrl = uploadData.pathname
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from('bingo_cards')
        .update({
          winner_photo_url: winnerPhotoUrl,
          winner_testimonial: winnerTestimonial.trim() || null,
        })
        .eq('id', selectedCard.id)
        .select('*')
        .single()

      if (error) throw error

      setCards((current) => current.map((card) => (card.id === selectedCard.id ? data as BingoCard : card)))
      setSelectedCard(data as BingoCard)
      setWinnerPhotoFile(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo guardar la referencia del ganador.')
    } finally {
      setIsSavingShowcase(false)
    }
  }

  return (
    <div className="min-w-0 space-y-5 overflow-hidden">
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
                Menor: fila 3. Intermedio: fila 2. Grande: fila 1. Mayor: carton completo.
              </p>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              {detailPrizeValues.map((item, index) => {
                const target = detailPrizeTargets[index]

                return (
                <div key={index} className="space-y-2">
                  <label htmlFor={`raffle-row-prize-${index}`} className="text-sm font-medium text-zinc-300">
                    {target?.label ?? `Premio ${index + 1}`}
                  </label>
                    <Input
                      id={`raffle-row-prize-${index}`}
                      value={item}
                      onChange={(event) => updateDetailPrize(index, event.target.value)}
                      placeholder={index === 0 ? '$25.000' : index === 1 ? '$50.000' : index === 2 ? '$100.000' : '$250.000'}
                      className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400"
                    />
                    <p className="text-xs text-zinc-500">{target?.conditionLabel}</p>
                  </div>
                )
              })}
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
        <div className="mb-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <SummaryTile icon={<Users className="h-5 w-5" />} label="Participantes" value={String(cards.length)} />
          <SummaryTile icon={<Trophy className="h-5 w-5" />} label="Premios adjudicados" value={`${prizeAwards.length}/4`} />
          <SummaryTile icon={<Search className="h-5 w-5" />} label="Vista actual" value={String(filteredCards.length)} />
          <SummaryTile icon={<RefreshCw className="h-5 w-5" />} label="Pendientes" value={String(paymentStatusCounts.pending)} />
          <SummaryTile icon={<CheckCircle2 className="h-5 w-5" />} label="Aprobados" value={String(paymentStatusCounts.approved)} />
          <SummaryTile icon={<XCircle className="h-5 w-5" />} label="Rechazados" value={String(paymentStatusCounts.rejected)} />
        </div>

        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_1.35fr]">
          <div className="rounded-md border border-amber-400/25 bg-amber-400/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Premios pendientes</p>
            <p className="mt-2 text-xl font-bold text-white">
              {currentPrizeTarget ? `${4 - prizeAwards.length} por adjudicar` : 'Sorteo completo'}
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              {currentPrizeTarget
                ? 'Las bolillas pueden completar cualquier premio, sin orden fijo.'
                : 'Ya se adjudicaron los 4 premios.'}
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Premios del sorteo</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              {getPrizeSchedule(prizeAmounts).map((target) => {
                const award = prizeAwards.find((item) => item.prizeNumber === target.prizeNumber)

                return (
                  <div key={target.prizeNumber} className="rounded-md border border-white/10 bg-black/20 p-3">
                    <p className="font-bold text-white">{target.label}</p>
                    <p className="text-sm text-amber-100">{target.amount || 'A confirmar'}</p>
                    <p className="mt-1 text-xs text-zinc-400">{award ? `Adjudicado con el ${award.drawnNumber}` : target.conditionLabel}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-3 xl:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por carton, nombre, DNI, telefono, email, operacion o destino"
              className="border-zinc-700 bg-zinc-900 pl-9 text-white focus:border-amber-400"
            />
          </div>
          <select
            value={paymentStatusFilter}
            onChange={(event) => setPaymentStatusFilter(event.target.value as typeof paymentStatusFilter)}
            className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-amber-400"
          >
            <option value="all">Todos los pagos</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Rechazados</option>
          </select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 xl:w-40"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 xl:w-40"
          />
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
            <div className="hidden grid-cols-[1.05fr_1.25fr_0.7fr_0.9fr_0.75fr_0.8fr_140px] gap-3 border-b border-zinc-800 px-3 pb-2 text-sm font-semibold text-amber-200 xl:grid">
              <span>Carton</span>
              <span>Nombre</span>
              <span>DNI</span>
              <span>Telefono</span>
              <span>Pago</span>
              <span>Fecha</span>
              <span>Acciones</span>
            </div>
            {visibleCards.map((card) => {
              const cardAwards = prizeAwards.filter((award) => award.winners.some((winner) => winner.id === card.id))

              return (
                <div
                  key={card.id}
                  className="grid gap-3 rounded-md border border-zinc-800 bg-white/[0.03] p-3 text-sm transition-colors hover:border-amber-400/40 hover:bg-white/[0.05] xl:grid-cols-[1.05fr_1.25fr_0.7fr_0.9fr_0.75fr_0.8fr_140px] xl:items-center"
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
                          {award.label}
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
                    <p className="break-all">{formatPhoneInput(card.phone)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 xl:hidden">Pago</p>
                    <PaymentStatusBadge status={card.payment_status} />
                    <p className="mt-1 text-xs text-zinc-500">{getReceiptParseStatusLabel(card.receipt_parse_status)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 xl:hidden">Fecha</p>
                    <p className="text-zinc-400">{formatArgentinaDate(card.created_at)}</p>
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
            {filteredCards.length > participantsPerPage && (
              <PaginationControls
                page={participantsPage}
                pageCount={participantsPageCount}
                total={filteredCards.length}
                onPrevious={() => setParticipantsPage((page) => Math.max(1, page - 1))}
                onNext={() => setParticipantsPage((page) => Math.min(participantsPageCount, page + 1))}
              />
            )}
          </div>
        )}
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="flex max-h-[calc(100dvh-1.5rem)] w-[min(99vw,1760px)] max-w-none grid-rows-none flex-col overflow-hidden border-zinc-800 bg-zinc-950 p-0 text-zinc-100">
          <DialogHeader className="border-b border-zinc-800 px-5 py-4">
            <DialogTitle className="text-white">
              Detalles del Participante
            </DialogTitle>
          </DialogHeader>
            {selectedCard && (
            <div className="lbb-scrollbar grid min-h-0 flex-1 gap-0 overflow-y-auto xl:grid-cols-[minmax(0,0.92fr)_minmax(280px,0.68fr)_minmax(240px,320px)] xl:overflow-hidden">
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
                    <p className="truncate font-medium text-white">{formatPhoneInput(selectedCard.phone)}</p>
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
                      {formatArgentinaDateTime(selectedCard.created_at)}
                    </p>
                  </div>
                </div>

                <div className="rounded-md border border-sky-300/25 bg-sky-400/10 p-3">
                  <p className="flex items-center gap-2 font-semibold text-white">
                    Estado del pago
                    <PaymentStatusBadge status={selectedCard.payment_status} />
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    La lectura OCR, aprobacion y rechazo de comprobantes se gestionan desde la seccion Pagos del panel.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <InfoChip label="OCR" value={getReceiptParseStatusLabel(selectedCard.receipt_parse_status)} />
                    <InfoChip label="Monto detectado" value={selectedCard.receipt_amount ? String(selectedCard.receipt_amount) : 'Sin detectar'} />
                    <InfoChip label="Operacion" value={selectedCard.receipt_operation_number ?? selectedCard.payment_reference ?? 'Sin registrar'} />
                  </div>
                </div>

                {awardedCardIds.has(selectedCard.id) && (
                  <div className="rounded-md border border-emerald-400/25 bg-emerald-500/10 p-3">
                    <p className="font-semibold text-white">Referencia publica del ganador</p>
                    <p className="mt-1 text-sm text-zinc-400">Estos datos pueden mostrarse en Ganadores para generar confianza.</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)]">
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => setWinnerPhotoFile(event.target.files?.[0] ?? null)}
                        className="border-zinc-700 bg-zinc-900 text-white file:mr-3 file:rounded file:border-0 file:bg-amber-400 file:px-3 file:py-1 file:text-sm file:font-bold file:text-zinc-950"
                      />
                      <Input
                        value={winnerTestimonial}
                        onChange={(event) => setWinnerTestimonial(event.target.value)}
                        placeholder="Ej: Premio pagado y ganador verificado"
                        className="border-zinc-700 bg-zinc-900 text-white"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={saveWinnerShowcase}
                      disabled={isSavingShowcase}
                      className="mt-3 bg-emerald-500 font-bold text-white hover:bg-emerald-600"
                    >
                      {isSavingShowcase ? 'Guardando' : 'Guardar referencia'}
                    </Button>
                  </div>
                )}
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

function getPaymentStatusLabel(status?: BingoCard['payment_status']) {
  if (status === 'approved') return 'Aprobado'
  if (status === 'rejected') return 'Rechazado'
  return 'Pendiente'
}

function getReceiptParseStatusLabel(status?: BingoCard['receipt_parse_status']) {
  if (status === 'parsed') return 'Leido'
  if (status === 'failed') return 'Lectura fallida'
  if (status === 'not_configured') return 'OCR no configurado'
  return 'Sin leer'
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-black/20 p-2">
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

function PaymentStatusBadge({ status }: { status?: BingoCard['payment_status'] }) {
  if (status === 'approved') {
    return <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Aprobado</Badge>
  }

  if (status === 'rejected') {
    return <Badge className="bg-red-500 text-white hover:bg-red-500">Rechazado</Badge>
  }

  return <Badge className="bg-amber-400 text-zinc-950 hover:bg-amber-400">Pendiente</Badge>
}

function PaginationControls({
  page,
  pageCount,
  total,
  onPrevious,
  onNext,
}: {
  page: number
  pageCount: number
  total: number
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-zinc-400">
        {total} resultado{total !== 1 ? 's' : ''} - pagina {page} de {pageCount}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={page <= 1}
          className="border-zinc-600 bg-transparent text-zinc-200 hover:bg-white/10"
        >
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onNext}
          disabled={page >= pageCount}
          className="border-amber-400/40 bg-transparent text-amber-200 hover:bg-amber-400/10"
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
