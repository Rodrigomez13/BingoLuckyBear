'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from './logo'

const navLinks = [
  { label: 'Inicio', href: '/#inicio' },
  { label: 'Jugar', href: '/truco' },
  { label: 'Cómo jugar', href: '/#como-jugar' },
  { label: 'Beneficios', href: '/#beneficios' },
  { label: 'Contacto', href: '/#contacto' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-900/60 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Ir al inicio">
          <Logo />
        </Link>

        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="Navegación principal"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-emerald-50/70 transition-colors hover:text-yellow-400"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="outline"
            className="border-yellow-500/50 bg-transparent text-emerald-50 hover:bg-yellow-500/10 hover:text-yellow-400"
            asChild
          >
            <Link href="/auth/login">Iniciar sesión</Link>
          </Button>
          <Button asChild className="bg-yellow-500 font-semibold text-slate-950 hover:bg-yellow-600">
            <Link href="/truco">Jugar ahora</Link>
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-emerald-50 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-emerald-900/60 bg-slate-950 md:hidden">
          <nav
            className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4"
            aria-label="Navegación móvil"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-base font-medium text-emerald-50/70 hover:bg-emerald-900/20 hover:text-yellow-400"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t border-emerald-900/60 pt-4">
              <Button
                variant="outline"
                className="border-yellow-500/50 bg-transparent text-emerald-50 hover:bg-yellow-500/10 hover:text-yellow-400"
                asChild
                fullWidth
              >
                <Link href="/auth/login">Iniciar sesión</Link>
              </Button>
              <Button asChild className="bg-yellow-500 font-semibold text-slate-950 hover:bg-yellow-600 w-full">
                <Link href="/truco">Jugar ahora</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
