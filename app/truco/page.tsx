'use client'

import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { RoomLobby } from '@/components/truco/room-lobby'
import { GameTable } from '@/components/truco/game-table'

export default function TrucoPage() {
  const [game, setGame] = useState<{ active: boolean; target: 15 | 30 }>({ active: false, target: 30 })

  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-emerald-50">
      <div className="lbb-ambient" />
      <SiteHeader kicker="Truco Lucky Bear" activePath="home" compact />

      <div className="relative z-10 pt-6">
        {game.active ? (
          <GameTable target={game.target} onExit={() => setGame((g) => ({ ...g, active: false }))} />
        ) : (
          <RoomLobby onPlayBot={(target) => setGame({ active: true, target })} />
        )}
      </div>
    </main>
  )
}
