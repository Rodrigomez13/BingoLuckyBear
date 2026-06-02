'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { CalendarDays, Clock, Crown, Gift, Radio, Ticket, WalletCards } from 'lucide-react'
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

interface ActiveRaffleResponse {
  raffle: Raffle | null
  participantCount?: number
  currentPrizeTarget?: { prizeNumber: number; rowIndex: number; amount: string } | null
  prizeAwards?: { prizeNumber: number; amount: string; drawnNumber: number; winners: { id: string; full_name: string; card_number: string }[] }[]
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export function LiveWall() {
  const [raffle, setRaffle] = useState<Raffle | null>(null)
  const [participantCount, setParticipantCount] = useState(0)
  const [currentPrizeTarget, setCurrentPrizeTarget] = useState<ActiveRaffleResponse['currentPrizeTarget']>(null)
  const [prizeAwards, setPrizeAwards] = useState<NonNullable<ActiveRaffleResponse['prizeAwards']>>([])
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    const loadRaffle = async () => {
      const response = await fetch('/api/raffles/active', { cache: 'no-store' })
      const data = (await response.json()) as ActiveRaffleResponse
      setRaffle(data.raffle ?? null)
      setParticipantCount(data.participantCount ?? 0)
      setCurrentPrizeTarget(data.currentPrizeTarget ?? null)
      setPrizeAwards(data.prizeAwards ?? [])
    }

    loadRaffle()
    const interval = window.setInterval(loadRaffle, 3000)

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
  const hasStarted = raffle?.draw_status === 'running' || raffle?.draw_status === 'finished' || drawnNumbers.length > 0

  if (!raffle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
        <div className="max-w-xl text-center">
          <Image src="/logo-contexto.svg" alt="Lucky Bingo Bear" width={240} height={240} className="mx-auto h-auto w-48" />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white">
            No hay sorteo activo
          </h1>
          <p className="mt-3 text-zinc-300">Cuando haya un sorteo disponible, esta pantalla mostrara la cuenta regresiva, las bolillas y los premios en juego.</p>
          <Button asChild className="mt-6 bg-amber-400 font-bold text-zinc-950 hover:bg-amber-300">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_15%,rgba(245,158,11,0.26),transparent_34rem),radial-gradient(circle_at_85%_20%,rgba(16,185,129,0.14),transparent_30rem),linear-gradient(135deg,#09090b,#18181b_45%,#111827)] text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo-solo.svg" alt="Lucky Bingo Bear" width={58} height={58} className="h-12 w-12 object-contain sm:h-14 sm:w-14" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-200">Lucky Bingo Bear</p>
              <p className="text-xs text-zinc-400">Pantalla en vivo</p>
            </div>
          </Link>
          <div className="rounded-md border border-red-400/35 bg-red-500/15 px-4 py-2 text-sm font-bold uppercase tracking-wide text-red-100">
            <Radio className="mr-2 inline h-4 w-4" />
            {hasStarted ? 'En vivo' : 'Sorteo activo'}
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-w-0">
            <Image
              src="/logo-contexto.svg"
              alt="Lucky Bingo Bear"
              width={300}
              height={300}
              priority
              className="mb-6 h-auto w-[min(54vw,260px)] drop-shadow-2xl"
            />
            <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              {raffle.name}
            </h1>
            {firstPrize && (
              <div className="mt-6 max-w-2xl rounded-lg border border-amber-300/35 bg-gradient-to-r from-amber-300 to-orange-500 p-5 text-zinc-950 shadow-2xl shadow-amber-950/20">
                <p className="text-sm font-semibold uppercase tracking-wide">Primer premio</p>
                <p className="mt-1 break-words text-4xl font-bold tracking-tight sm:text-5xl">
                  {firstPrize}
                </p>
              </div>
            )}
            {raffle.description && <p className="mt-5 max-w-2xl text-xl leading-relaxed text-zinc-300">{raffle.description}</p>}

            <div className="mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
              <Stat
                icon={<Gift className="h-6 w-6" />}
                label="Ahora en juego"
                value={currentPrizeTarget ? `Premio ${currentPrizeTarget.prizeNumber}` : 'Completo'}
                detail={currentPrizeTarget ? `Fila ${currentPrizeTarget.rowIndex + 1} - ${currentPrizeTarget.amount || 'A confirmar'}` : '3 premios adjudicados'}
                compact
              />
              <Stat icon={<WalletCards className="h-6 w-6" />} label="Monto" value={cardAmount} compact />
              <Stat
                icon={<CalendarDays className="h-6 w-6" />}
                label="Fecha"
                value={raffle.draw_date ? new Date(raffle.draw_date).toLocaleString('es-ES') : 'A confirmar'}
                compact
              />
              <Stat icon={<Clock className="h-6 w-6" />} label="Cuenta regresiva" value={formatTime(remaining)} />
              <Stat label="Ultimo numero" value={formatDrawnNumber(lastNumber)} />
              <Stat label="Cartones" value={String(participantCount)} />
            </div>

            {prizeAmounts.length > 0 && (
              <div className="mt-5 max-w-4xl rounded-lg border border-amber-400/20 bg-zinc-950/70 p-5 shadow-xl shadow-black/20">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-200">Todos los premios</p>
                <div className="grid auto-rows-fr gap-2 sm:grid-cols-3">
                  {[1, 2, 3].map((prizeNumber) => {
                    const award = prizeAwards.find((item) => item.prizeNumber === prizeNumber)
                    return (
                    <div key={prizeNumber} className="min-w-0 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 font-semibold text-white">
                      <span className="block text-xs uppercase text-amber-200">Premio {prizeNumber}</span>
                      <span>{prizeAmounts[prizeNumber - 1] ?? 'A confirmar'}</span>
                      <span className="mt-1 block text-xs text-zinc-400">{award ? `Adjudicado con el ${award.drawnNumber}` : `Fila ${prizeNumber}`}</span>
                    </div>
                    )
                  })}
                </div>
              </div>
            )}

            {!!raffle.bundle_offers?.length && (
              <div className="mt-5 max-w-4xl rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-5 shadow-xl shadow-black/20">
                <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-100">Promos por cantidad</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {raffle.bundle_offers.map((item, index) => (
                    <div key={`${item}-${index}`} className="rounded-md border border-white/10 bg-black/20 px-3 py-2 font-semibold text-white">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-lg border border-amber-400/25 bg-zinc-950/75 p-5 shadow-2xl shadow-black/35 backdrop-blur">
            <div className="rounded-md border border-white/10 bg-black/25 p-5 text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-200">Numero actual</p>
              <div className="mt-5 flex aspect-square items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-zinc-950 shadow-2xl shadow-amber-500/20">
                <span className="text-6xl font-bold sm:text-7xl">{lastNumber ?? '--'}</span>
              </div>
            </div>

            <div className="mt-5 rounded-md border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-200">Bolillero</p>
                <p className="text-sm text-amber-200">{drawnNumbers.length}/{BINGO_TOTAL_BALLS}</p>
              </div>
              <div className="grid max-h-64 grid-cols-5 gap-2 overflow-hidden sm:grid-cols-6 lg:grid-cols-5">
                {[...drawnNumbers].reverse().slice(0, 30).map((number) => (
                  <div key={number} className="flex aspect-square items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-zinc-950">
                    {number}
                  </div>
                ))}
              </div>
              {drawnNumbers.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">Todavia no salieron numeros.</p>}
            </div>

            <Button asChild className="mt-5 h-auto w-full whitespace-normal bg-amber-400 py-5 text-center font-bold leading-tight text-zinc-950 hover:bg-amber-300">
              <Link href="/participar" className="flex items-center justify-center">
                <Ticket className="mr-2 h-5 w-5" />
                {firstPrize ? `Participar por ${firstPrize}` : 'Participar desde el celular'}
              </Link>
            </Button>

            {raffle.draw_status === 'finished' && (
              <div className="mt-4 rounded-md border border-emerald-400/30 bg-emerald-500/10 p-4 text-center text-emerald-100">
                <Crown className="mx-auto mb-2 h-6 w-6" />
                Sorteo cerrado
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  )
}

function Stat({ icon, label, value, detail, compact = false }: { icon?: ReactNode; label: string; value: string; detail?: string; compact?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/70 p-5 shadow-xl shadow-black/20">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-200">
        {icon}
        {label}
      </p>
      <p className={`mt-3 break-words font-bold text-white ${compact ? 'text-lg' : 'text-3xl'}`}>{value}</p>
      {detail && <p className="mt-1 text-sm font-semibold text-zinc-300">{detail}</p>}
    </div>
  )
}
