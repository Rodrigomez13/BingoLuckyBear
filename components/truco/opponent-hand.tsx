'use client'

import { PlayingCard } from './playing-card'

export function OpponentHand({ count, name = 'Rival' }: { count: number; name?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/80 sm:text-xs">{name}</p>
      <div className="flex items-start justify-center gap-1.5 sm:gap-2">
        {count === 0 ? (
          <p className="py-3 text-sm text-emerald-100/60 sm:py-4">Sin cartas</p>
        ) : (
          Array.from({ length: count }).map((_, i) => (
            <PlayingCard
              key={i}
              faceDown
              size="md"
              eager
              className={`truco-card-enter ${i === 0 ? 'rotate-[6deg] translate-y-1' : i === 2 ? 'rotate-[-6deg] translate-y-1' : ''}`}
            />
          ))
        )}
      </div>
    </div>
  )
}
