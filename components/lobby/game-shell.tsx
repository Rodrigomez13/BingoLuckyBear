'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  CircleDollarSign,
  Gift,
  HelpCircle,
  Home,
  Menu,
  Radio,
  ShoppingCart,
  Swords,
  Trophy,
  UsersRound,
} from 'lucide-react'
import { BearLogo } from '@/components/bear-logo'
import { UserMenu } from '@/components/user-menu'

type GameShellSection = 'home' | 'truco' | 'bingo' | 'cartones' | 'ranking' | 'saldo'

interface GameShellProps {
  active: GameShellSection
  eyebrow?: string
  title: string
  subtitle?: string
  children: ReactNode
  aside?: ReactNode
}

const navItems: Array<{ href: string; label: string; section: GameShellSection; icon: ReactNode }> = [
  { href: '/', label: 'Inicio', section: 'home', icon: <Home className="h-5 w-5" /> },
  { href: '/truco', label: 'Truco', section: 'truco', icon: <Swords className="h-5 w-5" /> },
  { href: '/participar', label: 'Bingo', section: 'bingo', icon: <Radio className="h-5 w-5" /> },
  { href: '/mi-cuenta', label: 'Mis cartones', section: 'cartones', icon: <ShoppingCart className="h-5 w-5" /> },
  { href: '/truco/ranking', label: 'Ranking', section: 'ranking', icon: <Trophy className="h-5 w-5" /> },
  { href: '/mi-cuenta/jugador', label: 'Saldo', section: 'saldo', icon: <CircleDollarSign className="h-5 w-5" /> },
]

export function GameShell({ active, eyebrow, title, subtitle, children, aside }: GameShellProps) {
  return (
    <main className="min-h-screen bg-[#04130c] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(251,191,36,.16),transparent_26%),radial-gradient(circle_at_85%_12%,rgba(34,197,94,.16),transparent_30%),linear-gradient(120deg,#03100a_0%,#062415_48%,#0b110d_100%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="mx-auto grid min-h-screen max-w-[1680px] lg:grid-cols-[14.5rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-amber-300/15 bg-black/25 p-4 lg:block">
          <Link href="/" className="mb-6 flex items-center gap-3">
            <BearLogo size={54} />
            <div>
              <p className="font-mono text-xl font-black uppercase leading-5 text-amber-300">Lucky</p>
              <p className="font-mono text-xl font-black uppercase leading-5 text-white">Bingo</p>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">Bear</p>
            </div>
          </Link>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-black uppercase tracking-wide transition ${
                  active === item.section
                    ? 'bg-amber-300 text-zinc-950 shadow-lg shadow-amber-950/30'
                    : 'text-emerald-50/75 hover:bg-white/[0.06] hover:text-amber-200'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-7 rounded-lg border border-amber-300/20 bg-emerald-950/45 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-300 text-zinc-950">
              <Gift className="h-6 w-6" />
            </div>
            <p className="mt-4 font-mono text-xl font-black text-amber-200">Bonos activos</p>
            <p className="mt-1 text-sm leading-5 text-emerald-50/65">Entrá todos los días y revisá beneficios para jugar.</p>
            <Link href="/mi-cuenta/premios" className="mt-4 flex h-10 items-center justify-center rounded-md border border-lime-300/35 text-sm font-black uppercase text-lime-200 hover:bg-lime-300/10">
              Ver bonos
            </Link>
          </div>
        </aside>

        <section className="min-w-0 px-3 pb-8 pt-3 sm:px-5 lg:px-7">
          <header className="sticky top-3 z-40 mb-5 rounded-lg border border-amber-300/15 bg-[#031008]/88 px-3 py-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Link href="/" className="lg:hidden">
                  <BearLogo size={46} />
                </Link>
                <div className="min-w-0">
                  {eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">{eyebrow}</p>}
                  <h1 className="truncate font-mono text-xl font-black text-white sm:text-2xl">{title}</h1>
                  {subtitle && <p className="hidden truncate text-sm text-emerald-50/60 sm:block">{subtitle}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/ayuda" className="hidden h-11 items-center gap-2 rounded-lg border border-amber-300/20 px-3 text-sm font-black text-amber-100 hover:bg-amber-300/10 md:flex">
                  <HelpCircle className="h-4 w-4" />
                  ¿Cómo jugar?
                </Link>
                <Link href="/mi-cuenta" className="hidden h-11 items-center gap-2 rounded-lg border border-emerald-300/20 px-3 text-sm font-black text-emerald-100 hover:bg-emerald-300/10 sm:flex">
                  <UsersRound className="h-4 w-4" />
                  Mi cuenta
                </Link>
                <UserMenu active={active === 'saldo'} />
                <button type="button" aria-label="Abrir menú" className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-amber-100 lg:hidden">
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          <div className={aside ? 'grid gap-5 2xl:grid-cols-[minmax(0,1fr)_20rem]' : ''}>
            <div className="min-w-0">{children}</div>
            {aside && <aside className="grid gap-4 md:grid-cols-2 2xl:block 2xl:space-y-4">{aside}</aside>}
          </div>
        </section>
      </div>
    </main>
  )
}
