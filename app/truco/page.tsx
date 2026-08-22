'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Bot, CircleDollarSign, Crown, LogIn, Plus, ShieldCheck, Sparkles, Swords, Trophy, Users } from 'lucide-react'
import { GameShell } from '@/components/lobby/game-shell'
import { RoomLobby } from '@/components/truco/room-lobby'
import { GameTable } from '@/components/truco/game-table'
import { LuckyBearVisualSkin } from '@/components/truco/luckybear-visual-skin'
import { normalizeRoomCode, type OnlineRole } from '@/lib/truco/online'
import { DEFAULT_TRUCO_RULES, type TrucoRules } from '@/lib/truco/rules'
import { LbbSoundEffects } from '@/components/audio/lbb-sound-effects'

type GameConfig =
  | { active: false; target: 15 | 30; rules: TrucoRules; mode: 'bot' }
  | { active: true; target: 15 | 30; rules: TrucoRules; mode: 'bot' }
  | { active: true; target: 15 | 30; rules: TrucoRules; mode: 'online'; roomCode: string; role: OnlineRole; secret: string }

type TrucoScreen = 'welcome' | 'lobby'

export default function TrucoPage() {
  const [game, setGame] = useState<GameConfig>({ active: false, target: 30, rules: DEFAULT_TRUCO_RULES, mode: 'bot' })
  const [initialRoomCode, setInitialRoomCode] = useState<string | null>(null)
  const [screen, setScreen] = useState<TrucoScreen>('welcome')
  const [lobbyView, setLobbyView] = useState<'home' | 'create' | 'join'>('home')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const room = normalizeRoomCode(params.get('sala') ?? params.get('room') ?? '')
    if (room.length === 5) {
      setInitialRoomCode(room)
      setLobbyView('join')
      setScreen('lobby')
    }
  }, [])

  const openLobby = (view: 'create' | 'join') => {
    setLobbyView(view)
    setScreen('lobby')
  }

  return (
    <LuckyBearVisualSkin>
      <LbbSoundEffects />
      <GameShell
        active="truco"
        eyebrow={game.active ? 'Partida en curso' : screen === 'welcome' ? 'Truco online' : 'Lobby de Truco'}
        title={game.active ? 'Mesa en vivo' : screen === 'welcome' ? 'Elegí cómo querés jugar' : 'Mesas de Truco'}
        subtitle={game.active ? 'Jugá tu mano y seguí el tanteador.' : screen === 'welcome' ? 'Partidas rápidas, mesas privadas y desafíos online.' : 'Entrá a mesas públicas, creá partidas o ingresá con un código.'}
        aside={!game.active && screen === 'lobby' ? <TrucoLobbyAside /> : undefined}
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
              onExit={() => {
                setGame({ active: false, target: game.target, rules: game.rules, mode: 'bot' })
                setScreen('lobby')
              }}
            />
          ) : screen === 'welcome' ? (
            <TrucoWelcome
              onPlayBot={() => setGame({ active: true, target: 30, rules: DEFAULT_TRUCO_RULES, mode: 'bot' })}
              onCreate={() => openLobby('create')}
              onJoin={() => openLobby('join')}
            />
          ) : (
            <>
              <button
                type="button"
                onClick={() => setScreen('welcome')}
                className="ml-4 mt-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-emerald-100/60 transition hover:text-amber-200"
              >
                <ArrowLeft className="h-4 w-4" /> Cambiar modo de juego
              </button>
              <RoomLobby
                initialRoomCode={initialRoomCode}
                initialView={lobbyView}
                onPlayBot={(target, rules) => setGame({ active: true, target, rules, mode: 'bot' })}
                onPlayOnline={({ target, rules, roomCode, role, secret }) =>
                  setGame({ active: true, target, rules, mode: 'online', roomCode, role, secret })
                }
              />
            </>
          )}
        </div>
      </GameShell>
    </LuckyBearVisualSkin>
  )
}

function TrucoWelcome({ onPlayBot, onCreate, onJoin }: { onPlayBot: () => void; onCreate: () => void; onJoin: () => void }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-5 sm:py-8">
      <div className="relative overflow-hidden rounded-3xl border border-amber-300/25 bg-[#061b11]/90 px-5 py-8 shadow-[0_28px_90px_rgba(0,0,0,.48)] sm:px-9 sm:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_32%,rgba(242,201,76,.2),transparent_22%),radial-gradient(circle_at_25%_85%,rgba(40,173,97,.2),transparent_34%)]" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">
              <Crown className="h-3.5 w-3.5" /> Sala oficial Lucky Bear
            </div>
            <h2 className="mt-5 max-w-xl font-mono text-4xl font-black leading-[.95] text-white sm:text-6xl">
              El Truco se juega <span className="text-amber-300">con actitud.</span>
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-emerald-50/70">
              Elegí tu mesa, desafiá al oso o reuní a tus amigos. El tanteador, las reglas y las jugadas quedan listos para empezar.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 text-xs font-bold text-emerald-100/70">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-lime-300" /> Mesas sincronizadas</span>
              <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-300" /> A 15 o 30 puntos</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-5 rounded-full bg-amber-300/15 blur-3xl" />
            <Image src="/truco/golden-bear-mascot.webp" alt="Oso dorado de Lucky Bear listo para jugar al Truco" width={620} height={620} priority className="relative mx-auto h-auto max-h-[25rem] w-full object-contain drop-shadow-2xl" />
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-4 grid gap-3 px-2 sm:-mt-6 sm:grid-cols-3 sm:px-6">
        <WelcomeAction icon={<Bot className="h-6 w-6" />} title="Jugar contra el bot" description="Una partida inmediata para practicar." onClick={onPlayBot} primary />
        <WelcomeAction icon={<Plus className="h-6 w-6" />} title="Crear una mesa" description="Configurá una sala pública o privada." onClick={onCreate} />
        <WelcomeAction icon={<LogIn className="h-6 w-6" />} title="Ingresar a una mesa" description="Usá un código o enlace de invitación." onClick={onJoin} />
      </div>

      <div className="mt-7 flex items-center justify-center gap-2 text-center text-xs text-emerald-100/55">
        <Users className="h-4 w-4 text-amber-300" /> También podés ver las mesas públicas desde el lobby.
      </div>
    </section>
  )
}

function WelcomeAction({ icon, title, description, onClick, primary = false }: { icon: React.ReactNode; title: string; description: string; onClick: () => void; primary?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`group rounded-2xl border p-5 text-left shadow-xl transition hover:-translate-y-1 ${primary ? 'border-amber-300 bg-amber-300 text-amber-950' : 'border-amber-300/20 bg-[#081a11] text-white hover:border-amber-300/55'}`}>
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${primary ? 'bg-amber-950/10' : 'bg-amber-300/10 text-amber-300'}`}>{icon}</span>
      <p className="mt-5 text-base font-black">{title}</p>
      <p className={`mt-1 text-sm leading-5 ${primary ? 'text-amber-950/70' : 'text-emerald-100/60'}`}>{description}</p>
    </button>
  )
}

function TrucoLobbyAside() {
  return (
    <>
      <section className="rounded-lg border border-amber-300/15 bg-black/25 p-4">
        <Image
          src="/truco/preview-lobby-home.webp"
          alt="Cartas Lucky Bear"
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
