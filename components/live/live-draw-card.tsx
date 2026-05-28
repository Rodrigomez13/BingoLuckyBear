'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { CalendarDays, Clock, Crown, Gift, Radio, Ticket, WalletCards } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BINGO_TOTAL_BALLS, formatDrawnNumber, formatMoneyAmount, getCountdownRemainingSeconds, getPrizeAmounts } from '@/lib/bingo'

interface Raffle {
  id: string
  name: string
  description: string | null
  is_active: boolean
  prize?: string | null
  additional_prizes?: string[] | null
  amount?: string | null
  bundle_offers?: string[] | null
  draw_date?: string | null
  draw_status?: 'idle' | 'running' | 'finished' | null
  countdown_seconds?: number | null
  draw_started_at?: string | null
  drawn_numbers?: number[] | null
}

interface LiveDrawCardProps {
  initialRaffle?: Raffle | null
  compact?: boolean
}

interface ActiveRaffleResponse {
  raffle: Raffle | null
  currentPrizeTarget?: { prizeNumber: number; rowIndex: number; amount: string } | null
  prizeAwards?: { prizeNumber: number; amount: string; drawnNumber: number }[]
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export function LiveDrawCard({ initialRaffle = null, compact = false }: LiveDrawCardProps) {
  const [raffle, setRaffle] = useState<Raffle | null>(initialRaffle)
  const [currentPrizeTarget, setCurrentPrizeTarget] = useState<ActiveRaffleResponse['currentPrizeTarget']>(null)
  const [prizeAwards, setPrizeAwards] = useState<NonNullable<ActiveRaffleResponse['prizeAwards']>>([])
  const [remaining, setRemaining] = useState(() =>
    getCountdownRemainingSeconds(initialRaffle?.draw_started_at ?? null, initialRaffle?.countdown_seconds ?? null)
  )

  useEffect(() => {
    const loadRaffle = async () => {
      const response = await fetch('/api/raffles/active', { cache: 'no-store' })
      const data = (await response.json()) as ActiveRaffleResponse
      setRaffle(data.raffle ?? null)
      setCurrentPrizeTarget(data.currentPrizeTarget ?? null)
      setPrizeAwards(data.prizeAwards ?? [])
    }

    loadRaffle()
    const interval = window.setInterval(loadRaffle, 5000)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const tick = () => {
      setRemaining(getCountdownRemainingSeconds(raffle?.draw_started_at ?? null, raffle?.countdown_seconds ?? null))
    }

    tick()
    const interval = window.setInterval(tick, 1000)

    return () => window.clearInterval(interval)
  }, [raffle?.countdown_seconds, raffle?.draw_started_at])

  const drawnNumbers = useMemo(() => raffle?.drawn_numbers ?? [], [raffle?.drawn_numbers])
  const prizeAmounts = useMemo(() => getPrizeAmounts(raffle?.prize, raffle?.additional_prizes), [raffle?.prize, raffle?.additional_prizes])
  const firstPrize = prizeAmounts[0]
  const cardAmount = formatMoneyAmount(raffle?.amount)
  const lastNumber = drawnNumbers[drawnNumbers.length - 1]
  const isRunning = raffle?.draw_status === 'running'
  const isFinished = raffle?.draw_status === 'finished'
  const hasStarted = isRunning || isFinished || drawnNumbers.length > 0

  if (!raffle) {
    return null
  }

  return (
    <section className={compact ? '' : 'px-4 py-10 sm:px-6 lg:px-8'}>
      <div className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-amber-400/30 bg-zinc-950/80 shadow-xl shadow-black/30 backdrop-blur">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge className="bg-red-500 text-white hover:bg-red-500">
                <Radio className="mr-1 h-3.5 w-3.5" />
                {hasStarted ? 'Sorteo en vivo' : 'Sorteo activo'}
              </Badge>
              {isFinished && (
                <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">
                  <Crown className="mr-1 h-3.5 w-3.5" />
                  Finalizado
                </Badge>
              )}
            </div>

            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {raffle.name}
            </h2>
            {firstPrize && (
              <div className="mt-4 rounded-lg border border-amber-300/35 bg-gradient-to-r from-amber-300 to-orange-500 p-4 text-zinc-950 shadow-lg shadow-amber-950/20">
                <p className="text-xs font-semibold uppercase tracking-wide">Primer premio</p>
                <p className="mt-1 break-words text-3xl font-bold tracking-tight sm:text-4xl">
                  {firstPrize}
                </p>
              </div>
            )}
            {raffle.description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300">{raffle.description}</p>}

            <div className="mt-5 grid auto-rows-fr gap-3 sm:grid-cols-3">
              <LiveInfo
                icon={<Gift className="h-4 w-4" />}
                label="Ahora en juego"
                value={currentPrizeTarget ? `Premio ${currentPrizeTarget.prizeNumber}` : 'Completo'}
                detail={currentPrizeTarget ? `Fila ${currentPrizeTarget.rowIndex + 1} - ${currentPrizeTarget.amount || 'A confirmar'}` : '3 premios adjudicados'}
              />
              <LiveInfo icon={<WalletCards className="h-4 w-4" />} label="Monto" value={cardAmount} />
              <LiveInfo
                icon={<CalendarDays className="h-4 w-4" />}
                label="Fecha"
                value={raffle.draw_date ? new Date(raffle.draw_date).toLocaleString('es-ES') : 'A confirmar'}
              />
            </div>

            {prizeAmounts.length > 0 && (
              <div className="mt-3 rounded-md border border-white/10 bg-white/[0.04] p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-300">Todos los premios</p>
                <div className="grid auto-rows-fr gap-2 sm:grid-cols-3">
                  {[1, 2, 3].map((prizeNumber) => {
                    const award = prizeAwards.find((item) => item.prizeNumber === prizeNumber)
                    return (
                    <span key={prizeNumber} className="min-w-0 rounded-md bg-amber-400/10 px-3 py-2 text-sm font-semibold text-amber-100">
                      <span className="block text-xs uppercase">Premio {prizeNumber}</span>
                      {prizeAmounts[prizeNumber - 1] ?? 'A confirmar'}
                      <span className="block text-xs text-zinc-400">{award ? `Con el ${award.drawnNumber}` : `Fila ${prizeNumber}`}</span>
                    </span>
                    )
                  })}
                </div>
              </div>
            )}

            {!!raffle.bundle_offers?.length && (
              <div className="mt-3 rounded-md border border-emerald-400/20 bg-emerald-500/10 p-3">
                <p className="mb-2 text-xs font-bold uppercase text-emerald-100">Promos por cantidad</p>
                <div className="flex flex-wrap gap-2">
                  {raffle.bundle_offers.map((item, index) => (
                    <span key={`${item}-${index}`} className="rounded-md bg-black/20 px-3 py-1 text-sm font-semibold text-white">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 grid auto-rows-fr gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-amber-300">
                  <Clock className="h-4 w-4" />
                  Cuenta regresiva
                </p>
                <p className="mt-2 font-mono text-3xl font-bold text-white">{formatTime(remaining)}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-amber-300">Ultimo numero</p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {formatDrawnNumber(lastNumber)}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-amber-300">Numeros cantados</p>
                <p className="mt-2 text-3xl font-bold text-white">{drawnNumbers.length}<span className="text-base text-zinc-400">/{BINGO_TOTAL_BALLS}</span></p>
              </div>
            </div>
          </div>

          <div className="min-w-0 border-t border-white/10 bg-black/30 p-4 sm:p-5 lg:border-l lg:border-t-0">
            <p className="mb-3 text-sm font-semibold text-zinc-200">Bolillero</p>
            <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-2">
              {drawnNumbers.length === 0 ? (
                <div className="w-full flex-none rounded-md border border-dashed border-white/15 p-5 text-center text-sm text-zinc-400">
                  Todavia no salieron numeros.
                </div>
              ) : (
                [...drawnNumbers].reverse().map((number) => (
                  <div
                    key={number}
                    className="flex h-12 w-12 flex-none snap-start items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/20 sm:h-14 sm:w-14"
                  >
                    {number}
                  </div>
                ))
              )}
            </div>
            <Button asChild className="mt-5 h-auto w-full whitespace-normal bg-amber-400 py-3 text-center font-semibold leading-tight text-zinc-950 hover:bg-amber-300">
              <Link href="/participar" className="flex items-center justify-center">
                <Ticket className="mr-2 h-4 w-4" />
                {firstPrize ? `Participar por ${firstPrize}` : 'Ver mi carton'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function LiveInfo({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail?: string }) {
  return (
    <div className="h-full min-w-0 rounded-md border border-white/10 bg-white/[0.04] p-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
        {icon}
        {label}
      </p>
      <p className="mt-1 min-w-0 break-words text-sm font-semibold text-white">{value}</p>
      {detail && <p className="mt-1 text-xs font-semibold text-zinc-400">{detail}</p>}
    </div>
  )
}
