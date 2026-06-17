'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Gift, Menu, Plus, UserCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { LoginModal } from '@/components/auth/login-modal'
import { getCustomerAvatar, getCustomerAvatarImageSrc } from '@/lib/customer/avatars'
import { computeLevel, computeXp } from '@/lib/customer/gamification'
import { formatGs } from '@/lib/economy/format'

interface AuthPayload {
  authenticated?: boolean
  user: { id: string; email?: string | null } | null
  player: { alias?: string | null; avatar_key?: string | null; avatar_image_src?: string | null } | null
  wallet?: { total_balance?: number | null } | null
}

interface PlayerStats {
  matches_played?: number | null
  matches_won?: number | null
  bonus_points_won?: number | null
}

export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const [payload, setPayload] = useState<AuthPayload | null>(null)
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loginOpen, setLoginOpen] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const user = payload?.user ?? null
  const player = payload?.player ?? null
  const avatar = getCustomerAvatar(player?.avatar_key)
  const avatarSrc = player?.avatar_image_src || getCustomerAvatarImageSrc(avatar.key)
  const alias = player?.alias || user?.email?.split('@')[0] || 'Jugador'
  const balance = Number(payload?.wallet?.total_balance ?? 0)
  const level = useMemo(() => computeLevel(computeXp(stats ?? {})), [stats])

  const load = async () => {
    try {
      const [meRes, walletRes] = await Promise.all([
        fetch('/api/auth/me', { cache: 'no-store' }),
        fetch('/api/customer/wallet', { cache: 'no-store' }),
      ])
      const me = await meRes.json()
      const wallet = await walletRes.json().catch(() => null)
      if (wallet?.stats) setStats(wallet.stats)
      if (me?.authenticated) {
        setPayload(me)
      } else {
        setPayload({ user: null, player: null, access: null } as AuthPayload)
      }
    } catch {
      setPayload({ user: null, player: null } as AuthPayload)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) setPayload({ user: null, player: null } as AuthPayload)
      setLoading(false)
      router.refresh()
      window.setTimeout(() => void load(), 150)
    })
    return () => data.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <header className="sticky top-0 z-30 lbb-panel rounded-2xl">
        <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-300/20 bg-emerald-950/60 text-amber-100 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Greeting + avatar */}
          <Link href="/mi-cuenta" className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-amber-300/60 bg-emerald-950 shadow-[0_0_18px_rgba(244,197,66,0.25)]">
              {loading ? null : <img src={avatarSrc || '/placeholder.svg'} alt={alias} className="h-full w-full object-cover" />}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-base font-black text-amber-100">
                {user ? `¡Hola, ${alias}!` : 'Bienvenido'}
              </span>
              {user ? (
                <span className="flex items-center gap-2">
                  <span className="rounded-md bg-amber-300/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-200">
                    Nivel {level.level}
                  </span>
                  <span className="hidden h-2 w-24 overflow-hidden rounded-full bg-emerald-950 md:block">
                    <span className="block h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-300" style={{ width: `${level.progress}%` }} />
                  </span>
                  <span className="hidden text-[10px] font-bold text-emerald-200/70 md:inline">
                    {level.xpIntoLevel} / {level.xpForLevel} XP
                  </span>
                </span>
              ) : (
                <span className="block truncate text-xs font-semibold text-emerald-200/70">Lucky Bingo Bear</span>
              )}
            </span>
          </Link>

          <div className="flex-1" />

          {/* Balance */}
          <div className="flex items-center gap-2 rounded-2xl border border-amber-300/25 bg-emerald-950/60 px-3 py-2 sm:px-4">
            <span className="hidden text-right sm:block">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-emerald-200/70">Saldo disponible</span>
              <span className="block text-base font-black text-amber-100">{loading ? '—' : formatGs(balance)}</span>
            </span>
            <span className="block text-base font-black text-amber-100 sm:hidden">{loading ? '—' : formatGs(balance)}</span>
            <Link
              href="/participar"
              aria-label="Cargar saldo"
              className="flex h-9 w-9 items-center justify-center rounded-full lbb-gold-button"
            >
              <Plus className="h-5 w-5" />
            </Link>
          </div>

          {/* Bonos */}
          <Link
            href="/inicio"
            className="relative hidden h-[3.25rem] w-14 flex-col items-center justify-center rounded-xl border border-amber-300/20 bg-emerald-950/60 text-amber-100 sm:flex"
            aria-label="Bonos"
          >
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-emerald-950">3</span>
            <Gift className="h-5 w-5" />
            <span className="text-[9px] font-bold uppercase tracking-wide">Bonos</span>
          </Link>

          {/* Perfil / login */}
          {user ? (
            <Link
              href="/mi-cuenta"
              className="flex h-[3.25rem] w-14 flex-col items-center justify-center rounded-xl border border-amber-300/20 bg-emerald-950/60 text-amber-100"
              aria-label="Perfil"
            >
              <UserCircle2 className="h-5 w-5" />
              <span className="text-[9px] font-bold uppercase tracking-wide">Perfil</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="flex h-[3.25rem] items-center gap-2 rounded-xl px-4 text-sm font-black uppercase tracking-wide lbb-gold-button"
            >
              <UserCircle2 className="h-5 w-5" />
              <span className="hidden sm:inline">Ingresar</span>
            </button>
          )}
        </div>
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onAuthenticated={() => void load()} />
    </>
  )
}
