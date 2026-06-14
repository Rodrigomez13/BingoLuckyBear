'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Radio, Ticket, Coins, UserCircle2 } from 'lucide-react'
import type { ComponentType } from 'react'

interface NavItem {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
  /** Match function for the active state */
  match: (path: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Inicio', icon: Home, match: (p) => p === '/' },
  { href: '/en-vivo', label: 'En Vivo', icon: Radio, match: (p) => p.startsWith('/en-vivo') },
  { href: '/participar', label: 'Participar', icon: Ticket, match: (p) => p.startsWith('/participar') },
  { href: '/truco', label: 'Truco', icon: Coins, match: (p) => p.startsWith('/truco') },
  { href: '/mi-cuenta', label: 'Cuenta', icon: UserCircle2, match: (p) => p.startsWith('/mi-cuenta') },
]

/** Routes where the bottom nav should be hidden (immersive / admin contexts). */
const HIDDEN_PREFIXES = ['/admin']

export function MobileBottomNav() {
  const pathname = usePathname() || '/'

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null
  }

  return (
    <nav
      aria-label="Navegación principal"
      className="lbb-bottom-nav fixed inset-x-0 bottom-0 z-50 md:hidden"
    >
      <div className="mx-auto max-w-md px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        <div className="flex items-stretch justify-between gap-1 rounded-2xl border border-white/10 bg-black/80 px-1.5 py-1.5 shadow-2xl shadow-black/50 backdrop-blur-2xl">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`group flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors ${
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
                <span className={active ? 'text-amber-100' : ''}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
