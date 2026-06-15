'use client'

import { useMemo, useState } from 'react'
import { CircleDot, RefreshCcw, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCustomerAvatar, getCustomerAvatarImageSrc } from '@/lib/customer/avatars'
import type { PublicRoomSummary } from '@/lib/truco/server-authority'

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
            <RoomRow key={room.roomCode} room={room} onJoin={onJoin} />
          ))}
        </div>
      )}
    </section>
  )
}

function RoomRow({ room, onJoin }: { room: PublicRoomSummary; onJoin: (room: PublicRoomSummary) => void }) {
  const isWaiting = room.status === 'waiting'
  const avatar = getCustomerAvatar(room.host.avatarKey)

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-black/25 p-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/15 bg-amber-300/10">
          <img src={getCustomerAvatarImageSrc(avatar.key)} alt={avatar.label} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-bold text-white">{room.host.name}</p>
            <span className="shrink-0 rounded border border-emerald-300/20 bg-emerald-300/10 px-1.5 py-0.5 text-[8px] font-black uppercase text-emerald-100/70">
              {room.ranked ? 'Ranking' : 'Casual'}
            </span>
          </div>
          <p className="truncate text-[10px] font-semibold text-emerald-100/55">
            A {room.target} · {isWaiting ? 'Esperando rival' : 'En juego'} · {room.entryFeePoints > 0 ? `Pozo ${room.entryFeePoints * 2} LBB` : 'Sin apuesta'}
          </p>
        </div>
      </div>

      <Button
        type="button"
        disabled={!room.canJoin}
        onClick={() => onJoin(room)}
        size="sm"
        className="h-8 shrink-0 bg-amber-300 px-3 text-[10px] font-black text-amber-950 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-35"
      >
        {room.canJoin ? 'Entrar' : 'En curso'}
      </Button>
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
