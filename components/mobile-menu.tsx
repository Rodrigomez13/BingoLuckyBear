'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Radio, Spade, Trophy, Ticket, Home, BarChart3, HelpCircle } from 'lucide-react'
import type { ComponentType } from 'react'
import { BearLogo } from '@/components/bear-logo'

interface MenuLink {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
}

const PRIMARY_LINKS: MenuLink[] = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/en-vivo', label: 'Sorteo en vivo', icon: Radio },
  { href: '/participar', label: 'Comprar cartones', icon: Ticket },
  { href: '/truco', label: 'Truco online', icon: Spade },
]

const SECONDARY_LINKS: MenuLink[] = [
  { href: '/ganadores', label: 'Ganadores', icon: Trophy },
  { href: '/truco/ranking', label: 'Ranking e historial', icon: BarChart3 },
  { href: '/#como-funciona', label: 'Cómo jugar', icon: HelpCircle },
]

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname() || '/'

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = original
      }
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-amber-300/30 hover:text-amber-100 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Menú de navegación">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Panel */}
          <div className="absolute right-0 top-0 flex h-full w-[min(84vw,20rem)] flex-col border-l border-white/10 bg-zinc-950/95 shadow-2xl shadow-black/60 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                <BearLogo size={34} />
                <span className="font-mono text-sm font-bold text-white">Lucky Bingo Bear</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:text-amber-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Jugar</p>
              <ul className="flex flex-col gap-1">
                {PRIMARY_LINKS.map((link) => (
                  <MenuRow key={link.href} link={link} active={isActive(pathname, link.href)} onClick={() => setOpen(false)} />
                ))}
              </ul>

              <p className="px-3 pb-2 pt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Más</p>
              <ul className="flex flex-col gap-1">
                {SECONDARY_LINKS.map((link) => (
                  <MenuRow key={link.href} link={link} active={isActive(pathname, link.href)} onClick={() => setOpen(false)} />
                ))}
              </ul>
            </nav>

            <div className="border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <Link
                href="/participar"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-amber-300 px-4 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20"
              >
                <Ticket className="h-4 w-4" />
                Conseguir mi cartón
              </Link>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  if (href.startsWith('/#')) return false
  return pathname.startsWith(href)
}

function MenuRow({ link, active, onClick }: { link: MenuLink; active: boolean; onClick: () => void }) {
  const Icon = link.icon
  return (
    <li>
      <Link
        href={link.href}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
          active ? 'bg-amber-300/10 text-amber-100 ring-1 ring-amber-300/25' : 'text-slate-300 hover:bg-white/5 hover:text-amber-100'
        }`}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {link.label}
      </Link>
    </li>
  )
}
