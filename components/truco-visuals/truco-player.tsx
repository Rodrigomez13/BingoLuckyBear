'use client'

import React from 'react'
import { GamePlay } from '@/components/truco-visuals/game/game-play'

export default function TrucoPlayer() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 text-white shadow-lg">
      <GamePlay />
    </div>
  )
}
