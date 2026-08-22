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
    <div className="lbb-truco-player-hand flex flex-col items-center gap-1.5 sm:gap-2">
      <div className="lbb-truco-hand-cards flex items-end justify-center gap-2 sm:gap-3">
        {cards.length === 0 ? (
          <p className="py-4 text-sm text-emerald-100/60 sm:py-6">Sin cartas en la mano</p>
        ) : (
          cards.map((card, index) => (
            <PlayingCard
              key={card.id}
              card={card}
              size="lg"
              selectable={canPlay}
              eager
              onClick={() => canPlay && onPlay(card.id)}
              className={`lbb-truco-hand-card lbb-truco-hand-card-${index + 1}`}
            />
          ))
        )}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/80 sm:text-xs">Tu mano</p>
    </div>
  )
}
