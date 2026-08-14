'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { CircleDollarSign, HelpCircle, Swords, Trophy } from 'lucide-react'
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

export function GameShell({ active, eyebrow, title, subtitle, children, aside }: GameShellProps) {
  return (
    <main className="truco-page min-h-screen text-foreground">
      <div className="truco-ambient" aria-hidden="true" />
      <header className="sticky top-0 z-50 border-b border-accent/20 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1560px] items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
          <Link href="/truco" className="flex shrink-0 items-center gap-2.5" aria-label="Lucky Bingo Bear Truco">
            <BearLogo size={48} />
            <div className="hidden sm:block">
              <p className="font-mono text-lg font-black uppercase leading-4 text-accent">Lucky Bingo Bear</p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.3em] text-primary">Truco online</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación de Truco">
            <Link href="/truco" className="flex h-10 items-center gap-2 rounded-md bg-primary/10 px-4 text-sm font-black text-primary">
              <Swords data-icon="inline-start" /> Jugar
            </Link>
            <Link href="/truco/ranking" className="flex h-10 items-center gap-2 rounded-md px-4 text-sm font-bold text-muted-foreground transition hover:bg-secondary hover:text-foreground">
              <Trophy data-icon="inline-start" /> Ranking
            </Link>
            <Link href="/ayuda" className="flex h-10 items-center gap-2 rounded-md px-4 text-sm font-bold text-muted-foreground transition hover:bg-secondary hover:text-foreground">
              <HelpCircle data-icon="inline-start" /> Cómo jugar
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/mi-cuenta/jugador" className="hidden h-10 items-center gap-2 rounded-md border border-accent/25 bg-accent/10 px-3 text-xs font-black uppercase tracking-wide text-accent transition hover:bg-accent/15 sm:flex">
              <CircleDollarSign data-icon="inline-start" /> Saldo
            </Link>
            <UserMenu active={active === 'saldo'} />
          </div>
        </div>
      </header>

      <section className="relative mx-auto min-h-[calc(100svh-5rem)] max-w-[1560px] px-3 pb-8 pt-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between gap-4 border-b border-border/70 pb-4">
          <div className="min-w-0">
            {eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.24em] text-accent">{eyebrow}</p>}
            <h1 className="mt-1 truncate font-mono text-xl font-black text-foreground sm:text-2xl">{title}</h1>
            {subtitle && <p className="mt-1 hidden text-sm text-muted-foreground sm:block">{subtitle}</p>}
          </div>
          <span className="hidden items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary sm:flex">
            <span className="size-1.5 rounded-full bg-primary" /> Mesas activas
          </span>
        </div>

        <div className={aside ? 'grid gap-5 2xl:grid-cols-[minmax(0,1fr)_19rem]' : ''}>
          <div className="min-w-0">{children}</div>
          {aside && <aside className="grid gap-4 md:grid-cols-2 2xl:flex 2xl:flex-col">{aside}</aside>}
        </div>
      </section>
    </main>
  )
}
