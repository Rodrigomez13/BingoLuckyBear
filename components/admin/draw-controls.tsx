'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Play, RefreshCw, RotateCcw, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getBingoLetter, getCountdownRemainingSeconds, getWinningLines } from '@/lib/bingo'

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
  bingo_numbers?: number[][] | null
}

interface DrawControlsProps {
  raffle: Raffle
  cards: BingoCard[]
  onRaffleUpdated: (raffle: Raffle) => void
}

export function DrawControls({ raffle, cards, onRaffleUpdated }: DrawControlsProps) {
  const [countdownMinutes, setCountdownMinutes] = useState('5')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState(() =>
    getCountdownRemainingSeconds(raffle.draw_started_at ?? null, raffle.countdown_seconds ?? null)
  )

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemaining(getCountdownRemainingSeconds(raffle.draw_started_at ?? null, raffle.countdown_seconds ?? null))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [raffle.countdown_seconds, raffle.draw_started_at])

  const drawnNumbers = useMemo(() => raffle.drawn_numbers ?? [], [raffle.drawn_numbers])
  const lastNumber = drawnNumbers[drawnNumbers.length - 1]
  const winners = useMemo(
    () =>
      cards
        .map((card) => ({
          ...card,
          lines: card.bingo_numbers ? getWinningLines(card.bingo_numbers, drawnNumbers) : [],
        }))
        .filter((card) => card.lines.length > 0),
    [cards, drawnNumbers]
  )

  const runAction = async (action: 'start' | 'draw' | 'reset' | 'finish') => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/raffles/${raffle.id}/draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          countdown_seconds: Math.max(10, Math.round(Number(countdownMinutes || 0) * 60)),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo actualizar el sorteo')
      }

      onRaffleUpdated(data.raffle)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-amber-400/25 bg-zinc-950/85 text-white shadow-xl shadow-black/20">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Play className="h-5 w-5 text-amber-300" />
            Control del sorteo
          </CardTitle>
          <Badge className="bg-amber-400 text-zinc-950 hover:bg-amber-400">
            {raffle.draw_status === 'running'
              ? 'En vivo'
              : raffle.draw_status === 'finished'
                ? 'Finalizado'
                : 'Sin iniciar'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Cuenta</p>
            <p className="mt-1 font-mono text-3xl font-black">
              {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Ultimo numero</p>
            <p className="mt-1 text-3xl font-black">
              {lastNumber ? `${getBingoLetter(lastNumber)}-${lastNumber}` : '--'}
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Cantados</p>
            <p className="mt-1 text-3xl font-black">{drawnNumbers.length}/75</p>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[180px_1fr]">
          <div className="space-y-2">
            <Label htmlFor="countdown" className="text-zinc-300">
              Minutos de cuenta regresiva
            </Label>
            <Input
              id="countdown"
              type="number"
              min="1"
              step="1"
              value={countdownMinutes}
              onChange={(event) => setCountdownMinutes(event.target.value)}
              className="border-white/10 bg-white/10 text-white"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-end">
            <Button
              onClick={() => runAction('start')}
              disabled={isSaving}
              className="w-full bg-emerald-500 font-bold text-white hover:bg-emerald-600 xl:w-auto"
            >
              <Play className="mr-2 h-4 w-4" />
              Iniciar
            </Button>
            <Button
              onClick={() => runAction('draw')}
              disabled={isSaving || drawnNumbers.length >= 75}
              className="w-full bg-amber-400 font-bold text-zinc-950 hover:bg-amber-300 xl:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Cantar numero
            </Button>
            <Button onClick={() => runAction('finish')} disabled={isSaving} variant="secondary" className="w-full xl:w-auto">
              Finalizar
            </Button>
            <Button onClick={() => runAction('reset')} disabled={isSaving} variant="destructive" className="w-full xl:w-auto">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reiniciar
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-white/10 bg-black/20 p-3">
          <p className="mb-3 text-sm font-semibold text-zinc-200">Numeros que ya salieron</p>
          <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-1">
            {drawnNumbers.length === 0 ? (
              <div className="w-full flex-none rounded-md border border-dashed border-white/10 p-4 text-center text-sm text-zinc-500">
                Todavia no se canto ningun numero.
              </div>
            ) : (
              [...drawnNumbers].reverse().map((number) => (
                <div
                  key={number}
                  className="flex h-12 w-12 flex-none snap-start items-center justify-center rounded-full bg-amber-400 text-sm font-black text-zinc-950 shadow-lg shadow-amber-500/20"
                >
                  {number}
                </div>
              ))
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {winners.length > 0 && (
          <div className="rounded-md border border-emerald-400/30 bg-emerald-500/10 p-4">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-emerald-100">
              <Trophy className="h-5 w-5" />
              Ganador detectado
            </h3>
            <div className="space-y-2">
              {winners.map((winner) => (
                <div key={winner.id} className="rounded-md bg-black/20 p-3 text-sm">
                  <p className="font-bold text-white">
                    {winner.full_name} - {winner.card_number}
                  </p>
                  <p className="text-emerald-100">{winner.lines.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
