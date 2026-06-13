'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  type TrucoCard,
  CARD_SPRITE_COLUMNS,
  CARD_SPRITE_ROWS,
  CARD_SPRITE_SRC,
  cardBackImagePath,
  cardImagePath,
  cardSpritePosition,
} from '@/lib/truco/cards'

const SUIT_GLYPH: Record<string, string> = {
  espada: '\u2694',
  basto: '\u2663',
  oro: '\u25C9',
  copa: '\u2666',
}

const SUIT_COLOR: Record<string, string> = {
  espada: 'text-sky-300',
  basto: 'text-emerald-300',
  oro: 'text-amber-300',
  copa: 'text-rose-300',
}

const SIZE = {
  sm: 'w-14 text-sm sm:w-20',
  md: 'w-16 text-base sm:w-24',
  lg: 'w-24 text-lg sm:w-32',
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
  const [spriteStatus, setSpriteStatus] = useState<'checking' | 'ready' | 'fallback'>('checking')
  const [imgError, setImgError] = useState(false)
  const Wrapper = selectable ? 'button' : 'div'
  const interactive = selectable ? 'cursor-pointer active:-translate-y-2 active:scale-[1.02] sm:hover:-translate-y-3 sm:hover:scale-[1.02] sm:hover:drop-shadow-[0_12px_24px_rgba(251,191,36,0.28)]' : ''
  const selectedClass = selected ? '-translate-y-3 scale-[1.02] drop-shadow-[0_0_20px_rgba(251,191,36,0.45)]' : ''
  const backgroundPosition = faceDown || !card ? '0% 100%' : cardSpritePosition(card)
  const fallbackSrc = faceDown || !card ? cardBackImagePath() : cardImagePath(card)

  return (
    <Wrapper
      type={selectable ? 'button' : undefined}
      onClick={onClick}
      aria-label={faceDown || !card ? 'Carta boca abajo' : `${card.rank} de ${card.suit}`}
      className={`${SIZE[size]} aspect-[5/7] group relative shrink-0 overflow-visible rounded-md bg-transparent p-0 transition-all ${interactive} ${selectedClass} ${className}`}
      data-eager={eager ? 'true' : undefined}
    >
      {spriteStatus === 'checking' && (
        <img
          src={CARD_SPRITE_SRC}
          alt=""
          aria-hidden="true"
          className="hidden"
          onLoad={() => setSpriteStatus('ready')}
          onError={() => setSpriteStatus('fallback')}
        />
      )}

      {spriteStatus === 'ready' ? (
        <span
          className="block h-full w-full bg-no-repeat drop-shadow-xl"
          style={{
            backgroundImage: `url(${CARD_SPRITE_SRC})`,
            backgroundSize: `${CARD_SPRITE_COLUMNS * 100}% ${CARD_SPRITE_ROWS * 100}%`,
            backgroundPosition,
          }}
        />
      ) : !imgError ? (
        <Image
          src={fallbackSrc}
          alt={faceDown || !card ? 'Reverso de carta Lucky Bingo Bear' : `${card.rank} de ${card.suit}`}
          fill
          sizes="(max-width: 640px) 112px, 180px"
          className="object-contain drop-shadow-xl"
          priority={eager}
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="flex h-full w-full flex-col justify-between rounded-lg border border-amber-200/60 bg-[#fdf6e3] p-2 text-[#1a2e22] shadow-lg shadow-black/40">
          <span className={`text-left font-black leading-none ${card ? SUIT_COLOR[card.suit] : 'text-amber-300'} [text-shadow:0_1px_0_rgba(0,0,0,0.15)]`}>
            {card?.rank ?? 'LBB'}
          </span>
          <span className={`text-center text-3xl leading-none ${card ? SUIT_COLOR[card.suit] : 'text-amber-300'}`}>
            {card ? SUIT_GLYPH[card.suit] : 'LBB'}
          </span>
          <span className={`rotate-180 text-left font-black leading-none ${card ? SUIT_COLOR[card.suit] : 'text-amber-300'}`}>
            {card?.rank ?? 'LBB'}
          </span>
        </span>
      )}
    </Wrapper>
  )
}
