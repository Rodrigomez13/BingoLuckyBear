'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, ShieldCheck, Swords, Trophy, Users } from 'lucide-react'
import { GameTable } from '@/components/truco/game-table'
import { RoomLobby } from '@/components/truco/room-lobby'
import { LbbSoundEffects } from '@/components/audio/lbb-sound-effects'
import { TrucoNavigation } from '@/components/truco/truco-navigation'
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

        {!game.active && <section className="relative mt-4 overflow-hidden rounded-[1.8rem] border border-amber-300/20 bg-[#03170b]/82 px-5 py-7 shadow-2xl shadow-black/40 backdrop-blur-xl sm:px-8 sm:py-9 2xl:px-12 2xl:py-11">
          <div className="absolute right-0 top-0 h-56 w-80 bg-amber-300/10 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-amber-200"><Swords className="h-3.5 w-3.5" /> Experiencia exclusiva de Truco</p>
              <h1 className="mt-4 max-w-3xl font-mono text-4xl font-black uppercase leading-[.93] text-white sm:text-6xl 2xl:max-w-4xl 2xl:text-7xl">Entrá a jugar Truco, sin distracciones.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Mesas públicas, salas privadas y partidas contra el oso. Tu cuenta, tus créditos y tu historial se usan únicamente dentro de la experiencia de Truco.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['1v1 en vivo', '2v2 próximamente', 'Partidas privadas', 'Con Flor'].map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-slate-200">{item}</span>)}
              </div>
              <a href="#lobby-truco" className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-amber-300 px-5 text-sm font-black text-[#12200d] shadow-lg shadow-black/30 transition hover:bg-amber-200">Elegir mesa <ArrowRight className="h-4 w-4" /></a>
            </div>
            <div className="rounded-[1.35rem] border border-amber-300/20 bg-black/25 p-4">
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-200">Créditos para Truco</p>
              <div className="mt-4 space-y-3">
                <TrucoFlow icon={<ShieldCheck className="h-4 w-4" />} title="Transferencia aprobada" text="La carga mantiene el proceso de validación actual." />
                <TrucoFlow icon={<Users className="h-4 w-4" />} title="Mesa con pozo" text="El saldo se reserva y liquida desde el backend." />
                <TrucoFlow icon={<Trophy className="h-4 w-4" />} title="Historial y ranking" text="Cada partida queda vinculada a tu perfil." />
              </div>
              <Link href="/truco/perfil#creditos" className="mt-4 inline-flex text-xs font-black text-amber-200 hover:text-white">Cargar créditos aprobados →</Link>
            </div>
          </div>
        </section>}

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

        {!game.active && <p className="px-2 py-5 text-center text-xs text-slate-400">Truco LBB · Tus créditos se habilitan después de la aprobación de transferencia vigente.</p>}
      </div>
    </main>
  )
}

function TrucoFlow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[.035] p-3">
      <span className="mt-0.5 text-amber-300">{icon}</span>
      <div>
        <p className="text-xs font-black text-white">{title}</p>
        <p className="mt-1 text-[11px] leading-4 text-slate-400">{text}</p>
      </div>
    </div>
  )
}
