import Link from 'next/link'
import { Gamepad2, Spade, Trophy, ArrowRight } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { ActiveMesas } from '@/components/dashboard/active-mesas'
import { BearLogo } from '@/components/bear-logo'

export const dynamic = 'force-dynamic'

const QUICK_LINKS = [
  { label: 'Jugar Truco', desc: 'Mesas en vivo', href: '/truco', Icon: Spade },
  { label: 'Bingo en vivo', desc: 'Sorteos del día', href: '/en-vivo', Icon: Gamepad2 },
  { label: 'Ranking', desc: 'Top jugadores', href: '/truco/ranking', Icon: Trophy },
]

export default function InicioPage() {
  return (
    <DashboardShell>
      <div className="flex flex-col gap-4">
        {/* Quick links */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {QUICK_LINKS.map(({ label, desc, href, Icon }) => (
            <Link
              key={label}
              href={href}
              className="group flex items-center gap-3 rounded-2xl border border-amber-300/15 bg-emerald-950/50 p-4 transition hover:border-amber-300/40 hover:bg-emerald-900/50"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300">
                <Icon className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black uppercase tracking-wide text-amber-50">{label}</span>
                <span className="block text-xs text-emerald-200/70">{desc}</span>
              </span>
              <ArrowRight className="h-5 w-5 text-amber-300/60 transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>

        {/* Active mesas + side promo */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
          <ActiveMesas />

          <aside className="flex flex-col gap-4">
            <div className="lbb-panel flex flex-col items-center gap-3 rounded-2xl p-5 text-center">
              <BearLogo size={96} className="lbb-float" />
              <h3 className="text-lg font-black lbb-gold-text">Apostá desde afuera</h3>
              <p className="text-sm text-emerald-200/75">
                Apoyá a tu jugador favorito en una mesa en vivo y ganá si él gana.
              </p>
              <Link
                href="/truco"
                className="w-full rounded-xl py-3 text-sm font-black uppercase tracking-wide lbb-gold-button"
              >
                Más información
              </Link>
            </div>

            <div className="lbb-panel rounded-2xl p-5">
              <h3 className="text-sm font-black uppercase tracking-wide text-amber-50">¿Cómo funciona?</h3>
              <ol className="mt-3 flex flex-col gap-3">
                {['Elegí tu juego: Truco o Bingo', 'Entrá a una mesa o creá la tuya', 'Jugá y ganá premios reales', 'Retirá tus ganancias de forma segura'].map(
                  (step, i) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300 text-xs font-black text-emerald-950">
                        {i + 1}
                      </span>
                      <span className="text-sm text-emerald-100/85">{step}</span>
                    </li>
                  ),
                )}
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </DashboardShell>
  )
}
