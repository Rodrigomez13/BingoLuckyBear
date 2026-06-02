import Link from 'next/link'
import { Radio, Trophy } from 'lucide-react'
import { BearLogo } from '@/components/bear-logo'

interface SiteHeaderProps {
  kicker?: string
  jackpotPrize?: string | null
  activePath?: 'home' | 'participar' | 'en-vivo' | 'ganadores'
  compact?: boolean
}

export function SiteHeader({ kicker = 'Bingo digital en vivo', jackpotPrize, activePath = 'home', compact = false }: SiteHeaderProps) {
  return (
    <header className={`${compact ? 'sticky top-3' : 'fixed left-0 right-0 top-4'} z-50 px-3 sm:top-5`}>
      <div className="mx-auto w-full max-w-6xl rounded-2xl border border-white/10 bg-black/72 px-3 shadow-2xl shadow-black/35 backdrop-blur-2xl sm:px-5">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="group flex min-w-0 items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-amber-300/20 blur-lg transition group-hover:bg-amber-300/35" />
              <BearLogo size={42} className="relative" />
            </div>
            <div className="hidden min-w-0 sm:block">
              <span className="block truncate font-mono text-base font-bold tracking-normal text-white">
                Lucky Bingo Bear
              </span>
              <p className="-mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">{kicker}</p>
            </div>
          </Link>

          <nav className="flex shrink-0 items-center gap-2 text-sm sm:gap-4">
            {jackpotPrize && (
              <span className="hidden h-9 items-center gap-2 rounded-full border border-amber-300/45 bg-amber-300 px-3 text-xs font-bold uppercase tracking-wide text-zinc-950 lg:inline-flex">
                <Trophy className="h-4 w-4" />
                {jackpotPrize}
              </span>
            )}
            <HeaderLink href="/en-vivo" active={activePath === 'en-vivo'} icon={<Radio className="h-4 w-4" />} label="En Vivo" />
            <HeaderLink href="/ganadores" active={activePath === 'ganadores'} label="Ganadores" className="hidden md:inline-flex" />
            <Link
              href="/participar"
              className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-bold shadow-lg shadow-amber-500/20 transition ${
                activePath === 'participar'
                  ? 'bg-white text-zinc-950'
                  : 'bg-amber-300 text-zinc-950 hover:bg-amber-200'
              }`}
            >
              Participar
            </Link>
          </nav>
        </div>
      </div>
    </header>
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
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`${className} items-center gap-1 rounded-full px-2 py-2 font-semibold transition-colors ${
        active ? 'text-amber-200' : 'text-slate-300 hover:text-amber-200'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}
