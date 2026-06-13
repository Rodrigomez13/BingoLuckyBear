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
    <div className="flex w-full flex-col items-center justify-center gap-1.5 py-1 sm:gap-3 sm:py-2">
      <Row label={rivalLabel} cards={rivalCards} highlight={currentTrick} />
      <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-300/40 to-transparent sm:w-40" />
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
    <div className="flex items-center gap-1.5 sm:gap-3">
      <span className="w-8 text-right text-[9px] font-bold uppercase tracking-widest text-emerald-100/50 sm:w-12 sm:text-[10px]">{label}</span>
      <div className="flex gap-1 sm:gap-2">
        {[0, 1, 2].map((trick) => {
          const slot = cards.find((c) => c.trick === trick)
          if (slot) {
            return <PlayingCard key={trick} card={slot.card} size="sm" eager />
          }
          return (
            <div
              key={trick}
              className={`h-20 w-14 rounded-lg border border-dashed sm:h-28 sm:w-20 sm:rounded-xl ${
                trick === highlight ? 'border-amber-300/50 bg-amber-300/5' : 'border-emerald-200/10'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}
