'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BearLogo } from '@/components/bear-logo'
import { RoomLobby } from '@/components/truco/room-lobby'
import { GameTable } from '@/components/truco/game-table'
import { normalizeRoomCode, type OnlineRole } from '@/lib/truco/online'
import { DEFAULT_TRUCO_RULES, type TrucoRules } from '@/lib/truco/rules'
import { LbbSoundEffects } from '@/components/audio/lbb-sound-effects'
import { ShieldCheck, Swords, Trophy, WalletCards } from 'lucide-react'

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
    <main className="min-h-screen bg-[#04130c] text-white">
      <LbbSoundEffects />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(251,191,36,.18),transparent_24%),radial-gradient(circle_at_84%_14%,rgba(52,211,153,.14),transparent_26%),linear-gradient(115deg,#04110c_0%,#081f12_40%,#06110b_100%)]" />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-[2rem] border border-amber-300/10 bg-black/55 p-5 shadow-2xl shadow-black/40 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <BearLogo size={44} />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.26em] text-amber-300">Truco exclusivo</p>
                <h1 className="text-3xl font-black text-white sm:text-4xl">Solo Truco</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth/login?next=/truco"
                className="inline-flex items-center justify-center rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-zinc-950 transition hover:bg-amber-200"
              >
                Ingresar
              </Link>
              <Link
                href="/mi-cuenta/jugador"
                className="inline-flex items-center justify-center rounded-full border border-emerald-300/30 px-4 py-2 text-sm font-black text-emerald-200 transition hover:bg-emerald-300/10"
              >
                Cargar saldo
              </Link>
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            Una experiencia de Truco nativa con mesas públicas, partidas privadas y apuesta con saldo real. No hay slots, no hay bingo; aquí solo se juega Truco.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.95fr_0.95fr]">
          <div className="space-y-8">
            <div className="rounded-[2rem] border border-white/10 bg-black/35 p-5 shadow-2xl shadow-black/30 sm:p-6">
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
            <TrucoHeroSection />
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-amber-300/10 bg-black/35 p-5 shadow-2xl shadow-black/30 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-300/10 text-emerald-200">
                  <Swords className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.26em] text-amber-300">Truco nativo</p>
                  <h2 className="text-2xl font-black text-white">Mira solo Truco</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Esta página está diseñada para que el jugador vea únicamente Truco: mesa, reglas, saldo y ranking. Todo lo demás queda fuera del foco.
              </p>
            </div>

            <div className="rounded-[2rem] border border-amber-300/10 bg-black/35 p-5 shadow-2xl shadow-black/30 sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-amber-300">Saldo central</p>
              <div className="mt-4 space-y-4 text-sm text-slate-300">
                <FeatureBlock icon={<WalletCards className="h-5 w-5" />} title="Transferencias aprobadas" description="Tu saldo carga con las mismas aprobaciones y transferencias seguras." />
                <FeatureBlock icon={<ShieldCheck className="h-5 w-5" />} title="Un solo saldo" description="La misma billetera alimenta tus partidas con pozo y apuestas." />
                <FeatureBlock icon={<Trophy className="h-5 w-5" />} title="Ranking Truco" description="Tu historial y puntos se guardan dentro del ecosistema de Truco." />
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-300/10 bg-black/35 p-5 shadow-2xl shadow-black/30 sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-amber-300">Qué vas a encontrar</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="mt-1 block h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  Mesas públicas y privadas de Truco en vivo.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 block h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  Apuestas con saldo real aprobado desde tu cuenta.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 block h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  Ranking, historial y estadísticas de Truco.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 block h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  No hay otros juegos ni navegación compartida.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

function TrucoHeroSection() {
  return (
    <section className="rounded-[2rem] border border-amber-300/10 bg-[#08160f]/80 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
      <div className="grid gap-7 lg:grid-cols-[1.5fr_1fr] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
            Foco total en Truco
          </div>
          <div>
            <h2 className="text-4xl font-black text-white sm:text-5xl">La experiencia de Truco hecha para vos</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Entrá a un lobby exclusivo donde el único juego es Truco. Mesas, saldo y reglas diseñadas para una experiencia limpia y concentrada.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/auth/login?next=/truco"
              className="inline-flex items-center justify-center rounded-full bg-amber-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-200"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/mi-cuenta/jugador"
              className="inline-flex items-center justify-center rounded-full border border-emerald-300/30 bg-transparent px-5 py-3 text-sm font-black text-emerald-200 transition hover:bg-emerald-300/10"
            >
              Cargar saldo
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-black/20 p-6 shadow-inner shadow-black/20">
          <div className="flex items-center justify-between gap-3 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">Créditos</p>
              <p className="mt-2 text-2xl font-black text-white">Saldo oficial</p>
            </div>
            <WalletCards className="h-9 w-9 text-emerald-200" />
          </div>
          <div className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
            <FeatureLine label="Transferencias aprobadas" description="Tus cargas ingresan con el mismo proceso de validación." />
            <FeatureLine label="Pozo y apuestas" description="Usá el saldo de tu cuenta para mesas con entrada y premio." />
            <FeatureLine label="Solo Truco" description="Ningún otro juego compite con esta pantalla." />
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureBlock({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/10 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-200">{icon}</span>
        <div>
          <p className="text-sm font-black text-white">{title}</p>
          <p className="mt-1 text-sm text-slate-300">{description}</p>
        </div>
      </div>
    </div>
  )
}

function FeatureLine({ label, description }: { label: string; description: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">{label}</p>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </div>
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
