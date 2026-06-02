'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Pause, Play, RefreshCw, RotateCcw, Timer, Trophy, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BINGO_TOTAL_BALLS,
  formatDrawnNumber,
  getCountdownRemainingSeconds,
  getCurrentPrizeTarget,
  getPrizeAmounts,
  getPrizeAwards,
  getPrizeSchedule,
} from '@/lib/bingo'

interface Raffle {
  id: string
  name: string
  description: string | null
  prize?: string | null
  additional_prizes?: string[] | null
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
  const [autoIntervalSeconds, setAutoIntervalSeconds] = useState('6')
  const [isAutoDrawEnabled, setIsAutoDrawEnabled] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoStatus, setAutoStatus] = useState<string | null>(null)
  const autoRequestRef = useRef(false)
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
  const prizeAmounts = useMemo(() => getPrizeAmounts(raffle.prize, raffle.additional_prizes), [raffle.prize, raffle.additional_prizes])
  const prizeAwards = useMemo(() => getPrizeAwards(cards, drawnNumbers, prizeAmounts), [cards, drawnNumbers, prizeAmounts])
  const currentPrizeTarget = useMemo(() => getCurrentPrizeTarget(cards, drawnNumbers, prizeAmounts), [cards, drawnNumbers, prizeAmounts])
  const autoInterval = Math.max(3, Math.min(60, Math.round(Number(autoIntervalSeconds || 0) || 6)))
  const isDrawComplete = drawnNumbers.length >= BINGO_TOTAL_BALLS || !currentPrizeTarget || raffle.draw_status === 'finished'

  const runAction = useCallback(async (action: 'start' | 'draw' | 'reset' | 'finish') => {
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
      return data.raffle as Raffle
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return null
    } finally {
      setIsSaving(false)
    }
  }, [countdownMinutes, onRaffleUpdated, raffle.id])

  useEffect(() => {
    if (!isAutoDrawEnabled) {
      return
    }

    if (isDrawComplete) {
      setIsAutoDrawEnabled(false)
      setAutoStatus('Automatico pausado: el sorteo ya no tiene mas premios pendientes.')
      return
    }

    if (raffle.draw_status !== 'running') {
      setAutoStatus('Automatico listo. Inicia el sorteo para comenzar a cantar numeros.')
      return
    }

    if (remaining > 0) {
      setAutoStatus(`Automatico listo. Esperando cuenta regresiva: ${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}.`)
      return
    }

    setAutoStatus(`Automatico activo: canta un numero cada ${autoInterval} segundos.`)
    const interval = window.setInterval(async () => {
      if (autoRequestRef.current) {
        return
      }

      autoRequestRef.current = true
      const updatedRaffle = await runAction('draw')
      autoRequestRef.current = false

      const updatedDrawnNumbers = updatedRaffle?.drawn_numbers ?? drawnNumbers
      const updatedAwards = getPrizeAwards(cards, updatedDrawnNumbers, prizeAmounts)
      const updatedTarget = getCurrentPrizeTarget(cards, updatedDrawnNumbers, prizeAmounts)

      if (updatedDrawnNumbers.length >= BINGO_TOTAL_BALLS || !updatedTarget || updatedAwards.length >= 4) {
        setIsAutoDrawEnabled(false)
        setAutoStatus('Automatico pausado: ya se adjudicaron los premios del sorteo.')
      }
    }, autoInterval * 1000)

    return () => window.clearInterval(interval)
  }, [
    autoInterval,
    cards,
    drawnNumbers,
    isAutoDrawEnabled,
    isDrawComplete,
    prizeAmounts,
    raffle.draw_status,
    remaining,
    runAction,
  ])

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
                ? 'Cerrado'
                : 'Sin iniciar'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-6">
        <div className="grid auto-rows-fr gap-3 md:grid-cols-3">
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Cuenta</p>
            <p className="mt-1 font-mono text-2xl font-bold">
              {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Ultimo numero</p>
            <p className="mt-1 text-2xl font-bold">
              {formatDrawnNumber(lastNumber)}
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Cantados</p>
            <p className="mt-1 text-2xl font-bold">{drawnNumbers.length}/{BINGO_TOTAL_BALLS}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1.35fr]">
          <div className="rounded-md border border-amber-400/30 bg-amber-400/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Premios pendientes</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {currentPrizeTarget ? `${4 - prizeAwards.length} por adjudicar` : 'Completo'}
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              {currentPrizeTarget
                ? 'Cualquier premio se adjudica cuando el carton completa su condicion.'
                : 'Ya se adjudicaron los cuatro premios.'}
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-black/20 p-4">
            <p className="mb-3 text-sm font-semibold text-zinc-200">Premios del sorteo</p>
            <div className="grid auto-rows-fr gap-2 sm:grid-cols-4">
              {getPrizeSchedule(prizeAmounts).map((target) => {
                const award = prizeAwards.find((item) => item.prizeNumber === target.prizeNumber)

                return (
                  <div key={target.prizeNumber} className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm">
                    <p className="font-semibold text-white">{target.label}</p>
                    <p className="text-amber-100">{target.amount || 'A confirmar'}</p>
                    <p className="mt-1 text-xs text-zinc-400">{award ? `Salio con el ${award.drawnNumber}` : target.conditionLabel}</p>
                  </div>
                )
              })}
            </div>
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
              disabled={isSaving || isAutoDrawEnabled || drawnNumbers.length >= BINGO_TOTAL_BALLS}
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

        <div className="grid gap-3 rounded-md border border-sky-300/25 bg-sky-400/10 p-4 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-sky-100">
              <Zap className="h-4 w-4" />
              Modo automatico
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-300">
              Activalo para cantar bolillas sin presionar numero por numero. Se detiene solo al completar premios o al finalizar.
            </p>
            {autoStatus && <p className="mt-2 text-xs font-semibold text-sky-100">{autoStatus}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="autoInterval" className="text-zinc-300">
              Segundos por numero
            </Label>
            <Input
              id="autoInterval"
              type="number"
              min="3"
              max="60"
              step="1"
              value={autoIntervalSeconds}
              onChange={(event) => setAutoIntervalSeconds(event.target.value)}
              className="border-white/10 bg-white/10 text-white"
            />
          </div>
          <Button
            type="button"
            onClick={() => setIsAutoDrawEnabled((current) => !current)}
            disabled={isSaving || isDrawComplete}
            className={
              isAutoDrawEnabled
                ? 'w-full bg-white font-bold text-zinc-950 hover:bg-zinc-200 lg:w-auto'
                : 'w-full bg-sky-400 font-bold text-zinc-950 hover:bg-sky-300 lg:w-auto'
            }
          >
            {isAutoDrawEnabled ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pausar
              </>
            ) : (
              <>
                <Timer className="mr-2 h-4 w-4" />
                Activar auto
              </>
            )}
          </Button>
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
                  className="flex h-11 w-11 flex-none snap-start items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/20"
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

        {prizeAwards.length > 0 && (
          <div className="rounded-md border border-emerald-400/30 bg-emerald-500/10 p-4">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-emerald-100">
              <Trophy className="h-5 w-5" />
              Premios adjudicados
            </h3>
            <div className="space-y-2">
              {prizeAwards.map((award) => (
                <div key={award.prizeNumber} className="rounded-md bg-black/20 p-3 text-sm">
                  <p className="font-bold text-white">{award.label} - {award.amount || 'monto a confirmar'}</p>
                  <p className="text-emerald-100">
                    {award.conditionLabel}, adjudicado con el numero {award.drawnNumber}
                  </p>
                  <div className="mt-2 space-y-1">
                    {award.winners.map((winner) => (
                      <p key={`${award.prizeNumber}-${winner.id}`} className="text-zinc-200">
                        {winner.full_name} - {winner.card_number}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
