import type { Player } from '@/lib/truco/engine'

export function TrickHistory({
  winners,
  hand,
  perspective = 'player',
  rivalLabel = 'Oso',
  compact = false,
}: {
  winners: (Player | 'tie' | null)[]
  hand: Player
  perspective?: Player
  rivalLabel?: string
  compact?: boolean
}) {
  const labels = ['1ª', '2ª', '3ª']

  if (compact) {
    return (
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/10 pt-2">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-200/65">
          Bazas · mano {hand === perspective ? 'vos' : rivalLabel}
        </p>
        <div className="flex gap-1">
          {winners.map((winner, index) => (
            <span
              key={labels[index]}
              title={`${labels[index]}: ${formatWinner(winner, rivalLabel, perspective)}`}
              className={`flex h-5 min-w-5 items-center justify-center rounded-full border px-1 text-[8px] font-black ${
                winner === null
                  ? 'border-white/10 bg-white/[0.03] text-white/35'
                  : winner === 'tie'
                    ? 'border-sky-300/30 bg-sky-400/10 text-sky-100'
                    : winner === perspective
                      ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100'
                      : 'border-amber-300/30 bg-amber-400/10 text-amber-100'
              }`}
            >
              {winner === null ? labels[index][0] : winner === 'tie' ? 'P' : winner === perspective ? 'V' : 'R'}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-amber-300/15 bg-black/20 p-2 shadow-inner shadow-black/30 sm:p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/80">Bazas</p>
        <p className="text-[10px] font-semibold text-emerald-100/45">Mano: {hand === 'player' ? 'Vos' : rivalLabel}</p>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {winners.map((winner, index) => (
          <div
            key={labels[index]}
            className={`rounded-xl border px-2 py-1.5 text-center ${
              winner === null
                ? 'border-white/10 bg-white/[0.03] text-emerald-100/40'
                : winner === 'tie'
                  ? 'border-sky-300/25 bg-sky-400/10 text-sky-100'
                  : winner === 'player'
                    ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100'
                    : 'border-amber-300/30 bg-amber-400/10 text-amber-100'
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-wider opacity-70">{labels[index]}</p>
            <p className="truncate text-[11px] font-bold sm:text-xs">{formatWinner(winner, rivalLabel, perspective)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatWinner(winner: Player | 'tie' | null, rivalLabel: string, perspective: Player) {
  if (!winner) return 'Pendiente'
  if (winner === 'tie') return 'Parda'
  return winner === perspective ? 'Vos' : rivalLabel
}
