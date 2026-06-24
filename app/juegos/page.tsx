import type { Metadata } from 'next'
import Link from 'next/link'
import type { ComponentType } from 'react'
import { Gamepad2, Grid3X3, Ticket, Trophy, WalletCards } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'

export const metadata: Metadata = {
  title: 'Juegos | LuckyBingoBear',
  description: 'Lobby de juegos de LuckyBingoBear con Bingo, Truco, Golden Bear, Viborita y próximos juegos.',
}

type IconType = ComponentType<{ className?: string }>

const games: Array<{ title: string; subtitle: string; href: string; cta: string; logo: string; icon: IconType; description: string; status: string }> = [
  { title: 'Bingo LBB', subtitle: 'Sorteos y cartones', href: '/participar', cta: 'Comprar cartón', logo: 'B', icon: Ticket, description: 'Cartones digitales, resultados y premios acreditados en tu wallet LBB.', status: 'Disponible' },
  { title: 'Truco', subtitle: 'Mesas online', href: '/truco', cta: 'Ver mesas', logo: 'T', icon: Gamepad2, description: 'Partidas contra bot, salas públicas, ranking y apuestas laterales.', status: 'Mesas activas' },
  { title: 'Golden Bear', subtitle: 'Slot LBB Original', href: '/juegos/golden-bear', cta: 'Entrar al slot', logo: 'GB', icon: Trophy, description: 'Giros, cascadas, bonus y premios integrados al saldo central.', status: 'Bonus activo' },
  { title: 'Viborita LBB', subtitle: 'Arcade demo', href: '/juegos/viborita', cta: 'Jugar demo', logo: 'S', icon: Gamepad2, description: 'Juego propio tipo viborita, listo para evolucionar a ranking y desafíos.', status: 'Nuevo' },
]

export default function GamesPage() {
  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-slate-50">
      <div className="lbb-ambient" />
      <SiteHeader activePath="juegos" kicker="Lobby de juegos" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-[92px] sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">LuckyBingoBear Games</p>
              <h1 className="mt-3 max-w-4xl text-balance text-4xl font-black leading-tight text-white sm:text-6xl">
                Elegí una experiencia y usá el mismo saldo LBB.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
                Bingo, Truco, Slots, arcade y futuros juegos conectados a una wallet central. No hay saldos separados por juego.
              </p>
            </div>
            <Link href="/mi-cuenta/jugador" className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-3 text-sm font-black text-amber-100 hover:bg-amber-300/20">
              <WalletCards className="h-4 w-4" />
              Ver wallet
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {games.map((game) => {
            const Icon = game.icon
            return (
              <Link key={game.title} href={game.href} className="group relative flex min-h-[19rem] flex-col overflow-hidden rounded-[1.6rem] border border-white/10 bg-zinc-950/62 p-5 shadow-2xl shadow-black/30 transition hover:-translate-y-1 hover:border-amber-300/45">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(250,204,21,.18),transparent_30%),linear-gradient(135deg,rgba(4,120,87,.16),rgba(0,0,0,.1))]" />
                <div className="relative mb-5 flex items-start justify-between gap-3">
                  <span className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-amber-300/35 bg-black/45 shadow-inner">
                    <span className="absolute inset-1 rounded-xl bg-[radial-gradient(circle_at_35%_28%,rgba(250,204,21,.35),transparent_45%),linear-gradient(145deg,rgba(6,78,59,.75),rgba(0,0,0,.2))]" />
                    <span className="relative font-mono text-xl font-black text-amber-100 drop-shadow">{game.logo}</span>
                    <Icon className="absolute bottom-1.5 right-1.5 h-4 w-4 text-lime-300" />
                  </span>
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
                    {game.status}
                  </span>
                </div>
                <p className="relative text-[10px] font-black uppercase tracking-[0.2em] text-amber-300/80">{game.subtitle}</p>
                <h2 className="relative mt-2 text-2xl font-black text-white">{game.title}</h2>
                <p className="relative mt-3 flex-1 text-sm leading-6 text-slate-300">{game.description}</p>
                <span className="relative mt-5 inline-flex h-11 items-center justify-center rounded-full bg-amber-300 px-4 text-sm font-black text-zinc-950 group-hover:bg-amber-200">
                  {game.cta}
                </span>
              </Link>
            )
          })}
        </section>

        <section className="mt-6 rounded-[1.5rem] border border-emerald-300/15 bg-emerald-300/5 p-5 text-sm leading-6 text-emerald-50/80">
          <Grid3X3 className="mb-3 h-5 w-5 text-amber-300" />
          Todos los juegos están pensados para consumir y acreditar desde la misma wallet LBB. Los demos se mantienen separados hasta conectar economía real, ranking y límites desde admin.
        </section>
      </div>
    </main>
  )
}
