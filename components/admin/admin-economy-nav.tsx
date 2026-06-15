'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Gamepad2, Landmark, ListChecks, ReceiptText, SlidersHorizontal } from 'lucide-react'

const items = [
  { href: '/admin/saldo', label: 'Resumen', icon: BarChart3 },
  { href: '/admin/depositos', label: 'Depósitos', icon: ReceiptText },
  { href: '/admin/retiros', label: 'Retiros', icon: Landmark },
  { href: '/admin/saldo/movimientos', label: 'Movimientos', icon: ListChecks },
  { href: '/admin/saldo/ajustes', label: 'Ajustes', icon: SlidersHorizontal },
  { href: '/admin/saldo/consumos', label: 'Consumos por juego', icon: Gamepad2 },
]

export function AdminEconomyNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Navegación de economía" className="mb-6 overflow-x-auto border-b border-white/10">
      <div className="flex min-w-max gap-1">
        {items.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-11 items-center gap-2 border-b-2 px-3 text-sm font-bold transition ${
                active
                  ? 'border-amber-300 text-amber-200'
                  : 'border-transparent text-zinc-400 hover:border-white/20 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
