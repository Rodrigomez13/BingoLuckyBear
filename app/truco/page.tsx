'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { GameTable } from '@/components/truco/game-table'
import { RoomLobby } from '@/components/truco/room-lobby'
import { LbbSoundEffects } from '@/components/audio/lbb-sound-effects'
import { TrucoNavigation } from '@/components/truco/truco-navigation'
import { TrucoLandingSections } from '@/components/truco/truco-landing-sections'
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
    <main className="relative min-h-screen overflow-x-hidden bg-[#020b06] text-white">
      <LbbSoundEffects />
      <Image src="/truco/preview-lobby-home.webp" alt="" fill priority className="pointer-events-none object-cover opacity-[0.09]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_78%_8%,rgba(245,184,42,.12),transparent_27rem),radial-gradient(circle_at_14%_14%,rgba(31,141,82,.18),transparent_28rem),linear-gradient(130deg,rgba(1,12,6,.98),rgba(2,26,12,.94)_48%,rgba(1,10,5,.98))]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(167,243,208,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(167,243,208,.7)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-3 py-3 pb-24 sm:px-5 sm:py-5 xl:max-w-[1760px] 2xl:max-w-[1920px] 2xl:px-8 md:pb-5">
        <TrucoNavigation active={game.active ? 'lobby' : 'home'} />

        {!game.active && <TrucoLandingSections />}

        <section id="lobby-truco" className={`scroll-mt-4 ${game.active ? 'mt-4' : 'mt-5'} rounded-[1.8rem] border border-amber-300/20 bg-[#03170b]/82 shadow-2xl shadow-black/45 backdrop-blur-xl`}>
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
              onPlayOnline={({ target, rules, roomCode, role, secret }) => setGame({ active: true, target, rules, mode: 'online', roomCode, role, secret })}
            />
          )}
        </section>

        {!game.active && <p className="px-2 py-5 text-center text-xs text-emerald-50/45">Truco LBB · Los créditos se habilitan después de la aprobación de transferencia vigente.</p>}
      </div>
    </main>
  )
}
