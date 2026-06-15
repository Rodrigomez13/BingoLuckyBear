'use client'

import type { Player } from '@/lib/truco/engine'
import type { AuthoritativeRoomView } from '@/lib/truco/server-client'
import { getCustomerAvatarImageSrc } from '@/lib/customer/avatars'
import { formatAccountBalance } from '@/lib/economy/format'

interface PlayerMatchPreviewProps {
  roomView: AuthoritativeRoomView | null
  scores: Record<Player, number>
  target: number
  perspective: Player
  rivalLabel: string
  statusLabel: string
  isOnline: boolean
  availableBalance: number | null
  florEnabled: boolean
}

export function PlayerMatchPreview({
  roomView,
  scores,
  target,
  perspective,
  rivalLabel,
  statusLabel,
  isOnline,
  availableBalance,
  florEnabled,
}: PlayerMatchPreviewProps) {
  const rival = perspective === 'player' ? 'opponent' : 'player'
  const selfIdentity = isOnline ? roomView?.players[perspective] : null
  const rivalIdentity = isOnline ? roomView?.players[rival] : null
  const prizePool = roomView?.prizePoolPoints ?? 0
  const entryFee = roomView?.entryFeePoints ?? 0
  const netPrize = roomView?.prizeAwardedPoints
    ? roomView.prizeAwardedPoints
    : prizePool > 0
      ? prizePool - getHouseFee(prizePool)
      : 0
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

      <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/25 px-2 py-2 text-center sm:min-w-[250px]">
        <Metric label="Saldo disponible" value={availableBalance === null ? 'Invitado' : formatAccountBalance(availableBalance)} />
        <Metric label="Pozo" value={prizePool ? formatAccountBalance(prizePool) : 'Sin pozo'} />
        <Metric label="Premio neto" value={netPrize ? formatAccountBalance(netPrize) : 'Libre'} />
        <Metric label="Entrada" value={entryFee ? formatAccountBalance(entryFee) : 'Libre'} />
        <Metric label="Regla" value={florEnabled ? 'Con Flor' : 'Sin Flor'} />
        <div className="col-span-2 truncate pt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-100/45">
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

function getHouseFee(total: number) {
  if (total <= 0) return 0
  if (total <= 200) return Math.floor(total * 0.1)
  if (total <= 1000) return Math.floor(total * 0.08)
  if (total <= 5000) return Math.floor(total * 0.06)
  return Math.floor(total * 0.05)
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-emerald-100/40">{label}</p>
      <p className="truncate text-xs font-black text-amber-100">{value}</p>
    </div>
  )
}
