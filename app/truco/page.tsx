'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CircleDollarSign, ShieldCheck, Swords, Trophy } from 'lucide-react'
import { GameShell } from '@/components/lobby/game-shell'
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
    <GameShell
      active="truco"
      eyebrow="Lobby de Truco"
      title={game.active ? 'Mesa en vivo' : 'Mesas de Truco'}
      subtitle={game.active ? 'Jugá tu mano y seguí el tanteador.' : 'Entrá a mesas públicas, creá partidas o apostá desde afuera.'}
      aside={!game.active ? <TrucoLobbyAside /> : undefined}
    >
      <div className="relative">
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
    </GameShell>
  )
}

function TrucoLobbyAside() {
  return (
    <>
      <section className="rounded-lg border border-amber-300/15 bg-black/25 p-4">
        <Image
          src="/truco/preview-lobby-home.webp"
          alt="Cartas Lucky Bingo Bear"
          width={320}
          height={190}
          className="mx-auto h-36 w-full object-contain opacity-85"
        />
        <p className="mt-3 font-mono text-2xl font-black text-amber-200">Apostá desde afuera</p>
        <p className="mt-1 text-sm leading-5 text-emerald-50/65">
          Elegí una mesa en vivo durante la primera mano. Si acertás, duplicás la apuesta.
        </p>
        <div className="mt-4 rounded-md border border-amber-300/20 bg-amber-300/10 p-3">
          <p className="flex items-center gap-2 text-sm font-black text-amber-100">
            <CircleDollarSign className="h-4 w-4" />
            Límite de apuesta
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-50/70">
            Hasta el 50% de la mitad del pozo disponible para esa mesa.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-amber-300/15 bg-black/25 p-4">
        <p className="mb-3 font-mono text-xl font-black text-amber-200">Modos disponibles</p>
        <AsidePoint icon={<Swords className="h-4 w-4" />} title="Mesa pública" text="Entrá como rival o mirá partidas en vivo." />
        <AsidePoint icon={<Trophy className="h-4 w-4" />} title="Ranking" text="Las mesas rankeadas suman historial." />
        <AsidePoint icon={<ShieldCheck className="h-4 w-4" />} title="Juego validado" text="Cada acción se sincroniza desde el servidor." />
        <Link href="/truco/ranking" className="mt-4 flex h-10 items-center justify-center rounded-md border border-lime-300/35 text-sm font-black uppercase text-lime-200 hover:bg-lime-300/10">
          Ver ranking
        </Link>
      </section>
    </>
  )
}

function AsidePoint({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3 border-t border-white/10 py-3 first:border-t-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-300/10 text-lime-300">
        {icon}
      </span>
      <div>
        <p className="font-bold text-white">{title}</p>
        <p className="text-xs leading-5 text-emerald-50/60">{text}</p>
      </div>
    </div>
  )
}
