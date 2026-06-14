'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Flame, Timer } from 'lucide-react'
import { formatArgentinaDateTime } from '@/lib/date'

interface RaffleCountdownProps {
  drawDate: string | null
  raffleName?: string | null
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function getTimeLeft(target: number): TimeLeft {
  const total = Math.max(0, target - Date.now())
  const days = Math.floor(total / (1000 * 60 * 60 * 24))
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((total / (1000 * 60)) % 60)
  const seconds = Math.floor((total / 1000) % 60)
  return { days, hours, minutes, seconds, total }
}

export function RaffleCountdown({ drawDate, raffleName }: RaffleCountdownProps) {
  const targetTime = useMemo(() => {
    if (!drawDate) return null
    const time = new Date(drawDate).getTime()
    return Number.isNaN(time) ? null : time
  }, [drawDate])

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  useEffect(() => {
    if (!targetTime) {
      setTimeLeft(null)
      return
    }

    setTimeLeft(getTimeLeft(targetTime))
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetTime))
    }, 1000)

    return () => clearInterval(interval)
  }, [targetTime])

  if (!targetTime) return null

  const isImminent = timeLeft !== null && timeLeft.total > 0 && timeLeft.total <= 1000 * 60 * 60
  const isLive = timeLeft !== null && timeLeft.total <= 0

  const hypeLabel = isLive
    ? 'El sorteo esta por comenzar'
    : isImminent
      ? 'Ultima hora para sumarte'
      : 'Faltan para el proximo sorteo'

  return (
    <div
      className={`lbb-soft-transition w-full max-w-md rounded-3xl border bg-zinc-950/70 p-5 backdrop-blur ${
        isLive || isImminent ? 'border-[#04f77c]/40 shadow-xl shadow-[#04f77c]/10' : 'border-white/10'
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]">
        {isLive || isImminent ? (
          <Flame className="h-4 w-4 animate-pulse text-[#04f77c]" />
        ) : (
          <Timer className="h-4 w-4 text-amber-300" />
        )}
        <span className={isLive || isImminent ? 'text-[#04f77c]' : 'text-amber-300'}>{hypeLabel}</span>
      </div>

      {isLive ? (
        <p className="mt-3 font-mono text-3xl font-black leading-none text-white">¡En vivo ahora!</p>
      ) : (
        <div className="mt-4 grid grid-cols-4 gap-2" aria-live="polite">
          <CountUnit value={timeLeft?.days ?? 0} label="dias" highlight={isImminent} />
          <CountUnit value={timeLeft?.hours ?? 0} label="hs" highlight={isImminent} />
          <CountUnit value={timeLeft?.minutes ?? 0} label="min" highlight={isImminent} />
          <CountUnit value={timeLeft?.seconds ?? 0} label="seg" highlight={isImminent} />
        </div>
      )}

      <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-zinc-400">
        <CalendarClock className="h-3.5 w-3.5 shrink-0 text-amber-300" />
        <span className="min-w-0">
          {raffleName ? `${raffleName} - ` : ''}
          {formatArgentinaDateTime(drawDate)} hs
        </span>
      </p>
    </div>
  )
}

function CountUnit({ value, label, highlight }: { value: number; label: string; highlight: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border py-3 ${
        highlight ? 'border-[#04f77c]/30 bg-[#04f77c]/10' : 'border-white/10 bg-black/40'
      }`}
    >
      <span className="font-mono text-2xl font-black leading-none text-white sm:text-3xl">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">{label}</span>
    </div>
  )
}
