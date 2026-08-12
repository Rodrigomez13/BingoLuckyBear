'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { CircleDollarSign, Home, LayoutList, LogIn, UserRound, Volume2, VolumeX } from 'lucide-react'
import { BearLogo } from '@/components/bear-logo'
import { getCustomerAvatar, getCustomerAvatarImageSrc } from '@/lib/customer/avatars'
import { formatAccountBalance } from '@/lib/economy/format'

type TrucoNavigationProps = {
  active: 'home' | 'lobby' | 'profile'
}

const links = [
  { href: '/truco', label: 'Inicio', icon: Home, active: 'home' },
  { href: '/truco/lobby', label: 'Mesas', icon: LayoutList, active: 'lobby' },
  { href: '/truco/perfil', label: 'Perfil', icon: UserRound, active: 'profile' },
] as const

type AccountPayload = {
  authenticated?: boolean
  user?: { email?: string | null } | null
  player?: { alias?: string | null; avatar_key?: string | null; avatar_image_src?: string | null } | null
  wallet?: { total_balance?: number | null } | null
}

export function TrucoNavigation({ active }: TrucoNavigationProps) {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [account, setAccount] = useState<AccountPayload | null>(null)

  useEffect(() => {
    setSoundEnabled(window.localStorage.getItem('lbb-sound-enabled') !== 'false')
    void fetch('/api/auth/me', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => setAccount(payload))
      .catch(() => setAccount({ authenticated: false }))
  }, [])

  const toggleSound = () => {
    setSoundEnabled((current) => {
      const next = !current
      window.localStorage.setItem('lbb-sound-enabled', String(next))
      return next
    })
  }

  const authenticated = Boolean(account?.authenticated)
  const avatar = getCustomerAvatar(account?.player?.avatar_key)
  const avatarSrc = account?.player?.avatar_image_src || getCustomerAvatarImageSrc(avatar.key)
  const alias = account?.player?.alias || account?.user?.email?.split('@')[0] || 'Mi perfil'
  const balance = Number(account?.wallet?.total_balance ?? 0)

  return (
    <>
      <header className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-amber-300/20 bg-[#03130a]/90 px-3 py-2 shadow-2xl shadow-black/45 backdrop-blur-xl sm:px-4">
        <Link href="/truco" className="flex min-w-0 items-center gap-3">
          <BearLogo size={42} />
          <div className="min-w-0">
            <p className="truncate font-mono text-base font-black uppercase leading-tight text-white sm:text-lg">Truco LBB</p>
            <p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-300">Mesas online</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((item) => <NavLink key={item.href} {...item} selected={active === item.active} />)}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={toggleSound} data-sound-off="true" aria-label={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'} title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200/15 bg-white/[.04] text-amber-100 transition hover:bg-white/[.09]">
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          {authenticated ? (
            <Link href="/truco/perfil" className="inline-flex h-10 max-w-[11rem] items-center gap-2 rounded-xl border border-amber-300/25 bg-amber-300/10 px-2 text-amber-50 transition hover:bg-amber-300/15 sm:max-w-[15rem]">
              <Image src={avatarSrc} alt="" width={28} height={28} unoptimized className="h-7 w-7 shrink-0 rounded-lg object-cover" />
              <span className="hidden min-w-0 text-left sm:block"><span className="block truncate text-xs font-black">{alias}</span><span className="block text-[10px] font-bold text-amber-300">{formatAccountBalance(balance)}</span></span>
              <UserRound className="h-4 w-4 sm:hidden" />
            </Link>
          ) : (
            <><Link href="/auth/login?next=/truco" className="hidden h-10 items-center gap-2 rounded-xl border border-amber-200/15 bg-white/[.04] px-3 text-xs font-black uppercase text-slate-100 transition hover:bg-white/[.09] lg:inline-flex"><LogIn className="h-4 w-4" /> Ingresar</Link><Link href="/truco/perfil#creditos" className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-300 px-3 text-xs font-black uppercase text-[#12200d] shadow-lg shadow-black/30 transition hover:bg-amber-200"><CircleDollarSign className="h-4 w-4" /> Créditos</Link></>
          )}
        </div>
      </header>
      <nav aria-label="Navegación de Truco" className="fixed bottom-3 left-3 right-3 z-50 grid grid-cols-3 rounded-2xl border border-amber-300/20 bg-[#03130a]/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl md:hidden">
        {links.map((item) => <NavLink key={item.href} {...item} selected={active === item.active} mobile />)}
      </nav>
    </>
  )
}

function NavLink({ href, label, icon: Icon, selected, mobile = false }: (typeof links)[number] & { selected: boolean; mobile?: boolean }) {
  return (
    <Link href={href} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition ${selected ? 'bg-amber-300 text-[#12200d]' : 'text-slate-300 hover:bg-white/[.07] hover:text-amber-100'} ${mobile ? 'flex-col gap-0.5 py-1.5 text-[9px] uppercase tracking-[.12em]' : ''}`}>
      <Icon className={mobile ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      {label}
    </Link>
  )
}
