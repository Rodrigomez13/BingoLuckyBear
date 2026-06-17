'use client'

import Link from 'next/link'
import Image from 'next/image'
import { BearLogo } from '@/components/bear-logo'
import { PRIMARY_NAV } from '@/lib/dashboard/nav'

interface AppSidebarProps {
  activePath: string
  onNavigate?: () => void
}

function isActive(item: { match?: string[]; comingSoon?: boolean }, activePath: string) {
  if (item.comingSoon || !item.match) return false
  return item.match.some((m) => activePath === m || activePath.startsWith(`${m}/`))
}

export function AppSidebar({ activePath, onNavigate }: AppSidebarProps) {
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Link href="/inicio" onClick={onNavigate} className="flex items-center justify-center py-2">
        <BearLogo size={132} variant="context" className="drop-shadow-[0_6px_20px_rgba(244,197,66,0.25)]" />
      </Link>

      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto lbb-scrollbar pr-1">
        {PRIMARY_NAV.map((item) => {
          const active = isActive(item, activePath)
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wide transition ${
                active
                  ? 'lbb-nav-active'
                  : 'text-emerald-100/80 hover:bg-amber-300/10 hover:text-amber-100'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.comingSoon && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold tracking-tight text-emerald-200/90">
                  Pronto
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <Link
        href="/participar"
        onClick={onNavigate}
        className="relative overflow-hidden rounded-2xl border border-amber-300/30 bg-gradient-to-b from-emerald-900/80 to-emerald-950 p-4 text-center"
      >
        <p className="text-sm font-black uppercase tracking-wide lbb-gold-text">Jugá y ganá</p>
        <div className="my-3 flex justify-center">
          <Image
            src="/logo-solo.svg"
            alt=""
            width={64}
            height={64}
            className="lbb-float drop-shadow-[0_6px_16px_rgba(244,197,66,0.4)]"
          />
        </div>
        <span className="block w-full rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide lbb-gold-button">
          Ver promociones
        </span>
      </Link>
    </div>
  )
}
