'use client'

import { PlayingCard } from './playing-card'

export function OpponentHand({ count, name = 'Oso Dorado' }: { count: number; name?: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300/80">{name}</p>
      <div className="flex items-start justify-center gap-2 sm:gap-3">
        {count === 0 ? (
          <p className="py-4 text-sm text-emerald-100/60">Sin cartas</p>
        ) : (
          Array.from({ length: count }).map((_, i) => (
            <PlayingCard key={i} faceDown size="md" className="-rotate-2 first:rotate-2" />
          ))
        )}
      </div>
    </div>
  )
}
