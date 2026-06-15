'use client'

import { type Player } from '@/lib/truco/engine'
import type { TrucoScoreStyle } from '@/lib/truco/rules'
import { TrickHistory } from './trick-history'

export function ScoreBoard({
  scores,
  target,
  perspective = 'player',
  rivalLabel = 'Rival',
  trickWinners,
  hand,
  compact = false,
  scoreStyle = 'numeric',
}: {
  scores: Record<Player, number>
  target: number
  perspective?: Player
  rivalLabel?: string
  trickWinners?: (Player | 'tie' | null)[]
  hand?: Player
  compact?: boolean
  scoreStyle?: TrucoScoreStyle
}) {
  const rival = perspective === 'player' ? 'opponent' : 'player'

  return (
    <div className={`rounded-2xl border border-amber-300/20 bg-[#06140e]/80 ${compact ? 'p-2' : 'p-4'} shadow-xl shadow-black/30`}>
      <div className={`${compact ? 'mb-1.5' : 'mb-3'} flex items-center justify-between`}>
        <h3 className={`${compact ? 'text-[10px]' : 'text-xs'} font-black uppercase tracking-[0.2em] text-amber-300`}>Marcador</h3>
        <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-[10px] font-bold text-amber-200">
          a {target}
        </span>
      </div>
      <div className={`${compact ? 'gap-2' : 'gap-3'} grid grid-cols-2`}>
        <ScoreColumn label="Vos" value={scores[perspective]} target={target} accent="emerald" compact={compact} scoreStyle={scoreStyle} />
        <ScoreColumn label={rivalLabel} value={scores[rival]} target={target} accent="amber" compact={compact} scoreStyle={scoreStyle} />
      </div>
      {trickWinners && hand && (
        <TrickHistory
          winners={trickWinners}
          hand={hand}
          perspective={perspective}
          rivalLabel={rivalLabel}
          compact
        />
      )}
    </div>
  )
}

function ScoreColumn({
  label,
  value,
  target,
  accent,
  compact,
  scoreStyle,
}: {
  label: string
  value: number
  target: number
  accent: 'emerald' | 'amber'
  compact?: boolean
  scoreStyle: TrucoScoreStyle
}) {
  const accentText = accent === 'emerald' ? 'text-emerald-300' : 'text-amber-300'
  return (
    <div className={`rounded-xl border border-white/10 bg-black/30 ${compact ? 'px-2 py-1.5' : 'p-3'} text-center`}>
      <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-100/60 sm:text-[10px]">{label}</p>
      {scoreStyle === 'traditional' ? (
        <TraditionalScore value={value} target={target} accent={accent} compact={compact} />
      ) : (
        <p className={`${compact ? 'mt-0 text-2xl' : 'mt-1 text-4xl'} font-mono font-black leading-none ${accentText}`}>{value}</p>
      )}
      <div className={`${compact ? 'mt-1 h-1.5' : 'mt-2 h-2'} flex w-full overflow-hidden rounded-full bg-white/10`}>
        <div
          className={`h-full rounded-full ${accent === 'emerald' ? 'bg-emerald-400' : 'bg-amber-400'}`}
          style={{ width: `${Math.min(100, (value / target) * 100)}%` }}
        />
      </div>
    </div>
  )
}

function TraditionalScore({
  value,
  target,
  accent,
  compact,
}: {
  value: number
  target: number
  accent: 'emerald' | 'amber'
  compact?: boolean
}) {
  const groups = Math.ceil(target / 5)
  const color = accent === 'emerald' ? 'bg-emerald-300' : 'bg-amber-300'

  return (
    <div
      className={`mx-auto mt-1 grid w-fit grid-cols-3 ${compact ? 'gap-1' : 'gap-1.5'}`}
      aria-label={`${value} puntos`}
      title={`${value} puntos`}
    >
      {Array.from({ length: groups }, (_, index) => {
        const marks = Math.max(0, Math.min(5, value - index * 5))
        return (
          <span
            key={index}
            className={`relative block ${compact ? 'h-4 w-4' : 'h-5 w-5'}`}
            aria-hidden="true"
          >
            <TallyStroke visible={marks >= 1} className={`left-0 top-0 h-px w-full ${color}`} />
            <TallyStroke visible={marks >= 2} className={`right-0 top-0 h-full w-px ${color}`} />
            <TallyStroke visible={marks >= 3} className={`bottom-0 right-0 h-px w-full ${color}`} />
            <TallyStroke visible={marks >= 4} className={`bottom-0 left-0 h-full w-px ${color}`} />
            <TallyStroke visible={marks >= 5} className={`left-1/2 top-[-10%] h-[120%] w-px -rotate-45 ${color}`} />
          </span>
        )
      })}
    </div>
  )
}

function TallyStroke({ visible, className }: { visible: boolean; className: string }) {
  return <span className={`absolute origin-center ${className} ${visible ? 'opacity-100' : 'opacity-10'}`} />
}
