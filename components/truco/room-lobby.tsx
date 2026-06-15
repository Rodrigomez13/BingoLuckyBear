'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  Coins,
  Copy,
  Globe2,
  Link2,
  Loader2,
  Lock,
  LogIn,
  Play,
  UserCircle2,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CUSTOMER_AVATARS, getCustomerAvatar, type CustomerAvatarKey } from '@/lib/customer/avatars'
import { cleanTrucoPlayerName, type TrucoIdentity } from '@/lib/truco/identity'
import { generateRoomCode, normalizeRoomCode, type OnlineRole } from '@/lib/truco/online'
import type { PublicRoomSummary, RoomVisibility } from '@/lib/truco/server-authority'
import {
  createAuthoritativeRoom,
  joinAuthoritativeRoom,
  listPublicTrucoRooms,
  readRoomSecret,
  saveRoomSecret,
} from '@/lib/truco/server-client'
import { PublicRoomsPanel } from './public-rooms-panel'
import { RulesModal } from './rules-modal'
import { TrucoLoadingOverlay } from './truco-loading-overlay'

const GUEST_IDENTITY_KEY = 'lbb-truco-guest-identity'
const POT_OPTIONS = [
  { total: 0, stake: 0, label: 'Sin apuesta' },
  { total: 20, stake: 10, label: 'Pozo 20' },
  { total: 100, stake: 50, label: 'Pozo 100' },
  { total: 200, stake: 100, label: 'Pozo 200' },
] as const

interface RoomLobbyProps {
  initialRoomCode?: string | null
  onPlayBot: (target: 15 | 30) => void
  onPlayOnline: (config: { target: 15 | 30; roomCode: string; role: OnlineRole; secret: string }) => void
}

interface AccountState {
  loading: boolean
  user: { id: string; email?: string | null } | null
  player: { alias?: string | null; avatar_key?: string | null } | null
  points: number
}

