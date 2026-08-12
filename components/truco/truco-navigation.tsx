'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CircleDollarSign, Home, LayoutList, LogIn, UserRound, Volume2, VolumeX } from 'lucide-react'
import { BearLogo } from '@/components/bear-logo'

type TrucoNavigationProps = {
  active: 'home' | 'lobby' | 'profile'
}

const links = [
  { href: '/truco', label: 'Inicio', icon: Home, active: 'home' },
  { href: '/truco/lobby', label: 'Mesas', icon: LayoutList, active: 'lobby' },
  { href: '/truco/perfil', label: 'Perfil', icon: UserRound, active: 'profile' },
] as const

export function TrucoNavigation({ active }: TrucoNavigationProps) {
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    setSoundEnabled(window.localStorage.getItem('lbb-sound-enabled') !== 'false')
  }, [])

  const toggleSound = () => {
    setSoundEnabled((current) => {
      const next = !current
      window.localStorage.setItem('lbb-sound-enabled', String(next))
      return next
    })
  }

  return (
    <>
      <header className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-sky-300/15 bg-[#071426]/85 px-3 py-2 shadow-2xl shadow-black/45 backdrop-blur-xl sm:px-4">
        <Link href="/truco" className="flex min-w-0 items-center gap-3">
          <BearLogo size={42} />
          <div className="min-w-0">
            <p className="truncate font-mono text-base font-black uppercase leading-tight text-white sm:text-lg">Truco LBB</p>
            <p className="text-[9px] font-black uppercase tracking-[.2em] text-sky-300">Mesas online</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((item) => <NavLink key={item.href} {...item} selected={active === item.active} />)}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={toggleSound} data-sound-off="true" aria-label={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'} title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] text-sky-100 transition hover:bg-white/[.09]">
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <Link href="/auth/login?next=/truco" className="hidden h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-xs font-black uppercase text-slate-100 transition hover:bg-white/[.09] lg:inline-flex"><LogIn className="h-4 w-4" /> Ingresar</Link>
          <Link href="/truco/perfil#creditos" className="inline-flex h-10 items-center gap-2 rounded-xl bg-sky-500 px-3 text-xs font-black uppercase text-white shadow-lg shadow-sky-950/40 transition hover:bg-sky-400">
            <CircleDollarSign className="h-4 w-4" /> Créditos
          </Link>
        </div>
      </header>
      <nav aria-label="Navegación de Truco" className="fixed bottom-3 left-3 right-3 z-50 grid grid-cols-3 rounded-2xl border border-sky-300/20 bg-[#071426]/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl md:hidden">
        {links.map((item) => <NavLink key={item.href} {...item} selected={active === item.active} mobile />)}
      </nav>
    </>
  )
}

function NavLink({ href, label, icon: Icon, selected, mobile = false }: (typeof links)[number] & { selected: boolean; mobile?: boolean }) {
  return (
    <Link href={href} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition ${selected ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-white/[.07] hover:text-white'} ${mobile ? 'flex-col gap-0.5 py-1.5 text-[9px] uppercase tracking-[.12em]' : ''}`}>
      <Icon className={mobile ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      {label}
    </Link>
  )
}
