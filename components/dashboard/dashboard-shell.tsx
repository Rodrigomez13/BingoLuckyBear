'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { TopBar } from '@/components/dashboard/top-bar'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const activePath = pathname || '/inicio'

  return (
    <div className="lbb-dashboard-shell relative min-h-screen text-emerald-50">
      {/* Desktop fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lbb-panel rounded-none lg:block">
        <AppSidebar activePath={activePath} />
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] lbb-panel rounded-none">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-amber-300/20 bg-emerald-950/70 text-amber-100"
            >
              <X className="h-5 w-5" />
            </button>
            <AppSidebar activePath={activePath} onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        <div className="mx-auto w-full max-w-[1400px] px-3 py-3 sm:px-4 sm:py-4">
          <TopBar onOpenMenu={() => setMenuOpen(true)} />
          <main className="py-4">{children}</main>
        </div>
      </div>
    </div>
  )
}
