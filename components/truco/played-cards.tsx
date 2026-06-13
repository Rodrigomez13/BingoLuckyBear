'use client'

import { type PlayedCard, type Player } from '@/lib/truco/engine'
import { type TrucoCard } from '@/lib/truco/cards'
import { PlayingCard } from './playing-card'

export function PlayedCards({
  played,
  currentTrick,
  perspective = 'player',
  rivalLabel = 'Rival',
}: {
  played: PlayedCard[]
  currentTrick: number
  perspective?: Player
  rivalLabel?: string
}) {
  const rival = perspective === 'player' ? 'opponent' : 'player'
  const rivalCards = played.filter((p) => p.by === rival)
  const playerCards = played.filter((p) => p.by === perspective)

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 py-2">
      <Row label={rivalLabel} cards={rivalCards} highlight={currentTrick} />
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
  cards: { card: TrucoCard; trick: number }[]
  highlight: number
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="w-10 text-right text-[10px] font-bold uppercase tracking-widest text-emerald-100/50 sm:w-12">{label}</span>
      <div className="flex gap-1.5 sm:gap-2">
        {[0, 1, 2].map((trick) => {
          const slot = cards.find((c) => c.trick === trick)
          if (slot) {
            return <PlayingCard key={trick} card={slot.card} size="sm" />
          }
          return (
            <div
              key={trick}
              className={`h-24 w-16 rounded-xl border border-dashed sm:h-28 sm:w-20 ${
                trick === highlight ? 'border-amber-300/50 bg-amber-300/5' : 'border-emerald-200/10'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}
