'use client'

import { useMemo, useState } from 'react'
import { CircleDot, Loader2, RefreshCcw, Swords, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCustomerAvatar, getCustomerAvatarImageSrc } from '@/lib/customer/avatars'
import type { PublicRoomSummary } from '@/lib/truco/server-authority'
import { formatAccountBalance } from '@/lib/economy/format'
import { placeTrucoSideBet } from '@/lib/truco/server-client'

export function PublicRoomsPanel({
  rooms,
  loading,
  onRefresh,
  onJoin,
}: {
  rooms: PublicRoomSummary[]
  loading?: boolean
  onRefresh: () => void
  onJoin: (room: PublicRoomSummary) => void
}) {
  const [view, setView] = useState<'available' | 'playing'>('available')
  const availableRooms = useMemo(() => rooms.filter((room) => room.status === 'waiting' && room.canJoin), [rooms])
  const playingRooms = useMemo(() => rooms.filter((room) => room.status === 'playing'), [rooms])
  const visibleRooms = view === 'available' ? availableRooms : playingRooms

  return (
    <section className="mt-3 w-full rounded-lg border border-amber-300/15 bg-[#06140e]/70 p-3 text-left shadow-xl shadow-black/20 sm:p-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-300/10 text-emerald-200">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300/75">Antesala pública</p>
            <h2 className="text-lg font-black text-white">Mesas</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="grid flex-1 grid-cols-2 rounded-lg border border-white/10 bg-black/25 p-1 sm:flex-none">
            <FilterButton active={view === 'available'} onClick={() => setView('available')} label="Disponibles" count={availableRooms.length} />
            <FilterButton active={view === 'playing'} onClick={() => setView('playing')} label="En juego" count={playingRooms.length} />
          </div>
          <Button
            type="button"
            onClick={onRefresh}
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 border-white/15 bg-transparent text-emerald-100 hover:bg-white/5"
            aria-label="Actualizar mesas"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {visibleRooms.length === 0 ? (
        <div className="flex min-h-20 items-center justify-center rounded-md border border-dashed border-white/10 bg-black/15 p-4 text-center text-sm text-emerald-100/55">
          {view === 'available' ? 'No hay mesas esperando rival.' : 'No hay partidas públicas en curso.'}
        </div>
      ) : (
        <div className="grid gap-2 lg:grid-cols-2">
          {visibleRooms.map((room) => (
            <RoomRow key={room.roomCode} room={room} onJoin={onJoin} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </section>
  )
}

function RoomRow({
  room,
  onJoin,
  onRefresh,
}: {
  room: PublicRoomSummary
  onJoin: (room: PublicRoomSummary) => void
  onRefresh: () => void
}) {
  const isWaiting = room.status === 'waiting'
  const avatar = getCustomerAvatar(room.host.avatarKey)
  const guestAvatar = getCustomerAvatar(room.guest?.avatarKey)
  const [betOpen, setBetOpen] = useState(false)
  const [betSide, setBetSide] = useState<'player' | 'opponent'>('player')
  const [betAmount, setBetAmount] = useState(() => Math.max(1, Math.min(room.sideBetMaxPoints || 1, 50)))
  const [betBusy, setBetBusy] = useState(false)
  const [betError, setBetError] = useState<string | null>(null)
  const canBet = room.status === 'playing' && room.bettingOpen && room.sideBetMaxPoints > 0 && !room.mySideBet
  const predictedName = betSide === 'player' ? room.host.name : room.guest?.name ?? 'Rival'

  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex -space-x-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/15 bg-amber-300/10">
              <img src={getCustomerAvatarImageSrc(avatar.key)} alt={avatar.label} className="h-full w-full object-cover" />
            </div>
            {room.guest && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/15 bg-emerald-300/10">
                <img src={getCustomerAvatarImageSrc(guestAvatar.key)} alt={guestAvatar.label} className="h-full w-full object-cover" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-bold text-white">
                {room.guest ? `${room.host.name} vs ${room.guest.name}` : room.host.name}
              </p>
              <span className="shrink-0 rounded border border-emerald-300/20 bg-emerald-300/10 px-1.5 py-0.5 text-[8px] font-black uppercase text-emerald-100/70">
                {room.status === 'playing' ? 'En juego' : 'Disponible'}
              </span>
            </div>
            <p className="truncate text-[10px] font-semibold text-emerald-100/55">
              A {room.target} puntos · {room.rules.florEnabled ? 'Con Flor' : 'Sin Flor'} · {room.entryFeePoints > 0 ? `Pozo ${formatAccountBalance(room.entryFeePoints * 2)}` : 'Sin apuesta'}
            </p>
          </div>
        </div>

        {isWaiting ? (
          <Button
            type="button"
            disabled={!room.canJoin}
            onClick={() => onJoin(room)}
            size="sm"
            className="h-8 shrink-0 bg-amber-300 px-3 text-[10px] font-black text-amber-950 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-35"
          >
            Entrar
          </Button>
        ) : room.mySideBet ? (
          <span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-black text-emerald-100">
            Apuesta lista
          </span>
        ) : canBet ? (
          <Button
            type="button"
            onClick={() => setBetOpen((current) => !current)}
            size="sm"
            className="h-8 shrink-0 bg-amber-300 px-3 text-[10px] font-black text-amber-950 hover:bg-amber-200"
          >
            Apostar
          </Button>
        ) : (
          <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black text-zinc-500">
            Solo mirar
          </span>
        )}
      </div>

      {room.mySideBet && (
        <div className="mt-2 rounded-md border border-emerald-300/15 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-100">
          Apostaste {formatAccountBalance(room.mySideBet.amountPoints)} por {room.mySideBet.predictedWinnerRole === 'player' ? room.host.name : room.guest?.name ?? 'Rival'}.
          {' '}Posible cobro: {formatAccountBalance(room.mySideBet.potentialPayoutPoints)}.
        </div>
      )}

      {betOpen && canBet && (
        <div className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3">
          <p className="flex items-center gap-2 text-xs font-black text-amber-100">
            <Swords className="h-4 w-4" />
            Apostá contra la casa
          </p>
          <p className="mt-1 text-[11px] leading-4 text-amber-50/70">
            Ventana inicial: marcador 0-0 y primera mano. Máximo {formatAccountBalance(room.sideBetMaxPoints)}.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => setBetSide('player')} className={`rounded-md border px-3 py-2 text-xs font-black ${betSide === 'player' ? 'border-amber-300 bg-amber-300 text-amber-950' : 'border-white/10 bg-black/20 text-amber-100'}`}>
              Gana {room.host.name}
            </button>
            <button type="button" onClick={() => setBetSide('opponent')} className={`rounded-md border px-3 py-2 text-xs font-black ${betSide === 'opponent' ? 'border-amber-300 bg-amber-300 text-amber-950' : 'border-white/10 bg-black/20 text-amber-100'}`}>
              Gana {room.guest?.name ?? 'Rival'}
            </button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <Input
              type="number"
              min={1}
              max={room.sideBetMaxPoints}
              value={betAmount}
              onChange={(event) => setBetAmount(Math.max(1, Math.min(room.sideBetMaxPoints, Math.floor(Number(event.target.value || 0)))))}
              className="border-white/15 bg-black/30 text-white"
            />
            <Button
              type="button"
              disabled={betBusy}
              onClick={async () => {
                setBetBusy(true)
                setBetError(null)
                try {
                  const result = await placeTrucoSideBet({ roomCode: room.roomCode, predictedWinnerRole: betSide, amountPoints: betAmount })
                  if (!result.ok) throw new Error(result.error ?? 'No se pudo registrar la apuesta')
                  setBetOpen(false)
                  onRefresh()
                } catch (error) {
                  setBetError(error instanceof Error ? error.message : 'No se pudo registrar la apuesta')
                } finally {
                  setBetBusy(false)
                }
              }}
              className="bg-amber-300 font-black text-amber-950 hover:bg-amber-200"
            >
              {betBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Apostar por {predictedName}
            </Button>
          </div>
          {betError && <p className="mt-2 text-xs font-semibold text-rose-200">{betError}</p>}
        </div>
      )}
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-7 items-center justify-center gap-1.5 rounded-md px-3 text-[10px] font-black transition ${
        active ? 'bg-emerald-300 text-emerald-950' : 'text-emerald-100/60 hover:text-white'
      }`}
    >
      <CircleDot className="h-3 w-3" />
      {label}
      <span className={active ? 'text-emerald-950/65' : 'text-emerald-100/35'}>{count}</span>
    </button>
  )
}
