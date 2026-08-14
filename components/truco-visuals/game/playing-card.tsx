"use client"

import Image from "next/image"
import type { Card } from '@/lib/truco/cards'

export function PlayingCard({ card, size = 'md', faceDown = false, onClick, disabled }: { card?: Card; size?: 'sm' | 'md' | 'lg'; faceDown?: boolean; onClick?: () => void; disabled?: boolean }) {
  const dims = size === 'sm' ? { w: 40, h: 60 } : size === 'md' ? { w: 64, h: 96 } : { w: 128, h: 192 }

  if (faceDown) {
    return (
      <div className="h-24 w-16 rounded-lg bg-muted-foreground/10" />
    )
  }

  if (!card) return <div className="h-24 w-16 rounded-lg bg-muted-foreground/10" />

  return (
    <button onClick={onClick} disabled={disabled} className="rounded-lg shadow">
      <Image src={`/truco/cards/individual-webp/${card.rank}-${card.suit}.webp`} alt={`${card.rank} de ${card.suit}`} width={dims.w} height={dims.h} />
    </button>
  )
}
