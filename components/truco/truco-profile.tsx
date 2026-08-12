'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, History, Loader2, Trophy, UserRound, WalletCards } from 'lucide-react'
import { FundsPanel } from '@/components/customer/funds-panel'
import { getCustomerAvatarImageSrc } from '@/lib/customer/avatars'
import { formatAccountBalance } from '@/lib/economy/format'
import { cn } from '@/lib/utils'
import { TrucoNavigation } from './truco-navigation'

type PlayerPayload = {
  user: { email?: string | null }
  player: { alias?: string | null; avatar_key?: string | null } | null
}

type WalletPayload = {
  wallet: { total_balance?: number | null } | null
  transactions?: { id: string; transaction_type: string; amount: number; created_at: string }[]
  trucoHistory?: { id: string; room_code: string; winner_user_id: string | null; entry_fee_points: number; prize_points: number; finished_at: string }[]
}

function movementLabel(type: string) {
  if (type === 'truco_entry_fee') return 'Entrada de mesa de Truco'
  if (type === 'truco_prize') return 'Premio de partida de Truco'
  if (type === 'deposit') return 'Depósito acreditado'
  if (type === 'withdrawal') return 'Retiro solicitado'
  return type.replaceAll('_', ' ')
}

export function TrucoProfile() {
  const [playerData, setPlayerData] = useState<PlayerPayload | null>(null)
  const [walletData, setWalletData] = useState<WalletPayload | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [playerResponse, walletResponse] = await Promise.all([
      fetch('/api/customer/player', { cache: 'no-store' }),
      fetch('/api/customer/wallet', { cache: 'no-store' }),
    ])
    if (playerResponse.ok) setPlayerData(await playerResponse.json())
    if (walletResponse.ok) setWalletData(await walletResponse.json())
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const balance = Number(walletData?.wallet?.total_balance ?? 0)
  const alias = playerData?.player?.alias || playerData?.user?.email?.split('@')[0] || 'Jugador de Truco'
  const avatar = getCustomerAvatarImageSrc(playerData?.player?.avatar_key)

  return (
    <main className="min-h-screen bg-[#020b06] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_0%,rgba(31,141,82,.27),transparent_35%),radial-gradient(circle_at_85%_12%,rgba(245,184,42,.12),transparent_31%),linear-gradient(180deg,#03170b_0%,#020b06_60%,#010704_100%)]" />
      <div className="mx-auto w-full max-w-[1600px] px-4 pb-28 pt-4 sm:px-6 sm:pt-6 xl:max-w-[1760px] 2xl:max-w-[1920px] 2xl:px-8 lg:pb-10"><TrucoNavigation active="profile" />
        {loading ? <div className="flex min-h-[50vh] items-center justify-center gap-3 text-cyan-100"><Loader2 className="h-5 w-5 animate-spin" /> Cargando tu cuenta...</div> : !playerData ? (
          <section className="mx-auto mt-8 max-w-lg rounded-3xl border border-white/10 bg-slate-950/55 p-8 text-center shadow-2xl"><UserRound className="mx-auto h-12 w-12 text-cyan-300" /><h1 className="mt-4 text-2xl font-black">Ingresá para ver tu perfil</h1><p className="mt-2 text-sm text-slate-300">Tus créditos y partidas de Truco permanecen asociados a tu cuenta.</p><Link href="/auth/login?next=/truco/perfil" className="mt-6 inline-flex rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950">Iniciar sesión</Link></section>
        ) : <div className="mt-6 space-y-6">
          <section className="grid gap-5 lg:grid-cols-[1fr_2fr]">
            <article className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 shadow-2xl"><div className="flex items-center gap-4">{avatar ? <Image src={avatar} alt="Avatar del jugador" width={64} height={64} className="h-16 w-16 rounded-2xl border border-cyan-300/30 object-cover" /> : <div className="grid h-16 w-16 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-200"><UserRound className="h-8 w-8" /></div>}<div><p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-300">Perfil de jugador</p><h1 className="text-2xl font-black">{alias}</h1><p className="mt-1 text-sm text-slate-400">Cuenta lista para jugar Truco</p></div></div></article>
            <article className="rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/15 via-sky-500/10 to-transparent p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-cyan-200"><WalletCards className="h-4 w-4" /> Créditos disponibles</p><p className="mt-2 text-4xl font-black sm:text-5xl">{formatAccountBalance(balance)}</p><p className="mt-2 text-sm text-slate-300">Disponibles para entrar a una mesa de Truco.</p></div><Trophy className="h-8 w-8 text-amber-300" /></div><div className="mt-6 flex flex-wrap gap-3"><a href="#creditos" className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950"><ArrowDownToLine className="h-4 w-4" /> Depositar</a><a href="#creditos" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold"><ArrowUpFromLine className="h-4 w-4" /> Retirar</a><Link href="/truco/lobby" className="px-3 py-2.5 text-sm font-bold text-cyan-200">Ver mesas</Link></div></article>
          </section>
          <section id="creditos" className="scroll-mt-24 rounded-3xl border border-white/10 bg-slate-950/55 p-4 shadow-xl sm:p-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-300">Wallet Lucky Bingo Bear</p><h2 className="mt-1 text-xl font-black">Depósitos y retiros de créditos</h2><p className="mt-1 text-sm text-slate-400">Las transferencias siguen el circuito de aprobación existente.</p><div className="mt-5"><FundsPanel cashBalance={balance} onChanged={load} /></div></section>
          <section className="grid gap-6 lg:grid-cols-2">
            <HistoryList title="Movimientos recientes" icon={<History className="h-5 w-5 text-cyan-300" />}>{walletData?.transactions?.length ? walletData.transactions.slice(0, 6).map((movement) => <div key={movement.id} className="flex items-center justify-between gap-3 py-3 text-sm"><div><p className="font-bold capitalize">{movementLabel(movement.transaction_type)}</p><p className="mt-0.5 text-xs text-slate-500">{new Date(movement.created_at).toLocaleString('es-AR')}</p></div><p className={cn('shrink-0 font-black', movement.amount > 0 ? 'text-emerald-300' : 'text-rose-300')}>{movement.amount > 0 ? '+' : ''}{formatAccountBalance(movement.amount)}</p></div>) : <Empty text="Todavía no hay movimientos." />}</HistoryList>
            <HistoryList title="Historial de partidas" icon={<Trophy className="h-5 w-5 text-amber-300" />}>{walletData?.trucoHistory?.length ? walletData.trucoHistory.slice(0, 6).map((match) => <div key={match.id} className="flex items-center justify-between gap-3 py-3 text-sm"><div><p className="font-bold">Mesa {match.room_code}</p><p className="mt-0.5 text-xs text-slate-500">Entrada {formatAccountBalance(match.entry_fee_points)} · {new Date(match.finished_at).toLocaleDateString('es-AR')}</p></div><p className="shrink-0 font-black text-emerald-300">Pozo {formatAccountBalance(match.prize_points)}</p></div>) : <Empty text="Jugá tu primera mesa para ver el historial." />}</HistoryList>
          </section>
        </div>}
      </div>
    </main>
  )
}

function HistoryList({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <article className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-xl"><div className="flex items-center gap-2">{icon}<h2 className="font-black">{title}</h2></div><div className="mt-4 divide-y divide-white/10">{children}</div></article>
}

function Empty({ text }: { text: string }) { return <p className="py-6 text-sm text-slate-400">{text}</p> }
