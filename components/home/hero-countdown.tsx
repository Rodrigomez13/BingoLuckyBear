'use client'

import { useEffect, useState } from 'react'

interface HeroCountdownProps {
  /** ISO date string of the draw */
  targetDate: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  done: boolean
}

function getTimeLeft(target: number): TimeLeft {
  const diff = target - Date.now()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
  }

  const totalSeconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    done: false,
  }
}

export function HeroCountdown({ targetDate }: HeroCountdownProps) {
  const target = new Date(targetDate).getTime()
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  useEffect(() => {
    if (Number.isNaN(target)) return
    setTimeLeft(getTimeLeft(target))
    const interval = window.setInterval(() => setTimeLeft(getTimeLeft(target)), 1000)
    return () => window.clearInterval(interval)
  }, [target])

  if (Number.isNaN(target) || !timeLeft) {
    return null
  }

  if (timeLeft.done) {
    return (
      <span className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-400/10 px-3 py-1.5 text-sm font-semibold text-emerald-200">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
        El sorteo ya esta en juego
      </span>
    )
  }

  const units = [
    { label: 'Dias', value: timeLeft.days },
    { label: 'Hs', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.minutes },
    { label: 'Seg', value: timeLeft.seconds },
  ]

  return (
    <div className="flex items-center gap-2" role="timer" aria-label="Cuenta regresiva para el sorteo">
      {units.map((unit) => (
        <div
          key={unit.label}
          className="flex min-w-[3.25rem] flex-col items-center rounded-lg border border-white/12 bg-white/[0.06] px-2 py-1.5"
        >
          <span className="font-mono text-xl font-bold leading-none text-white tabular-nums sm:text-2xl">
            {String(unit.value).padStart(2, '0')}
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{unit.label}</span>
        </div>
      ))}
    </div>
  )
}
