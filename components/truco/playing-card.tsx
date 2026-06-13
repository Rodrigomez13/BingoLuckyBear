'use client'

import { useState } from 'react'
import Image from 'next/image'
import { type TrucoCard, cardImagePath } from '@/lib/truco/cards'

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
  sm: 'h-20 w-14 text-sm sm:h-28 sm:w-20',
  md: 'h-24 w-16 text-base sm:h-36 sm:w-24',
  lg: 'h-36 w-24 text-lg sm:h-48 sm:w-32',
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
  const [imgError, setImgError] = useState(false)
  const Wrapper = selectable ? 'button' : 'div'
  const interactive = selectable ? 'cursor-pointer active:-translate-y-2 active:scale-[1.02] sm:hover:-translate-y-3 sm:hover:scale-[1.02] sm:hover:drop-shadow-[0_12px_24px_rgba(251,191,36,0.28)]' : ''
  const selectedClass = selected ? '-translate-y-3 scale-[1.02] drop-shadow-[0_0_20px_rgba(251,191,36,0.45)]' : ''

  if (faceDown || !card) {
    return (
      <div className={`${SIZE[size]} relative shrink-0 overflow-visible rounded-md ${className}`}>
        <Image
          src="/truco/cards/back.png"
          alt="Reverso de carta Lucky Bingo Bear"
          fill
          sizes="(max-width: 640px) 96px, 160px"
          className="object-contain drop-shadow-xl"
          priority={eager}
          loading={eager ? 'eager' : 'lazy'}
          unoptimized
          onError={() => setImgError(true)}
        />
        {imgError && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-amber-300/30 bg-[#0e2a1f] text-xs font-black text-amber-300">
            LBB
          </div>
        )}
      </div>
    )
  }

  return (
    <Wrapper
      type={selectable ? 'button' : undefined}
      onClick={onClick}
      aria-label={`${card.rank} de ${card.suit}`}
      className={`${SIZE[size]} group relative shrink-0 overflow-visible rounded-md bg-transparent p-0 transition-all ${interactive} ${selectedClass} ${className}`}
    >
      {!imgError ? (
        <Image
          src={cardImagePath(card) || '/placeholder.svg'}
          alt={`${card.rank} de ${card.suit}`}
          fill
          sizes="(max-width: 640px) 112px, 180px"
          className="object-contain drop-shadow-xl"
          priority={eager}
          loading={eager ? 'eager' : 'lazy'}
          unoptimized
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="flex h-full w-full flex-col justify-between rounded-lg border border-amber-200/60 bg-[#fdf6e3] p-2 text-[#1a2e22] shadow-lg shadow-black/40">
          <span className={`text-left font-black leading-none ${SUIT_COLOR[card.suit]} [text-shadow:0_1px_0_rgba(0,0,0,0.15)]`}>
            {card.rank}
          </span>
          <span className={`text-center text-3xl leading-none ${SUIT_COLOR[card.suit]}`}>
            {SUIT_GLYPH[card.suit]}
          </span>
          <span className={`rotate-180 text-left font-black leading-none ${SUIT_COLOR[card.suit]}`}>
            {card.rank}
          </span>
        </span>
      )}
    </Wrapper>
  )
}