export function RoomLobby({ initialRoomCode, onPlayBot, onPlayOnline }: RoomLobbyProps) {
  const [target, setTarget] = useState<15 | 30>(30)
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home')
  const [visibility, setVisibility] = useState<RoomVisibility>('public')
  const [potPoints, setPotPoints] = useState(0)
  const [roomCode, setRoomCode] = useState(() => generateRoomCode())
  const [joinCode, setJoinCode] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestAvatarKey, setGuestAvatarKey] = useState<CustomerAvatarKey>('golden_bear')
  const [account, setAccount] = useState<AccountState>({ loading: true, user: null, player: null, points: 0 })
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

  const loadAccount = useCallback(async () => {
    try {
      const [playerResponse, walletResponse] = await Promise.all([
        fetch('/api/customer/player', { cache: 'no-store' }),
        fetch('/api/customer/wallet', { cache: 'no-store' }),
      ])
      const playerData = await playerResponse.json()
      const walletData = await walletResponse.json()
      setAccount({
        loading: false,
        user: playerData.user ?? walletData.user ?? null,
        player: playerData.player ?? null,
        points: Number(walletData.wallet?.bonus_points_balance ?? 0),
      })
    } catch {
      setAccount({ loading: false, user: null, player: null, points: 0 })
    }
  }, [])

  useEffect(() => {
    void loadPublicRooms()
    void loadAccount()
    const interval = window.setInterval(() => void loadPublicRooms(), 4500)
    return () => window.clearInterval(interval)
  }, [loadAccount, loadPublicRooms])

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(GUEST_IDENTITY_KEY) ?? 'null') as {
        name?: string
        avatarKey?: CustomerAvatarKey
      } | null
      if (stored?.name) setGuestName(cleanTrucoPlayerName(stored.name))
      const storedAvatarKey = stored?.avatarKey
      if (storedAvatarKey && CUSTOMER_AVATARS.some((avatar) => avatar.key === storedAvatarKey)) {
        setGuestAvatarKey(storedAvatarKey)
      }
    } catch {
      // An invalid local preference should not block the lobby.
    }
  }, [])

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

  const guestIdentity = useMemo<TrucoIdentity | null>(() => {
    const name = cleanTrucoPlayerName(guestName)
    return name.length >= 3 ? { name, avatarKey: guestAvatarKey } : null
  }, [guestAvatarKey, guestName])

  const selectedPot = POT_OPTIONS.find((option) => option.total === potPoints) ?? POT_OPTIONS[0]
  const selectedPublicRoom = publicRooms.find((room) => room.roomCode === normalizeRoomCode(joinCode))
  const currentAvatar = getCustomerAvatar(account.player?.avatar_key)
  const currentName = account.player?.alias || account.user?.email?.split('@')[0] || 'Jugador'

  const copyText = async (text: string) => {
    await navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const saveGuestIdentity = () => {
    if (!guestIdentity) return
    window.localStorage.setItem(GUEST_IDENTITY_KEY, JSON.stringify(guestIdentity))
  }

  const requireIdentity = () => {
    if (account.user || guestIdentity) return true
    setError('Para jugar como invitado, ingresá un nombre de al menos 3 caracteres y elegí un avatar.')
    return false
  }

  const createRoom = async () => {
    if (busy || !requireIdentity()) return
    if (!account.user && selectedPot.stake > 0) {
      setError('Las mesas con pozo requieren iniciar sesión.')
      return
    }
    if (selectedPot.stake > account.points) {
      setError(`Necesitás ${selectedPot.stake} LBB y tu saldo actual es ${account.points}.`)
      return
    }

    setBusy(true)
    setError(null)
    saveGuestIdentity()
    try {
      const result = await createAuthoritativeRoom({
        target,
        roomCode,
        visibility,
        potPoints,
        identity: account.user ? null : guestIdentity,
      })
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
    if (busy || !requireIdentity()) return
    const normalized = normalizeRoomCode(code)
    if (normalized.length !== 5) {
      setError('El código debe tener 5 caracteres.')
      return
    }

    const listedRoom = publicRooms.find((room) => room.roomCode === normalized)
    if (!account.user && listedRoom && listedRoom.entryFeePoints > 0) {
      setError('Esta mesa tiene pozo. Iniciá sesión para usar tu saldo LBB.')
      setJoinCode(normalized)
      setMode('join')
      return
    }
    if (listedRoom && listedRoom.entryFeePoints > account.points) {
      setError(`Necesitás ${listedRoom.entryFeePoints} LBB para entrar y tu saldo es ${account.points}.`)
      setJoinCode(normalized)
      setMode('join')
      return
    }

    setBusy(true)
    setError(null)
    saveGuestIdentity()
    try {
      const storedSecret = readRoomSecret(normalized)
      const result = await joinAuthoritativeRoom(normalized, storedSecret, account.user ? null : guestIdentity)
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

  const joinRoom = () => void joinRoomByCode(joinCode)

  const openPublicRoom = (room: PublicRoomSummary) => {
    setJoinCode(room.roomCode)
    if (!account.user && (room.entryFeePoints > 0 || !guestIdentity)) {
      setMode('join')
      setError(room.entryFeePoints > 0
        ? 'Esta mesa tiene pozo. Iniciá sesión para usar tu saldo LBB.'
        : 'Completá tu nombre y avatar para entrar como invitado.')
      return
    }
    void joinRoomByCode(room.roomCode)
  }

  const quickRoom = publicRooms.find((room) =>
    room.canJoin
    && (room.entryFeePoints === 0 || Boolean(account.user))
    && room.entryFeePoints <= account.points,
  )

  const quickPlay = () => {
    setError(null)
    if (quickRoom) {
      openPublicRoom(quickRoom)
      return
    }
    onPlayBot(target)
  }

  return (
    <div className="relative mx-auto flex max-w-6xl flex-col px-4 py-4 lbb-fade-up sm:py-5">
      <TrucoLoadingOverlay show={busy} message={mode === 'join' ? 'Entrando a la mesa…' : 'Preparando la mesa…'} />

      {error && (
        <div className="mb-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100">
          {error}
        </div>
      )}

      {mode === 'home' && (
        <>
          <div className="flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300/80">Sala de juego</p>
              <h1 className="font-mono text-2xl font-black text-white sm:text-3xl">
                Truco <span className="text-amber-300">Lucky Bear</span>
              </h1>
              <p className="mt-1 text-xs text-emerald-100/60">
                Entrá a una mesa disponible o creá una partida
                <span className="hidden sm:inline"> gratis o con pozo LBB</span>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <AccountBadge account={account} name={currentName} avatar={currentAvatar} />
              <RulesModal compact />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-b border-white/10 py-3 lg:flex-row lg:items-center">
            <div className="inline-flex h-10 shrink-0 items-center rounded-lg border border-white/10 bg-black/30 p-1">
              {([15, 30] as const).map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setTarget(score)}
                  aria-pressed={target === score}
                  className={`h-8 rounded-md px-4 text-xs font-black transition ${
                    target === score ? 'bg-amber-300 text-amber-950' : 'text-emerald-100/65 hover:text-white'
                  }`}
                >
                  {score} puntos
                </button>
              ))}
            </div>

            <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
              <QuickAction
                icon={<Play className="h-4 w-4 fill-current" />}
                title="Partida rápida"
                detail={quickRoom ? `Mesa de ${quickRoom.host.name}` : 'Contra el bot'}
                onClick={quickPlay}
                primary
              />
              <QuickAction
                icon={<Users className="h-4 w-4" />}
                title="Crear mesa"
                detail="Pública o privada"
                onClick={() => {
                  setError(null)
                  setRoomCode(generateRoomCode())
                  setVisibility('public')
                  setPotPoints(0)
                  setMode('create')
                }}
              />
              <QuickAction
                icon={<LogIn className="h-4 w-4" />}
                title="Ingresar código"
                detail="Código o enlace"
                onClick={() => {
                  setError(null)
                  setMode('join')
                }}
              />
            </div>
          </div>

          <PublicRoomsPanel
            rooms={publicRooms}
            loading={roomsLoading}
            onRefresh={() => void loadPublicRooms()}
            onJoin={openPublicRoom}
          />
        </>
      )}

      {mode === 'create' && (
        <div className="mx-auto mt-3 w-full max-w-xl rounded-lg border border-amber-300/20 bg-[#06140e]/80 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white">Crear mesa</h2>
          <p className="mt-1 text-sm text-emerald-100/60">
            El pozo total se forma con dos aportes iguales. Tu mitad se reserva al crear la mesa.
          </p>

          {!account.user && (
            <GuestIdentityEditor
              name={guestName}
              avatarKey={guestAvatarKey}
              onNameChange={setGuestName}
              onAvatarChange={setGuestAvatarKey}
            />
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/25 p-1.5">
            <ChoiceButton active={visibility === 'public'} onClick={() => setVisibility('public')} icon={<Globe2 className="mx-auto mb-1 h-4 w-4" />} label="Pública" />
            <ChoiceButton active={visibility === 'private'} onClick={() => setVisibility('private')} icon={<Lock className="mx-auto mb-1 h-4 w-4" />} label="Privada" />
          </div>

          <div className="mt-4">
            <p className="mb-2 text-left text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/80">Pozo de la mesa</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {POT_OPTIONS.map((option) => {
                const disabled = option.stake > 0 && !account.user
                return (
                  <button
                    key={option.total}
                    type="button"
                    disabled={disabled}
                    onClick={() => setPotPoints(option.total)}
                    aria-pressed={potPoints === option.total}
                    className={`rounded-xl border px-2 py-2 text-xs font-black transition ${
                      potPoints === option.total
                        ? 'border-amber-300 bg-amber-300 text-amber-950'
                        : 'border-white/10 bg-black/20 text-emerald-100/70 hover:border-amber-300/30'
                    } disabled:cursor-not-allowed disabled:opacity-35`}
                  >
                    {option.label}
                    <span className="mt-0.5 block text-[9px] opacity-70">
                      {option.stake > 0 ? `${option.stake} por jugador` : 'Sin descuento'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <span className="rounded-xl border border-amber-300/30 bg-black/40 px-6 py-3 font-mono text-3xl font-black tracking-[0.3em] text-amber-300">
              {roomCode}
            </span>
            <div className="flex gap-2">
              <IconCopyButton onClick={() => copyText(roomCode)} copied={copied} label="Copiar código" />
              <Button size="icon" variant="outline" className="h-12 w-12 border-emerald-300/30 bg-transparent text-emerald-200" onClick={() => copyText(roomLink)} aria-label="Copiar enlace">
                <Link2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {selectedPot.stake > 0 && account.user && (
            <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
              Se reservan {selectedPot.stake} LBB ahora. Si cancelás antes de que entre un rival, se reintegran automáticamente.
            </p>
          )}

          {!account.user && (
            <p className="mt-3 text-xs text-emerald-100/55">
              Como invitado podés crear mesas sin apuesta. <Link href="/mi-cuenta" className="font-bold text-amber-200 underline">Ingresá o creá una cuenta</Link> para usar saldo.
            </p>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              disabled={busy || account.loading || (!account.user && !guestIdentity) || selectedPot.stake > account.points}
              onClick={createRoom}
              className="flex-1 bg-amber-300 font-bold text-amber-950 hover:bg-amber-200 disabled:opacity-40"
            >
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
        <div className="mx-auto mt-3 w-full max-w-lg rounded-lg border border-amber-300/20 bg-[#06140e]/80 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white">Unirse a una mesa</h2>
          <p className="mt-1 text-sm text-emerald-100/60">Ingresá el código de 5 caracteres que te pasó el anfitrión.</p>

          {!account.user && (
            <GuestIdentityEditor
              name={guestName}
              avatarKey={guestAvatarKey}
              onNameChange={setGuestName}
              onAvatarChange={setGuestAvatarKey}
            />
          )}

          <Input
            value={joinCode}
            onChange={(event) => setJoinCode(normalizeRoomCode(event.target.value))}
            onKeyDown={(event) => {
              if (event.key === 'Enter') joinRoom()
            }}
            placeholder="ABCDE"
            maxLength={5}
            aria-label="Código de mesa"
            className="mt-4 border-amber-300/30 bg-black/40 text-center font-mono text-2xl font-black tracking-[0.3em] text-amber-300"
          />

          {selectedPublicRoom && (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-emerald-100/70">
              Anfitrión: <span className="font-bold text-white">{selectedPublicRoom.host.name}</span>
              {' · '}
              {selectedPublicRoom.entryFeePoints > 0
                ? `Aporte para entrar: ${selectedPublicRoom.entryFeePoints} LBB`
                : 'Mesa sin apuesta'}
            </div>
          )}

          {!account.user && selectedPublicRoom?.entryFeePoints ? (
            <Button asChild className="mt-4 w-full bg-amber-300 font-bold text-amber-950 hover:bg-amber-200">
              <Link href="/mi-cuenta">Ingresar para usar saldo</Link>
            </Button>
          ) : null}

          <div className="mt-5 flex gap-3">
            <Button
              disabled={
                busy ||
                account.loading ||
                normalizeRoomCode(joinCode).length < 5 ||
                (!account.user && !guestIdentity) ||
                (!account.user && Boolean(selectedPublicRoom?.entryFeePoints))
              }
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

function AccountBadge({
  account,
  name,
  avatar,
}: {
  account: AccountState
  name: string
  avatar: ReturnType<typeof getCustomerAvatar>
}) {
  if (account.loading) {
    return <div className="h-10 w-36 animate-pulse rounded-lg bg-white/5 sm:w-44" />
  }

  if (!account.user) {
    return (
      <div className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 text-left">
        <UserCircle2 className="h-5 w-5 text-emerald-200/60" />
        <div>
          <p className="text-xs font-bold text-white">Modo invitado</p>
          <p className="text-[9px] text-emerald-100/55">Solo mesas gratis</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-10 items-center gap-2 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 text-left">
      <span className={`flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br ${avatar.gradient} text-base`}>{avatar.emoji}</span>
      <div>
        <p className="text-xs font-bold text-white">{name}</p>
        <p className="flex items-center gap-1 text-[9px] font-bold text-amber-200"><Coins className="h-3 w-3" /> {account.points} LBB</p>
      </div>
    </div>
  )
}

function GuestIdentityEditor({
  name,
  avatarKey,
  onNameChange,
  onAvatarChange,
}: {
  name: string
  avatarKey: CustomerAvatarKey
  onNameChange: (value: string) => void
  onAvatarChange: (value: CustomerAvatarKey) => void
}) {
  return (
    <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-400/5 p-3 text-left">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/70">Identidad de invitado</p>
      <Input
        value={name}
        onChange={(event) => onNameChange(cleanTrucoPlayerName(event.target.value))}
        placeholder="Tu nombre o alias"
        minLength={3}
        maxLength={24}
        aria-label="Nombre o alias de invitado"
        className="mt-2 border-white/15 bg-black/30 text-white"
      />
      <div className="mt-3 grid grid-cols-6 gap-1.5">
        {CUSTOMER_AVATARS.map((avatar) => (
          <button
            key={avatar.key}
            type="button"
            onClick={() => onAvatarChange(avatar.key)}
            title={avatar.label}
            aria-label={avatar.label}
            className={`flex aspect-square items-center justify-center rounded-xl border bg-gradient-to-br text-xl transition ${
              avatar.gradient
            } ${avatarKey === avatar.key ? 'border-white ring-2 ring-amber-300' : 'border-white/10 opacity-65 hover:opacity-100'}`}
          >
            {avatar.emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

function ChoiceButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl px-3 py-2 text-xs font-black transition ${
        active ? 'bg-amber-300 text-amber-950' : 'text-emerald-100/60 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function IconCopyButton({ onClick, copied, label }: { onClick: () => void; copied: boolean; label: string }) {
  return (
    <Button
      size="icon"
      variant="outline"
      className="h-12 w-12 border-emerald-300/30 bg-transparent text-emerald-200"
      onClick={onClick}
      aria-label={label}
    >
      {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
    </Button>
  )
}

function QuickAction({
  icon,
  title,
  detail,
  onClick,
  primary = false,
}: {
  icon: React.ReactNode
  title: string
  detail: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-12 items-center gap-3 rounded-lg border px-3 text-left transition ${
        primary
          ? 'border-amber-300 bg-amber-300 text-amber-950 hover:bg-amber-200'
          : 'border-white/10 bg-[#06140e]/70 hover:border-amber-300/30 hover:bg-white/5'
      }`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
        primary ? 'bg-amber-950/10 text-amber-950' : 'bg-white/5 text-amber-300'
      }`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className={`block text-xs font-black ${primary ? 'text-amber-950' : 'text-white'}`}>{title}</span>
        <span className={`block truncate text-[10px] ${primary ? 'text-amber-950/65' : 'text-emerald-100/55'}`}>{detail}</span>
      </span>
    </button>
  )
}
