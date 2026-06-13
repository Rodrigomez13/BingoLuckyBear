'use client'

import { type PlayedCard } from '@/lib/truco/engine'
import { PlayingCard } from './playing-card'

export function PlayedCards({ played, currentTrick }: { played: PlayedCard[]; currentTrick: number }) {
  const opponentCards = played.filter((p) => p.by === 'opponent')
  const playerCards = played.filter((p) => p.by === 'player')

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 py-2">
      <Row label="Oso" cards={opponentCards} highlight={currentTrick} />
      <div className="h-px w-40 bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
      <Row label="Vos" cards={playerCards} highlight={currentTrick} />
    </div>
  )
}

function Row({
  label,
  cards,
  highlight,
}: {
  label: string
  cards: { card: import('@/lib/truco/cards').TrucoCard; trick: number }[]
  highlight: number
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 text-right text-[10px] font-bold uppercase tracking-widest text-emerald-100/50">{label}</span>
      <div className="flex gap-2">
        {[0, 1, 2].map((trick) => {
          const slot = cards.find((c) => c.trick === trick)
          if (slot) {
            return <PlayingCard key={trick} card={slot.card} size="sm" />
          }
          return (
            <div
              key={trick}
              className={`h-20 w-14 rounded-xl border border-dashed ${
                trick === highlight ? 'border-amber-300/50 bg-amber-300/5' : 'border-emerald-200/10'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}
