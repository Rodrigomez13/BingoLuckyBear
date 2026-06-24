import Link from 'next/link'
import type { ReactNode } from 'react'
import { Gamepad2, Grid3X3, Menu, Ticket, Trophy, WalletCards } from 'lucide-react'
import { BearLogo } from '@/components/bear-logo'
import { UserMenu } from '@/components/user-menu'
import { MobileMenu } from '@/components/mobile-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SiteHeaderProps {
  kicker?: string
  jackpotPrize?: string | null
  activePath?: 'home' | 'juegos' | 'participar' | 'ganadores' | 'mi-cuenta' | 'truco' | 'golden-bear' | 'viborita'
  compact?: boolean
}

const gameLinks = [
  { href: '/juegos', label: 'Todos los juegos', description: 'Lobby LBB', icon: Grid3X3, active: 'juegos' },
  { href: '/participar', label: 'Bingo', description: 'Cartones y sorteos', icon: Ticket, active: 'participar' },
  { href: '/truco', label: 'Truco', description: 'Mesas y partidas', icon: Gamepad2, active: 'truco' },
  { href: '/juegos/golden-bear', label: 'Golden Bear', description: 'Slot LBB Original', icon: Trophy, active: 'golden-bear' },
  { href: '/juegos/viborita', label: 'Viborita LBB', description: 'Arcade LBB', icon: Gamepad2, active: 'viborita' },
] as const

export function SiteHeader({ kicker = 'Plataforma de juegos', jackpotPrize, activePath = 'home', compact = false }: SiteHeaderProps) {
  const gamesActive = gameLinks.some((link) => link.active === activePath)

  return (
    <header className={`${compact ? 'sticky top-3' : 'fixed left-0 right-0 top-4'} z-50 px-3 sm:top-5`}>
      <div className="mx-auto w-full max-w-6xl rounded-2xl border border-white/10 bg-black/72 px-2 shadow-2xl shadow-black/35 backdrop-blur-2xl sm:px-5">
        <div className="flex h-16 items-center justify-between gap-2">
          <Link href="/" className="group flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-amber-300/20 blur-lg transition group-hover:bg-amber-300/35" />
              <BearLogo size={42} className="relative" />
            </div>
            <div className="hidden min-w-0 sm:block">
              <span className="block truncate font-mono text-base font-bold tracking-normal text-white">
                LuckyBingoBear
              </span>
              <p className="-mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">{kicker}</p>
            </div>
          </Link>

          <nav className="flex shrink-0 items-center gap-1 text-sm sm:gap-3">
            {jackpotPrize && (
              <span className="hidden h-9 items-center gap-2 rounded-full border border-amber-300/45 bg-amber-300 px-3 text-xs font-bold uppercase tracking-wide text-zinc-950 lg:inline-flex">
                <Trophy className="h-4 w-4" />
                {jackpotPrize}
              </span>
            )}
            <HeaderLink href="/" active={activePath === 'home'} label="Inicio" className="hidden lg:inline-flex" />
            <GamesDropdown active={gamesActive} />
            <HeaderLink href="/mi-cuenta/jugador" active={activePath === 'mi-cuenta'} icon={<WalletCards className="h-4 w-4" />} label="Wallet" className="hidden md:inline-flex" />
            <HeaderLink href="/ganadores" active={activePath === 'ganadores'} label="Historial" className="hidden md:inline-flex" />
            <UserMenu active={activePath === 'mi-cuenta'} />
            <MobileMenu />
          </nav>
        </div>
      </div>
    </header>
  )
}

function GamesDropdown({ active }: { active: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`hidden items-center gap-2 rounded-full px-2 py-2 font-semibold transition-colors sm:inline-flex ${
            active ? 'bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/25' : 'text-slate-300 hover:text-amber-200'
          }`}
        >
          <Menu className="h-4 w-4" />
          <span>Juegos</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={12} className="w-72 border-amber-300/20 bg-zinc-950/96 p-2 text-slate-100 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {gameLinks.map((item) => {
          const Icon = item.icon
          return (
            <DropdownMenuItem key={item.href} asChild className="rounded-xl p-0 focus:bg-amber-300/10 focus:text-amber-100">
              <Link href={item.href} className="flex w-full items-center gap-3 rounded-xl px-3 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-amber-300/20 bg-amber-300/10 text-amber-200">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold leading-tight text-white">{item.label}</span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{item.description}</span>
                </span>
              </Link>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function HeaderLink({
  href,
  active,
  label,
  icon,
  className = 'hidden sm:inline-flex',
}: {
  href: string
  active: boolean
  label: string
  icon?: ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`${className} items-center gap-1 rounded-full px-2 py-2 font-semibold transition-colors ${
        active ? 'bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/25' : 'text-slate-300 hover:text-amber-200'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  )
}
