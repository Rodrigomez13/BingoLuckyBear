'use client'

import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { RoomLobby } from '@/components/truco/room-lobby'
import { GameTable } from '@/components/truco/game-table'
import { normalizeRoomCode, type OnlineRole } from '@/lib/truco/online'
import { DEFAULT_TRUCO_RULES, type TrucoRules } from '@/lib/truco/rules'

type GameConfig =
  | { active: false; target: 15 | 30; rules: TrucoRules; mode: 'bot' }
  | { active: true; target: 15 | 30; rules: TrucoRules; mode: 'bot' }
  | { active: true; target: 15 | 30; rules: TrucoRules; mode: 'online'; roomCode: string; role: OnlineRole; secret: string }

export default function TrucoPage() {
  const [game, setGame] = useState<GameConfig>({ active: false, target: 30, rules: DEFAULT_TRUCO_RULES, mode: 'bot' })
  const [initialRoomCode, setInitialRoomCode] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const room = normalizeRoomCode(params.get('sala') ?? params.get('room') ?? '')
    if (room.length === 5) setInitialRoomCode(room)
  }, [])

  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-emerald-50">
      <div className="lbb-ambient" />
      <SiteHeader kicker="Truco Lucky Bear" activePath="truco" compact />

      <div className="relative z-10 pt-6">
        {game.active ? (
          <GameTable
            target={game.target}
            rules={game.rules}
            mode={game.mode}
            roomCode={game.mode === 'online' ? game.roomCode : undefined}
            onlineRole={game.mode === 'online' ? game.role : undefined}
            onlineSecret={game.mode === 'online' ? game.secret : undefined}
            onExit={() => setGame({ active: false, target: game.target, rules: game.rules, mode: 'bot' })}
          />
        ) : (
          <RoomLobby
            initialRoomCode={initialRoomCode}
            onPlayBot={(target, rules) => setGame({ active: true, target, rules, mode: 'bot' })}
            onPlayOnline={({ target, rules, roomCode, role, secret }) =>
              setGame({ active: true, target, rules, mode: 'online', roomCode, role, secret })
            }
          />
        )}
      </div>
    </main>
  )
}
