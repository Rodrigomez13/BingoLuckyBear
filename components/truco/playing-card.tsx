'use client'

import { useState } from 'react'
import Image from 'next/image'
import { type TrucoCard, cardImagePath } from '@/lib/truco/cards'

const SUIT_GLYPH: Record<string, string> = {
  espada: '\u2694', // crossed swords
  basto: '\u2663', // club
  oro: '\u25C9', // coin-like
  copa: '\u2666', // cup-like diamond
}

const SUIT_COLOR: Record<string, string> = {
  espada: 'text-sky-300',
  basto: 'text-emerald-300',
  oro: 'text-amber-300',
  copa: 'text-rose-300',
}

const SIZE = {
  sm: 'h-20 w-14 text-sm',
  md: 'h-28 w-20 text-base',
  lg: 'h-36 w-24 text-lg',
}

export function PlayingCard({
  card,
  size = 'md',
  faceDown = false,
  selectable = false,
  selected = false,
  onClick,
  className = '',
}: {
  card?: TrucoCard
  size?: keyof typeof SIZE
  faceDown?: boolean
  selectable?: boolean
  selected?: boolean
  onClick?: () => void
  className?: string
}) {
  const [imgError, setImgError] = useState(false)

  if (faceDown || !card) {
    return (
      <div
        className={`${SIZE[size]} relative shrink-0 overflow-hidden rounded-xl border border-amber-300/30 bg-[#0e2a1f] shadow-lg shadow-black/40 ${className}`}
      >
        <div className="absolute inset-1 rounded-lg border border-amber-300/25" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/40 bg-[#06140e] text-amber-300/80">
            <span className="text-xs font-black tracking-tight">LBB</span>
          </div>
        </div>
        <div className="absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(45deg,rgba(251,191,36,0.18)_0,rgba(251,191,36,0.18)_2px,transparent_2px,transparent_8px)]" />
      </div>
    )
  }

  const Wrapper = selectable ? 'button' : 'div'

  return (
    <Wrapper
      type={selectable ? 'button' : undefined}
      onClick={onClick}
      aria-label={`${card.rank} de ${card.suit}`}
      className={`${SIZE[size]} group relative shrink-0 overflow-hidden rounded-xl border bg-[#fdf6e3] shadow-lg shadow-black/40 transition-all ${
        selectable ? 'cursor-pointer hover:-translate-y-3 hover:shadow-amber-400/30' : ''
      } ${selected ? '-translate-y-3 border-amber-400 ring-2 ring-amber-400' : 'border-amber-200/60'} ${className}`}
    >
      {!imgError ? (
        <Image
          src={cardImagePath(card) || '/placeholder.svg'}
          alt={`${card.rank} de ${card.suit}`}
          fill
          sizes="120px"
          className="object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="flex h-full w-full flex-col justify-between p-1.5 text-[#1a2e22]">
          <span className={`text-left font-black leading-none ${SUIT_COLOR[card.suit]} [text-shadow:0_1px_0_rgba(0,0,0,0.15)]`}>
            {card.rank}
          </span>
          <span className={`text-center text-2xl leading-none ${SUIT_COLOR[card.suit]}`}>
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
