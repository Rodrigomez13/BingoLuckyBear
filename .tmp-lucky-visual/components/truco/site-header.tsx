'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from './logo'

const navLinks = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Truco', href: '#truco' },
  { label: 'Cómo jugar', href: '#como-jugar' },
  { label: 'Beneficios', href: '#beneficios' },
  { label: 'Contacto', href: '#contacto' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#inicio" aria-label="Ir al inicio">
          <Logo />
        </a>

        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="Navegación principal"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="outline"
            className="border-primary/50 bg-transparent text-foreground hover:bg-primary/10 hover:text-primary"
          >
            Iniciar sesión
          </Button>
          <Button className="bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
            Registrate
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav
            className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4"
            aria-label="Navegación móvil"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-primary"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <Button
                variant="outline"
                className="border-primary/50 bg-transparent hover:bg-primary/10 hover:text-primary"
              >
                Iniciar sesión
              </Button>
              <Button className="bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
                Registrate
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
