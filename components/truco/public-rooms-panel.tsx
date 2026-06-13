'use client'

import { RefreshCcw, Users, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PublicRoomSummary } from '@/lib/truco/server-authority'
import { formatPublicRoomScore } from '@/lib/truco/server-client'

export function PublicRoomsPanel({
  rooms,
  loading,
  onRefresh,
  onJoin,
}: {
  rooms: PublicRoomSummary[]
  loading?: boolean
  onRefresh: () => void
  onJoin: (roomCode: string) => void
}) {
  const waiting = rooms.filter((room) => room.status === 'waiting')
  const playing = rooms.filter((room) => room.status === 'playing')

  return (
    <section className="mt-8 w-full rounded-3xl border border-amber-300/15 bg-[#06140e]/70 p-4 text-left shadow-2xl shadow-black/30 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300/80">Antesala pública</p>
          <h2 className="mt-1 text-xl font-black text-white">Partidas disponibles</h2>
        </div>
        <Button
          type="button"
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="border-white/15 bg-transparent text-emerald-100 hover:bg-white/5"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {rooms.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center text-sm text-emerald-100/60">
          No hay mesas públicas activas. Creá una partida pública para aparecer acá.
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {waiting.map((room) => (
            <RoomCard key={room.roomCode} room={room} onJoin={onJoin} />
          ))}
          {playing.map((room) => (
            <RoomCard key={room.roomCode} room={room} onJoin={onJoin} />
          ))}
        </div>
      )}
    </section>
  )
}

function RoomCard({ room, onJoin }: { room: PublicRoomSummary; onJoin: (roomCode: string) => void }) {
  const isWaiting = room.status === 'waiting'

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-2xl font-black tracking-[0.2em] text-amber-300">{room.roomCode}</p>
          <p className="mt-1 text-xs font-semibold text-emerald-100/55">
            A {room.target} puntos · Marcador {formatPublicRoomScore(room.scores)}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
            isWaiting
              ? 'bg-emerald-400/15 text-emerald-200 border border-emerald-300/20'
              : 'bg-sky-400/15 text-sky-200 border border-sky-300/20'
          }`}
        >
          {isWaiting ? 'Esperando rival' : 'En juego'}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-emerald-100/45">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" /> {isWaiting ? '1/2 jugadores' : '2/2 jugadores'}
        </span>
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" /> {isWaiting ? 'Podés entrar' : `Baza ${room.currentTrick + 1}`}
        </span>
      </div>

      <Button
        type="button"
        disabled={!room.canJoin}
        onClick={() => onJoin(room.roomCode)}
        className="mt-4 w-full bg-amber-300 font-bold text-amber-950 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-35"
      >
        {room.canJoin ? 'Entrar como rival' : 'Partida en curso'}
      </Button>
    </div>
  )
}
