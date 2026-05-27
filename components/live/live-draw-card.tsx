'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Clock, Crown, Radio, Ticket } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getBingoLetter, getCountdownRemainingSeconds } from '@/lib/bingo'

interface Raffle {
  id: string
  name: string
  description: string | null
  is_active: boolean
  draw_status?: 'idle' | 'running' | 'finished' | null
  countdown_seconds?: number | null
  draw_started_at?: string | null
  drawn_numbers?: number[] | null
}

interface LiveDrawCardProps {
  initialRaffle?: Raffle | null
  compact?: boolean
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export function LiveDrawCard({ initialRaffle = null, compact = false }: LiveDrawCardProps) {
  const [raffle, setRaffle] = useState<Raffle | null>(initialRaffle)
  const [remaining, setRemaining] = useState(() =>
    getCountdownRemainingSeconds(initialRaffle?.draw_started_at ?? null, initialRaffle?.countdown_seconds ?? null)
  )

  useEffect(() => {
    const loadRaffle = async () => {
      const response = await fetch('/api/raffles/active', { cache: 'no-store' })
      const data = await response.json()
      setRaffle(data.raffle ?? null)
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
  const lastNumber = drawnNumbers[drawnNumbers.length - 1]
  const isRunning = raffle?.draw_status === 'running'
  const isFinished = raffle?.draw_status === 'finished'
  const hasStarted = isRunning || isFinished || drawnNumbers.length > 0

  if (!raffle) {
    return null
  }

  return (
    <section className={compact ? '' : 'px-4 py-10 sm:px-6 lg:px-8'}>
      <div className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-amber-400/30 bg-zinc-950/80 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-5 sm:p-7">
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

            <h2
              className="text-2xl font-bold text-white sm:text-4xl"
              style={{ fontFamily: 'var(--font-fredoka)' }}
            >
              {raffle.name}
            </h2>
            {raffle.description && <p className="mt-2 max-w-2xl text-sm text-zinc-300">{raffle.description}</p>}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-amber-300">
                  <Clock className="h-4 w-4" />
                  Cuenta regresiva
                </p>
                <p className="mt-2 font-mono text-4xl font-black text-white">{formatTime(remaining)}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-amber-300">Ultimo numero</p>
                <p className="mt-2 text-4xl font-black text-white">
                  {lastNumber ? `${getBingoLetter(lastNumber)}-${lastNumber}` : '--'}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-amber-300">Numeros cantados</p>
                <p className="mt-2 text-4xl font-black text-white">{drawnNumbers.length}<span className="text-lg text-zinc-400">/75</span></p>
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
                    className="flex h-14 w-14 flex-none snap-start items-center justify-center rounded-full bg-amber-400 text-base font-black text-zinc-950 shadow-lg shadow-amber-500/20 sm:h-16 sm:w-16"
                  >
                    {number}
                  </div>
                ))
              )}
            </div>
            <Button asChild className="mt-5 w-full bg-amber-400 font-bold text-zinc-950 hover:bg-amber-300">
              <Link href="/participar">
                <Ticket className="mr-2 h-4 w-4" />
                Ver mi carton
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
