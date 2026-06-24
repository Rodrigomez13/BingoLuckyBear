'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Grid3X3, WalletCards, MoreHorizontal } from 'lucide-react'
import type { ComponentType } from 'react'

interface NavItem {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
  match: (path: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Inicio', icon: Home, match: (p) => p === '/' },
  { href: '/juegos', label: 'Juegos', icon: Grid3X3, match: (p) => p === '/juegos' || p.startsWith('/juegos/') || p.startsWith('/participar') || p.startsWith('/truco') },
  { href: '/mi-cuenta/jugador', label: 'Wallet', icon: WalletCards, match: (p) => p.startsWith('/mi-cuenta') },
  { href: '/ganadores', label: 'Más', icon: MoreHorizontal, match: (p) => p.startsWith('/ganadores') },
]

const HIDDEN_PREFIXES = ['/admin', '/truco', '/juegos/golden-bear', '/juegos/viborita']

export function MobileBottomNav() {
  const pathname = usePathname() || '/'

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null

  return (
    <nav aria-label="Navegación principal" className="lbb-bottom-nav fixed inset-x-0 bottom-0 z-50 md:hidden">
      <div className="mx-auto w-full max-w-[calc(100vw-1rem)] px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        <div className="grid min-w-0 grid-cols-4 gap-0.5 rounded-2xl border border-white/10 bg-black/80 px-1 py-1.5 shadow-2xl shadow-black/50 backdrop-blur-2xl">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                data-sound="ui.click"
                aria-current={active ? 'page' : undefined}
                className={`group flex min-w-0 flex-col items-center gap-1 rounded-xl px-0.5 py-2 text-[9px] font-bold uppercase tracking-normal transition-colors ${
                  active ? 'text-zinc-950' : 'text-slate-400 hover:text-amber-200'
                }`}
              >
                <span
                  className={`flex h-9 w-full items-center justify-center rounded-lg transition-all ${
                    active
                      ? 'bg-gradient-to-br from-emerald-300 to-amber-300 shadow-lg shadow-emerald-400/25'
                      : 'bg-transparent'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? 'scale-110' : ''} transition-transform`} />
                </span>
                <span className={`max-w-full truncate ${active ? 'text-amber-100' : ''}`}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
