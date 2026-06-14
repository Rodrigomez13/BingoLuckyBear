'use client'

import { type TrucoCard, CARD_SPRITE_COLUMNS, CARD_SPRITE_ROWS, CARD_SPRITE_SRC, cardSpritePosition } from '@/lib/truco/cards'

const SIZE = {
  sm: 'w-12 text-sm sm:w-16 lg:w-[4.5rem]',
  md: 'w-14 text-base sm:w-20 lg:w-[5.25rem]',
  lg: 'w-20 text-lg sm:w-24 lg:w-28',
}

export function PlayingCard({
  card,
  size = 'md',
  faceDown = false,
  selectable = false,
  selected = false,
  eager = false,
  onClick,
  className = '',
}: {
  card?: TrucoCard
  size?: keyof typeof SIZE
  faceDown?: boolean
  selectable?: boolean
  selected?: boolean
  eager?: boolean
  onClick?: () => void
  className?: string
}) {
  const Wrapper = selectable ? 'button' : 'div'
  const interactive = selectable ? 'cursor-pointer active:-translate-y-2 active:scale-[1.02] sm:hover:-translate-y-3 sm:hover:scale-[1.02] sm:hover:drop-shadow-[0_12px_24px_rgba(251,191,36,0.28)]' : ''
  const selectedClass = selected ? '-translate-y-3 scale-[1.02] drop-shadow-[0_0_20px_rgba(251,191,36,0.45)]' : ''
  const backgroundPosition = faceDown || !card ? '0% 100%' : cardSpritePosition(card)

  return (
    <Wrapper
      type={selectable ? 'button' : undefined}
      onClick={onClick}
      aria-label={faceDown || !card ? 'Carta boca abajo' : `${card.rank} de ${card.suit}`}
      className={`${SIZE[size]} aspect-[5/7] group relative shrink-0 overflow-visible rounded-md bg-transparent p-0 transition-all ${interactive} ${selectedClass} ${className}`}
      data-eager={eager ? 'true' : undefined}
    >
      <span
        className="block h-full w-full bg-no-repeat drop-shadow-xl"
        style={{
          backgroundImage: `url(${CARD_SPRITE_SRC})`,
          backgroundSize: `${CARD_SPRITE_COLUMNS * 100}% ${CARD_SPRITE_ROWS * 100}%`,
          backgroundPosition,
        }}
      />
    </Wrapper>
  )
}
