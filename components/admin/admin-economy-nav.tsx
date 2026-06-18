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
    <nav aria-label="Navegación de economía" className="mb-6 overflow-x-auto rounded-lg border border-amber-300/15 bg-black/25 p-2 shadow-xl shadow-black/20">
      <div className="flex min-w-max gap-2">
        {items.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-11 items-center gap-2 rounded-md border px-3 text-sm font-black transition ${
                active
                  ? 'border-amber-300 bg-amber-300 text-zinc-950 shadow-lg shadow-amber-950/25'
                  : 'border-white/10 bg-white/[0.025] text-emerald-50/70 hover:border-amber-300/25 hover:text-white'
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
