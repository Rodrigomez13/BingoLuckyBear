'use client'

import { type TrucoCard } from '@/lib/truco/cards'
import { PlayingCard } from './playing-card'

export function PlayerHand({
  cards,
  canPlay,
  onPlay,
}: {
  cards: TrucoCard[]
  canPlay: boolean
  onPlay: (cardId: string) => void
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-end justify-center gap-2 sm:gap-4">
        {cards.length === 0 ? (
          <p className="py-6 text-sm text-emerald-100/60">Sin cartas en la mano</p>
        ) : (
          cards.map((card) => (
            <PlayingCard
              key={card.id}
              card={card}
              size="lg"
              selectable={canPlay}
              onClick={() => canPlay && onPlay(card.id)}
            />
          ))
        )}
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300/80">Tu mano</p>
    </div>
  )
}
