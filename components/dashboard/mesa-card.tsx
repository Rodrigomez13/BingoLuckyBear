'use client'

import Link from 'next/link'
import { Crown, Star, Clover, Gem, Users, Clock } from 'lucide-react'
import { getCustomerAvatar, getCustomerAvatarImageSrc } from '@/lib/customer/avatars'
import { formatGs } from '@/lib/economy/format'
import type { PublicRoomSummary } from '@/lib/truco/server-authority'

const THEMES = [
  { name: 'Mesa Dorada', accent: '#f4c542', Icon: Star, badge: 'POPULAR' },
  { name: 'Mesa Real', accent: '#e0533f', Icon: Crown, badge: null },
  { name: 'Mesa Suerte', accent: '#4ade80', Icon: Clover, badge: null },
  { name: 'Mesa Premium', accent: '#c084fc', Icon: Gem, badge: 'PREMIUM' },
] as const

// Approximate Guaraní prize from the points-based pot (1 point ≈ Gs. 1.000).
function prizeFromPoints(points: number) {
  return Math.max(points, 0) * 1000
}

export function MesaCard({ room, index }: { room: PublicRoomSummary; index: number }) {
  const theme = THEMES[index % THEMES.length]
  const Icon = theme.Icon
  const avatar = getCustomerAvatar(room.host.avatarKey)
  const avatarSrc = getCustomerAvatarImageSrc(avatar.key)
  const players = room.guest ? 2 : 1
  const isFull = !room.canJoin
  const prize = prizeFromPoints(room.prizePoolPoints || room.entryFeePoints * 2)
  const totalScore = room.scores.player + room.scores.opponent

  return (
    <article
      className="lbb-mesa-card flex flex-col gap-3 rounded-2xl p-4"
      style={{ ['--mesa-accent' as string]: theme.accent }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" style={{ color: theme.accent }} />
          <h3 className="text-base font-black uppercase tracking-wide text-amber-50">{theme.name}</h3>
        </div>
        {theme.badge && (
          <span
            className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-950"
            style={{ background: theme.accent }}
          >
            {theme.badge}
          </span>
        )}
      </div>

      {/* Host */}
      <div className="flex items-center gap-3 rounded-xl border border-amber-300/10 bg-emerald-950/40 p-2.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-300/40 bg-emerald-950">
          <img src={avatarSrc || '/placeholder.svg'} alt={room.host.name} className="h-full w-full object-cover" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200/60">Creada por</p>
          <p className="truncate text-sm font-bold text-amber-50">{room.host.name}</p>
          <p className="truncate font-mono text-[11px] text-emerald-200/70">Sala {room.roomCode}</p>
        </div>
      </div>

      {/* Players */}
      <div className="flex items-center justify-between rounded-lg border border-amber-300/10 bg-emerald-950/40 px-3 py-2 text-sm">
        <span className="flex items-center gap-1.5 font-semibold text-emerald-100/80">
          <Users className="h-4 w-4" /> Jugadores
        </span>
        <span className="font-black text-amber-100">{players} / 2</span>
      </div>

      {/* Prize */}
      <div className="rounded-xl border border-amber-300/15 bg-emerald-950/50 py-2 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200/60">Premio</p>
        <p className="text-2xl font-black lbb-gold-text">{prize > 0 ? formatGs(prize) : 'Sin pozo'}</p>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 divide-x divide-amber-300/10 rounded-lg border border-amber-300/10 bg-emerald-950/40 text-center">
        <div className="py-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200/60">Objetivo</p>
          <p className="text-sm font-black text-amber-50">{room.target} pts</p>
        </div>
        <div className="py-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200/60">Mano</p>
          <p className="text-sm font-black text-amber-50">{room.scores.player} - {room.scores.opponent}</p>
        </div>
      </div>

      {/* Timer-ish status */}
      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-300">
        <Clock className="h-3.5 w-3.5" />
        {room.status === 'playing' ? `En juego · ${totalScore} ptos cantados` : 'Esperando jugadores'}
      </div>

      {/* CTA */}
      {isFull ? (
        <span className="block rounded-xl border border-amber-300/20 bg-emerald-950/60 py-3 text-center text-sm font-black uppercase tracking-wide text-emerald-200/60">
          Mesa llena
          <span className="block text-[10px] font-semibold normal-case text-emerald-200/40">Esperá tu turno</span>
        </span>
      ) : (
        <Link
          href={`/truco?sala=${room.roomCode}`}
          className="block rounded-xl py-3 text-center text-sm font-black uppercase tracking-wide lbb-gold-button"
        >
          {room.status === 'playing' ? 'Apostar' : 'Entrar'}
          <span className="block text-[10px] font-semibold normal-case opacity-80">
            {room.status === 'playing' ? 'desde afuera' : 'a la mesa'}
          </span>
        </Link>
      )}
    </article>
  )
}
