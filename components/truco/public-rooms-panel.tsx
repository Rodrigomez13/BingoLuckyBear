'use client'

import { RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCustomerAvatar } from '@/lib/customer/avatars'
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
  const visibleRooms = rooms.filter((room) => room.status === 'waiting' || room.status === 'playing')

  return (
    <section className="mt-8 w-full rounded-3xl border border-amber-300/15 bg-[#06140e]/70 p-4 text-left shadow-2xl shadow-black/30 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300/80">Antesala</p>
          <h2 className="mt-1 text-xl font-black text-white">Mesas públicas</h2>
        </div>
        <Button
          type="button"
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="border-white/15 bg-transparent text-emerald-100 hover:bg-white/5"
          aria-label="Actualizar mesas"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {visibleRooms.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center text-sm text-emerald-100/60">
          No hay mesas públicas esperando rival.
        </div>
      ) : (
        <div className="space-y-2">
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
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/25 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-gradient-to-br text-xl ${avatar.gradient}`}>
          {avatar.emoji}
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate font-bold text-white">{room.host.name}</p>
            <span className="shrink-0 font-mono text-[10px] font-black tracking-wider text-amber-300">{room.roomCode}</span>
          </div>
          <p className="text-xs font-semibold text-emerald-100/55">
            A {room.target} · {isWaiting ? 'Esperando rival' : 'En juego'} · {room.entryFeePoints > 0 ? `Pozo ${room.entryFeePoints * 2} LBB` : 'Sin apuesta'}
          </p>
        </div>
      </div>

      <Button
        type="button"
        disabled={!room.canJoin}
        onClick={() => onJoin(room)}
        className="h-9 bg-amber-300 px-4 text-xs font-black text-amber-950 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-35"
      >
        {room.canJoin ? 'Entrar' : 'Ocupada'}
      </Button>
    </div>
  )
}
