'use client'

import type { Player } from '@/lib/truco/engine'
import type { AuthoritativeRoomView } from '@/lib/truco/server-client'
import { getCustomerAvatarImageSrc } from '@/lib/customer/avatars'

interface PlayerMatchPreviewProps {
  roomView: AuthoritativeRoomView | null
  scores: Record<Player, number>
  target: number
  perspective: Player
  rivalLabel: string
  statusLabel: string
  isOnline: boolean
}

export function PlayerMatchPreview({
  roomView,
  scores,
  target,
  perspective,
  rivalLabel,
  statusLabel,
  isOnline,
}: PlayerMatchPreviewProps) {
  const rival = perspective === 'player' ? 'opponent' : 'player'
  const selfIdentity = isOnline ? roomView?.players[perspective] : null
  const rivalIdentity = isOnline ? roomView?.players[rival] : null
  const prizePool = roomView?.prizePoolPoints ?? 0
  const entryFee = roomView?.entryFeePoints ?? 0
  const ltv = scores[perspective] - scores[rival]

  return (
    <div className="mb-2 grid gap-2 rounded-2xl border border-amber-300/20 bg-[#06140e]/85 p-2 shadow-xl shadow-black/30 sm:mb-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:p-3">
      <PlayerPill
        label="Vos"
        name={selfIdentity?.name ?? 'Vos'}
        avatarKey={selfIdentity?.avatarKey}
        score={scores[perspective]}
        target={target}
        accent="emerald"
      />

      <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/25 px-2 py-2 text-center sm:min-w-[210px]">
        <Metric label="Pozo" value={prizePool ? `${prizePool} LBB` : 'Sin pozo'} />
        <Metric label="Entrada" value={entryFee ? `${entryFee} LBB` : 'Libre'} />
        <Metric label="Racha" value={`${ltv >= 0 ? '+' : ''}${ltv}`} />
        <div className="col-span-3 truncate pt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-100/45">
          {statusLabel}
        </div>
      </div>

      <PlayerPill
        label="Rival"
        name={rivalIdentity?.name ?? rivalLabel}
        avatarKey={rivalIdentity?.avatarKey}
        score={scores[rival]}
        target={target}
        accent="amber"
        alignRight
      />
    </div>
  )
}

function PlayerPill({
  label,
  name,
  avatarKey,
  score,
  target,
  accent,
  alignRight = false,
}: {
  label: string
  name: string
  avatarKey?: string
  score: number
  target: number
  accent: 'emerald' | 'amber'
  alignRight?: boolean
}) {
  const avatarSrc = avatarKey ? getCustomerAvatarImageSrc(avatarKey) : '/logo-solo.svg'
  const scoreClass = accent === 'emerald' ? 'text-emerald-300' : 'text-amber-300'
  const barClass = accent === 'emerald' ? 'bg-emerald-400' : 'bg-amber-400'

  return (
    <div className={`flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-black/25 p-2 ${alignRight ? 'sm:flex-row-reverse sm:text-right' : ''}`}>
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-amber-300/30 bg-amber-300/10">
        <img src={avatarSrc} alt={name} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-100/45">{label}</p>
        <p className="truncate text-sm font-black text-white">{name}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className={`font-mono text-lg font-black leading-none ${scoreClass}`}>{score}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className={`h-full rounded-full ${barClass}`} style={{ width: `${Math.min(100, (score / target) * 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-emerald-100/40">{label}</p>
      <p className="truncate text-xs font-black text-amber-100">{value}</p>
    </div>
  )
}
