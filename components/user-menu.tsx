'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, CreditCard, History, KeyRound, LogOut, ReceiptText, Settings, ShieldCheck, UserCircle2, WalletCards } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getCustomerAvatar, getCustomerAvatarImageSrc } from '@/lib/customer/avatars'

interface AuthPayload {
  authenticated?: boolean
  user: { id: string; email?: string | null } | null
  player: { alias?: string | null; avatar_key?: string | null; avatar_image_src?: string | null } | null
  access?: { role?: 'admin' | 'operator' | 'player'; isAdmin?: boolean; dashboardPath?: string } | null
}

export function UserMenu({ active = false }: { active?: boolean }) {
  const [payload, setPayload] = useState<AuthPayload | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const user = payload?.user ?? null
  const player = payload?.player ?? null
  const access = payload?.access ?? null
  const isAdmin = Boolean(access?.isAdmin)
  const avatar = getCustomerAvatar(player?.avatar_key)
  const alias = player?.alias || user?.email?.split('@')[0] || 'Jugador'

  const load = async () => {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' })
      const data = await response.json()
      if (data?.authenticated) {
        setPayload(data)
        return
      }

      const { data: sessionData } = await supabase.auth.getSession()
      const sessionUser = sessionData.session?.user
      setPayload(sessionUser ? { user: { id: sessionUser.id, email: sessionUser.email }, player: null, access: null } : { user: null, player: null, access: null })
    } catch {
      const { data: sessionData } = await supabase.auth.getSession()
      const sessionUser = sessionData.session?.user
      setPayload(sessionUser ? { user: { id: sessionUser.id, email: sessionUser.email }, player: null, access: null } : { user: null, player: null, access: null })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setPayload({ user: { id: session.user.id, email: session.user.email }, player: null, access: null })
      } else {
        setPayload({ user: null, player: null, access: null })
      }
      setLoading(false)
      router.refresh()
      window.setTimeout(() => void load(), 150)
    })
    return () => data.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setOpen(false)
    setPayload({ user: null, player: null, access: null })
    router.refresh()
  }

  if (loading) {
    return <div className="h-9 w-20 rounded-full bg-white/5" />
  }

  if (!user) {
    return (
      <Link
        href="/mi-cuenta"
        className={`inline-flex items-center gap-1 rounded-full px-2 py-2 font-semibold transition-colors ${
          active ? 'bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/25' : 'text-slate-300 hover:text-amber-200'
        }`}
      >
        <UserCircle2 className="h-4 w-4" />
        <span className="hidden sm:inline">Ingresar</span>
      </Link>
    )
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex max-w-[9rem] items-center gap-2 rounded-full border px-2 py-1.5 font-semibold transition sm:max-w-[13rem] ${
          active
            ? 'border-amber-300/30 bg-amber-300/10 text-amber-100'
            : 'border-white/10 bg-white/5 text-slate-200 hover:border-amber-300/30 hover:text-amber-100'
        }`}
      >
        <AvatarBubble avatarKey={avatar.key} label={avatar.label} size="sm" />
        <span className="hidden truncate text-sm sm:block">{isAdmin ? 'Admin' : alias}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(88vw,18rem)] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 text-zinc-100 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <AvatarBubble avatarKey={avatar.key} label={avatar.label} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-bold text-white">{alias}</p>
                <p className="truncate text-xs text-zinc-400">{user.email}</p>
                {isAdmin && <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">{access?.role === 'operator' ? 'Operador' : 'Administrador'}</p>}
              </div>
            </div>
          </div>
          <div className="p-2">
            {isAdmin ? (
              <>
                <MenuItem href="/admin" icon={<ShieldCheck className="h-4 w-4" />} label="Panel Admin" onClick={() => setOpen(false)} />
                <MenuItem href="/admin/depositos" icon={<ReceiptText className="h-4 w-4" />} label="Depósitos" onClick={() => setOpen(false)} />
                <MenuItem href="/admin/saldo" icon={<WalletCards className="h-4 w-4" />} label="Saldos y pagos" onClick={() => setOpen(false)} />
                <MenuItem href="/truco" icon={<History className="h-4 w-4" />} label="Mesas de Truco" onClick={() => setOpen(false)} />
                <MenuItem href="/mi-cuenta/seguridad" icon={<KeyRound className="h-4 w-4" />} label="Seguridad" onClick={() => setOpen(false)} />
              </>
            ) : (
              <>
                <MenuItem href="/mi-cuenta/jugador" icon={<WalletCards className="h-4 w-4" />} label="Saldo y movimientos" onClick={() => setOpen(false)} />
                <MenuItem href="/mi-cuenta" icon={<Settings className="h-4 w-4" />} label="Datos y método de cobro" onClick={() => setOpen(false)} />
                <MenuItem href="/mi-cuenta/seguridad" icon={<KeyRound className="h-4 w-4" />} label="Cambiar contraseña" onClick={() => setOpen(false)} />
                <MenuItem href="/truco/ranking" icon={<History className="h-4 w-4" />} label="Ranking e historial" onClick={() => setOpen(false)} />
                <MenuItem href="/participar" icon={<CreditCard className="h-4 w-4" />} label="Comprar cartones" onClick={() => setOpen(false)} />
              </>
            )}
            <button
              type="button"
              onClick={logout}
              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-200 hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AvatarBubble({ avatarKey, label, size }: { avatarKey: string; label: string; size: 'sm' | 'lg' }) {
  return (
    <span className={`${size === 'lg' ? 'h-12 w-12 rounded-2xl' : 'h-7 w-7 rounded-full'} flex shrink-0 items-center justify-center overflow-hidden border border-amber-300/25 bg-amber-300/10 shadow-inner`}>
      <img src={getCustomerAvatarImageSrc(avatarKey)} alt={label} className="h-full w-full object-cover" />
    </span>
  )
}

function MenuItem({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/5 hover:text-amber-100">
      {icon}
      {label}
    </Link>
  )
}
