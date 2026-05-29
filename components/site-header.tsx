'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Radio, Ticket, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { BearLogo } from '@/components/bear-logo'
import { cn } from '@/lib/utils'

interface SiteHeaderProps {
  firstPrize?: string | null
}

const navLinks = [
  { href: '/en-vivo', label: 'En Vivo', icon: Radio },
  { href: '/ganadores', label: 'Ganadores' },
  { href: '/participar', label: 'Participar' },
]

export function SiteHeader({ firstPrize }: SiteHeaderProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-zinc-950/80 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Logo - clickable on every page */}
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Ir al inicio">
            <BearLogo size={44} />
            <div className="hidden min-w-0 sm:block">
              <span className="block truncate text-lg font-semibold leading-tight tracking-tight text-white">
                Lucky Bingo Bear
              </span>
              <span className="-mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-amber-200/75">
                Bingo digital en vivo
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {firstPrize && (
              <span className="mr-2 hidden items-center gap-2 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 lg:inline-flex">
                <Trophy className="h-4 w-4" />
                {firstPrize}
              </span>
            )}
            <Link
              href="/en-vivo"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/5 hover:text-white',
                isActive('/en-vivo') ? 'text-white' : 'text-amber-200'
              )}
            >
              <Radio className="h-4 w-4" />
              En Vivo
            </Link>
            <Link
              href="/ganadores"
              className={cn(
                'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-white/5 hover:text-white',
                isActive('/ganadores') ? 'text-white' : 'text-amber-200'
              )}
            >
              Ganadores
            </Link>
            <Button
              asChild
              variant="ghost"
              className="text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <Link href="/auth/login">Admin</Link>
            </Button>
            <Button
              asChild
              className="ml-1 bg-gradient-to-r from-amber-400 to-orange-500 font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-orange-400"
            >
              <Link href="/participar">
                <Ticket className="mr-1.5 h-4 w-4" />
                Participar
              </Link>
            </Button>
          </nav>

          {/* Mobile nav */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-amber-400 to-orange-500 font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-orange-400"
            >
              <Link href="/participar">
                <Ticket className="mr-1.5 h-4 w-4" />
                Participar
              </Link>
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-amber-200 hover:bg-white/5 hover:text-white"
                  aria-label="Abrir menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="border-white/10 bg-zinc-950 text-zinc-100"
              >
                <SheetTitle className="sr-only">Menu de navegacion</SheetTitle>
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3"
                >
                  <BearLogo size={40} />
                  <span className="text-lg font-semibold tracking-tight text-white">
                    Lucky Bingo Bear
                  </span>
                </Link>
                {firstPrize && (
                  <div className="mt-6 flex items-center gap-2 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-sm font-semibold text-emerald-200">
                    <Trophy className="h-4 w-4" />
                    {firstPrize}
                  </div>
                )}
                <nav className="mt-6 flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-3 py-3 text-base font-medium transition-colors hover:bg-white/5',
                          isActive(link.href) ? 'bg-white/5 text-white' : 'text-amber-200'
                        )}
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        {link.label}
                      </Link>
                    )
                  })}
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className="mt-2 rounded-md px-3 py-3 text-base font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    Admin
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
