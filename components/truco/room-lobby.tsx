'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { Bot, Users, LogIn, Copy, Check, Clover, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { generateRoomCode, normalizeRoomCode, type OnlineRole } from '@/lib/truco/online'

interface RoomLobbyProps {
  initialRoomCode?: string | null
  onPlayBot: (target: 15 | 30) => void
  onPlayOnline: (config: { target: 15 | 30; roomCode: string; role: OnlineRole }) => void
}

export function RoomLobby({ initialRoomCode, onPlayBot, onPlayOnline }: RoomLobbyProps) {
  const [target, setTarget] = useState<15 | 30>(30)
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home')
  const [roomCode, setRoomCode] = useState(() => generateRoomCode())
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const normalized = normalizeRoomCode(initialRoomCode ?? '')
    if (normalized.length === 5) {
      setJoinCode(normalized)
      setMode('join')
    }
  }, [initialRoomCode])

  const roomLink = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/truco?sala=${roomCode}`
  }, [roomCode])

  const copyText = async (text: string) => {
    await navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const createRoom = () => {
    onPlayOnline({ target, roomCode, role: 'player' })
  }

  const joinRoom = () => {
    const normalized = normalizeRoomCode(joinCode)
    if (normalized.length !== 5) return
    onPlayOnline({ target, roomCode: normalized, role: 'opponent' })
  }

  return (
    <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 py-10 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 -z-10 rounded-full bg-amber-400/20 blur-3xl" />
        <Image
          src="/truco/golden-bear-mascot.png"
          alt="Oso dorado mascota de Truco Lucky Bear"
          width={200}
          height={200}
          className="lbb-float drop-shadow-2xl"
          priority
        />
      </div>

      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">
        <Clover className="h-3.5 w-3.5" /> Lucky Bingo Bear
      </div>
      <h1 className="font-mono text-5xl font-black tracking-tight text-white text-balance sm:text-6xl">
        Truco <span className="text-amber-300">Lucky Bear</span>
      </h1>
      <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-emerald-100/70">
        Jugá contra el oso o creá una mesa online por código. El anfitrión mantiene la partida abierta y el rival entra con el enlace.
      </p>

      <div className="mt-7 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
        {([15, 30] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTarget(t)}
            className={`rounded-full px-5 py-1.5 text-sm font-bold transition ${
              target === t ? 'bg-amber-300 text-amber-950' : 'text-emerald-100/70 hover:text-white'
            }`}
          >
            A {t} puntos
          </button>
        ))}
      </div>

      {mode === 'home' && (
        <div className="mt-8 grid w-full gap-4 sm:grid-cols-3">
          <LobbyCard
            icon={<Bot className="h-7 w-7" />}
            title="Jugar contra bot"
            desc="Partida instantánea contra el oso dorado."
            onClick={() => onPlayBot(target)}
            primary
          />
          <LobbyCard
            icon={<Users className="h-7 w-7" />}
            title="Crear mesa online"
            desc="Generá un código y compartí el enlace."
            onClick={() => {
              setRoomCode(generateRoomCode())
              setMode('create')
            }}
          />
          <LobbyCard
            icon={<LogIn className="h-7 w-7" />}
            title="Unirse a mesa"
            desc="Ingresá el código de 5 caracteres."
            onClick={() => setMode('join')}
          />
        </div>
      )}

      {mode === 'create' && (
        <div className="mt-8 w-full max-w-lg rounded-2xl border border-amber-300/20 bg-[#06140e]/80 p-6">
          <h2 className="text-lg font-bold text-white">Mesa online creada</h2>
          <p className="mt-1 text-sm text-emerald-100/60">
            Compartí este código o enlace. Cuando tu rival entre, la partida se sincroniza en tiempo real.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <span className="rounded-xl border border-amber-300/30 bg-black/40 px-6 py-3 font-mono text-3xl font-black tracking-[0.3em] text-amber-300">
              {roomCode}
            </span>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-12 w-12 border-emerald-300/30 bg-transparent text-emerald-200"
                onClick={() => copyText(roomCode)}
                aria-label="Copiar código"
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-12 w-12 border-emerald-300/30 bg-transparent text-emerald-200"
                onClick={() => copyText(roomLink)}
                aria-label="Copiar enlace"
              >
                <Link2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button onClick={createRoom} className="flex-1 bg-amber-300 font-bold text-amber-950 hover:bg-amber-200">
              Abrir mesa y esperar rival
            </Button>
            <Button onClick={() => setMode('home')} variant="outline" className="border-white/15 bg-transparent text-emerald-100">
              Volver
            </Button>
          </div>
          <p className="mt-3 text-[11px] text-emerald-100/45">
            Nota: la mesa online funciona mientras el anfitrión mantiene abierta la partida.
          </p>
        </div>
      )}

      {mode === 'join' && (
        <div className="mt-8 w-full max-w-md rounded-2xl border border-amber-300/20 bg-[#06140e]/80 p-6">
          <h2 className="text-lg font-bold text-white">Unirse a una mesa</h2>
          <p className="mt-1 text-sm text-emerald-100/60">Ingresá el código de 5 caracteres que te pasó el anfitrión.</p>
          <Input
            value={joinCode}
            onChange={(e) => setJoinCode(normalizeRoomCode(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') joinRoom()
            }}
            placeholder="ABCDE"
            className="mt-4 border-amber-300/30 bg-black/40 text-center font-mono text-2xl font-black tracking-[0.3em] text-amber-300"
          />
          <div className="mt-5 flex gap-3">
            <Button
              disabled={normalizeRoomCode(joinCode).length < 5}
              onClick={joinRoom}
              className="flex-1 bg-amber-300 font-bold text-amber-950 hover:bg-amber-200 disabled:opacity-40"
            >
              Entrar a la mesa
            </Button>
            <Button onClick={() => setMode('home')} variant="outline" className="border-white/15 bg-transparent text-emerald-100">
              Volver
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function LobbyCard({
  icon,
  title,
  desc,
  onClick,
  primary = false,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center gap-2 rounded-2xl border p-5 text-center transition-all hover:-translate-y-1 ${
        primary
          ? 'border-amber-300/40 bg-amber-300/10 hover:bg-amber-300/15'
          : 'border-white/10 bg-[#06140e]/70 hover:border-amber-300/30'
      }`}
    >
      <span className={`flex h-14 w-14 items-center justify-center rounded-xl ${primary ? 'bg-amber-300 text-amber-950' : 'bg-white/5 text-amber-300'}`}>
        {icon}
      </span>
      <span className="text-base font-bold text-white">{title}</span>
      <span className="text-xs leading-relaxed text-emerald-100/60">{desc}</span>
    </button>
  )
}
