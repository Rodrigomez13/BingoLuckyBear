'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bot, Users, LogIn, Copy, Check, Clover, Link2, Loader2, Lock, Globe2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { generateRoomCode, normalizeRoomCode, type OnlineRole } from '@/lib/truco/online'
import type { PublicRoomSummary, RoomVisibility } from '@/lib/truco/server-authority'
import {
  createAuthoritativeRoom,
  joinAuthoritativeRoom,
  listPublicTrucoRooms,
  readRoomSecret,
  saveRoomSecret,
} from '@/lib/truco/server-client'
import { RulesModal } from './rules-modal'
import { PublicRoomsPanel } from './public-rooms-panel'
import { TrucoLoadingOverlay } from './truco-loading-overlay'

interface RoomLobbyProps {
  initialRoomCode?: string | null
  onPlayBot: (target: 15 | 30) => void
  onPlayOnline: (config: { target: 15 | 30; roomCode: string; role: OnlineRole; secret: string }) => void
}

export function RoomLobby({ initialRoomCode, onPlayBot, onPlayOnline }: RoomLobbyProps) {
  const [target, setTarget] = useState<15 | 30>(30)
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home')
  const [visibility, setVisibility] = useState<RoomVisibility>('public')
  const [roomCode, setRoomCode] = useState(() => generateRoomCode())
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [publicRooms, setPublicRooms] = useState<PublicRoomSummary[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadPublicRooms = useCallback(async () => {
    setRoomsLoading(true)
    try {
      const result = await listPublicTrucoRooms()
      if (result.ok && result.rooms) setPublicRooms(result.rooms)
    } finally {
      setRoomsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPublicRooms()
    const interval = window.setInterval(() => void loadPublicRooms(), 4500)
    return () => window.clearInterval(interval)
  }, [loadPublicRooms])

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

  const createRoom = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const result = await createAuthoritativeRoom(target, roomCode, visibility)
      if (!result.ok || !result.room || !result.secret || !result.room.role) {
        setError(result.error ?? 'No se pudo crear la mesa')
        return
      }
      saveRoomSecret(result.room.roomCode, result.secret)
      setRoomCode(result.room.roomCode)
      await loadPublicRooms()
      onPlayOnline({ target: result.room.target, roomCode: result.room.roomCode, role: result.room.role, secret: result.secret })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la mesa')
    } finally {
      setBusy(false)
    }
  }

  const joinRoomByCode = async (code: string) => {
    if (busy) return
    const normalized = normalizeRoomCode(code)
    if (normalized.length !== 5) return

    setBusy(true)
    setError(null)
    try {
      const storedSecret = readRoomSecret(normalized)
      const result = await joinAuthoritativeRoom(normalized, storedSecret)
      if (!result.ok || !result.room || !result.secret || !result.room.role) {
        setError(result.error ?? 'No se pudo entrar a la mesa')
        await loadPublicRooms()
        return
      }
      saveRoomSecret(result.room.roomCode, result.secret)
      await loadPublicRooms()
      onPlayOnline({ target: result.room.target, roomCode: result.room.roomCode, role: result.room.role, secret: result.secret })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo entrar a la mesa')
    } finally {
      setBusy(false)
    }
  }

  const joinRoom = () => joinRoomByCode(joinCode)

  return (
    <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 py-8 text-center lbb-fade-up">
      <TrucoLoadingOverlay show={busy} message={mode === 'join' ? 'Entrando a la mesa…' : 'Preparando la mesa…'} />

      <div className="absolute right-4 top-4">
        <RulesModal compact />
      </div>

      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">
        <Clover className="h-3.5 w-3.5" /> Lucky Bingo Bear
      </div>
      <h1 className="font-mono text-4xl font-black tracking-tight text-white text-balance sm:text-5xl">
        Truco <span className="text-amber-300">Lucky Bear</span>
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-emerald-100/70">
        Entrá a una partida pública desde la antesala, creá una mesa privada por código o jugá contra el oso.
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

      {error && (
        <div className="mt-4 max-w-md rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100">
          {error}
        </div>
      )}

      {mode === 'home' && (
        <>
          <div className="mt-6 grid w-full gap-3 sm:grid-cols-3">
            <LobbyCard
              icon={<Bot className="h-5 w-5" />}
              title="Jugar contra bot"
              desc="Partida instantánea contra el oso."
              onClick={() => onPlayBot(target)}
              primary
            />
            <LobbyCard
              icon={<Users className="h-5 w-5" />}
              title="Crear mesa"
              desc="Pública o privada por código."
              onClick={() => {
                setError(null)
                setRoomCode(generateRoomCode())
                setVisibility('public')
                setMode('create')
              }}
            />
            <LobbyCard
              icon={<LogIn className="h-5 w-5" />}
              title="Unirse por código"
              desc="Entrá con un código o enlace."
              onClick={() => {
                setError(null)
                setMode('join')
              }}
            />
          </div>

          <PublicRoomsPanel
            rooms={publicRooms}
            loading={roomsLoading}
            onRefresh={() => void loadPublicRooms()}
            onJoin={(code) => void joinRoomByCode(code)}
          />
        </>
      )}

      {mode === 'create' && (
        <div className="mt-8 w-full max-w-lg rounded-2xl border border-amber-300/20 bg-[#06140e]/80 p-6">
          <h2 className="text-lg font-bold text-white">Crear mesa</h2>
          <p className="mt-1 text-sm text-emerald-100/60">
            Elegí si querés aparecer en la antesala pública o crear una mesa privada para compartir por código.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/25 p-1.5">
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`rounded-xl px-3 py-2 text-xs font-black transition ${visibility === 'public' ? 'bg-amber-300 text-amber-950' : 'text-emerald-100/60 hover:text-white'}`}
            >
              <Globe2 className="mx-auto mb-1 h-4 w-4" /> Pública
            </button>
            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={`rounded-xl px-3 py-2 text-xs font-black transition ${visibility === 'private' ? 'bg-amber-300 text-amber-950' : 'text-emerald-100/60 hover:text-white'}`}
            >
              <Lock className="mx-auto mb-1 h-4 w-4" /> Privada
            </button>
          </div>

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

          <p className="mt-3 text-xs text-emerald-100/55">
            {visibility === 'public'
              ? 'La mesa aparecerá en la antesala como esperando rival.'
              : 'La mesa no aparecerá en la antesala. Solo entra quien tenga el código o enlace.'}
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button disabled={busy} onClick={createRoom} className="flex-1 bg-amber-300 font-bold text-amber-950 hover:bg-amber-200 disabled:opacity-50">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Crear y abrir mesa
            </Button>
            <Button disabled={busy} onClick={() => setMode('home')} variant="outline" className="border-white/15 bg-transparent text-emerald-100">
              Volver
            </Button>
          </div>
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
              if (e.key === 'Enter') void joinRoom()
            }}
            placeholder="ABCDE"
            className="mt-4 border-amber-300/30 bg-black/40 text-center font-mono text-2xl font-black tracking-[0.3em] text-amber-300"
          />
          <div className="mt-5 flex gap-3">
            <Button
              disabled={busy || normalizeRoomCode(joinCode).length < 5}
              onClick={joinRoom}
              className="flex-1 bg-amber-300 font-bold text-amber-950 hover:bg-amber-200 disabled:opacity-40"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Entrar a la mesa
            </Button>
            <Button disabled={busy} onClick={() => setMode('home')} variant="outline" className="border-white/15 bg-transparent text-emerald-100">
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
      className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 sm:flex-col sm:items-center sm:gap-2 sm:p-4 sm:text-center ${
        primary
          ? 'border-amber-300/40 bg-amber-300/10 hover:bg-amber-300/15'
          : 'border-white/10 bg-[#06140e]/70 hover:border-amber-300/30'
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${
          primary ? 'bg-amber-300 text-amber-950' : 'bg-white/5 text-amber-300'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-white">{title}</span>
        <span className="block text-xs leading-snug text-emerald-100/60">{desc}</span>
      </span>
    </button>
  )
}
