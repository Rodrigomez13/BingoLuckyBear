'use client'

import { type Player } from '@/lib/truco/engine'
import { TrickHistory } from './trick-history'

export function ScoreBoard({
  scores,
  target,
  perspective = 'player',
  rivalLabel = 'Rival',
  trickWinners,
  hand,
  compact = false,
}: {
  scores: Record<Player, number>
  target: number
  perspective?: Player
  rivalLabel?: string
  trickWinners?: (Player | 'tie' | null)[]
  hand?: Player
  compact?: boolean
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
        <ScoreColumn label="Vos" value={scores[perspective]} target={target} accent="emerald" compact={compact} />
        <ScoreColumn label={rivalLabel} value={scores[rival]} target={target} accent="amber" compact={compact} />
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
}: {
  label: string
  value: number
  target: number
  accent: 'emerald' | 'amber'
  compact?: boolean
}) {
  const accentText = accent === 'emerald' ? 'text-emerald-300' : 'text-amber-300'
  return (
    <div className={`rounded-xl border border-white/10 bg-black/30 ${compact ? 'px-2 py-1.5' : 'p-3'} text-center`}>
      <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-100/60 sm:text-[10px]">{label}</p>
      <p className={`${compact ? 'mt-0 text-2xl' : 'mt-1 text-4xl'} font-mono font-black leading-none ${accentText}`}>{value}</p>
      <div className={`${compact ? 'mt-1 h-1.5' : 'mt-2 h-2'} flex w-full overflow-hidden rounded-full bg-white/10`}>
        <div
          className={`h-full rounded-full ${accent === 'emerald' ? 'bg-emerald-400' : 'bg-amber-400'}`}
          style={{ width: `${Math.min(100, (value / target) * 100)}%` }}
        />
      </div>
    </div>
  )
}
