'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, CircleDollarSign, ShieldCheck, Swords, Trophy, Users } from 'lucide-react'
import { BearLogo } from '@/components/bear-logo'
import { GameTable } from '@/components/truco/game-table'
import { RoomLobby } from '@/components/truco/room-lobby'
import { LbbSoundEffects } from '@/components/audio/lbb-sound-effects'
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
    <main className="relative min-h-screen overflow-x-hidden bg-[#050b16] text-white">
      <LbbSoundEffects />
      <Image src="/truco/preview-lobby-home.webp" alt="" fill priority className="pointer-events-none object-cover opacity-[0.13]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_78%_8%,rgba(37,99,235,.26),transparent_25rem),radial-gradient(circle_at_16%_18%,rgba(16,185,129,.14),transparent_24rem),linear-gradient(130deg,rgba(2,7,16,.98),rgba(5,16,31,.94)_48%,rgba(2,10,16,.98))]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(147,197,253,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(147,197,253,.7)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-3 py-3 sm:px-5 sm:py-5">
        <header className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-sky-300/15 bg-[#071426]/85 px-3 py-2 shadow-2xl shadow-black/45 backdrop-blur-xl sm:px-4">
          <Link href="/truco" className="flex min-w-0 items-center gap-3">
            <BearLogo size={42} />
            <div className="min-w-0">
              <p className="truncate font-mono text-base font-black uppercase leading-tight text-white sm:text-lg">Truco LBB</p>
              <p className="text-[9px] font-black uppercase tracking-[.2em] text-sky-300">Mesas online</p>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/auth/login?next=/truco" className="hidden h-10 items-center rounded-xl border border-white/10 bg-white/[.04] px-3 text-xs font-black uppercase text-slate-100 transition hover:bg-white/[.09] sm:inline-flex">Ingresar</Link>
            <Link href="/mi-cuenta/jugador" className="inline-flex h-10 items-center gap-2 rounded-xl bg-sky-500 px-3 text-xs font-black uppercase text-white shadow-lg shadow-sky-950/40 transition hover:bg-sky-400">
              <CircleDollarSign className="h-4 w-4" /> Créditos
            </Link>
          </div>
        </header>

        {!game.active && <section className="relative mt-4 overflow-hidden rounded-[1.8rem] border border-sky-300/15 bg-[#071426]/78 px-5 py-7 shadow-2xl shadow-black/40 backdrop-blur-xl sm:px-8 sm:py-9">
          <div className="absolute right-0 top-0 h-48 w-72 bg-sky-400/10 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-sky-200"><Swords className="h-3.5 w-3.5" /> Experiencia exclusiva de Truco</p>
              <h1 className="mt-4 max-w-3xl font-mono text-4xl font-black uppercase leading-[.93] text-white sm:text-6xl">Entrá a jugar Truco, sin distracciones.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Mesas públicas, salas privadas y partidas contra el oso. Tu cuenta, tus créditos y tu historial se usan únicamente dentro de la experiencia de Truco.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['Mesas en vivo', 'Partidas privadas', 'Ranking', 'Con Flor'].map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-slate-200">{item}</span>)}
              </div>
              <a href="#lobby-truco" className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-black text-white shadow-lg shadow-sky-950/40 transition hover:bg-sky-400">Elegir mesa <ArrowRight className="h-4 w-4" /></a>
            </div>
            <div className="rounded-[1.35rem] border border-sky-300/15 bg-black/25 p-4">
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-sky-200">Créditos para Truco</p>
              <div className="mt-4 space-y-3">
                <TrucoFlow icon={<ShieldCheck className="h-4 w-4" />} title="Transferencia aprobada" text="La carga mantiene el proceso de validación actual." />
                <TrucoFlow icon={<Users className="h-4 w-4" />} title="Mesa con pozo" text="El saldo se reserva y liquida desde el backend." />
                <TrucoFlow icon={<Trophy className="h-4 w-4" />} title="Historial y ranking" text="Cada partida queda vinculada a tu perfil." />
              </div>
              <Link href="/mi-cuenta/jugador" className="mt-4 inline-flex text-xs font-black text-sky-200 hover:text-white">Cargar créditos aprobados →</Link>
            </div>
          </div>
        </section>}

        <section id="lobby-truco" className={`scroll-mt-4 ${game.active ? 'mt-4' : 'mt-5'} rounded-[1.8rem] border border-sky-300/15 bg-[#06111f]/82 shadow-2xl shadow-black/45 backdrop-blur-xl`}>
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

        {!game.active && <p className="px-2 py-5 text-center text-xs text-slate-400">Truco LBB · Tus créditos se habilitan después de la aprobación de transferencia vigente.</p>}
      </div>
    </main>
  )
}

function TrucoFlow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[.035] p-3">
      <span className="mt-0.5 text-sky-300">{icon}</span>
      <div>
        <p className="text-xs font-black text-white">{title}</p>
        <p className="mt-1 text-[11px] leading-4 text-slate-400">{text}</p>
      </div>
    </div>
  )
}
