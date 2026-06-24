import type { Metadata } from 'next'
import Link from 'next/link'
import { Grid3X3, WalletCards } from 'lucide-react'
import { GameShowcaseVisual } from '@/components/games/lbb-game-visuals'
import { SiteHeader } from '@/components/site-header'
import { ACTIVE_PLATFORM_GAMES, walletModeLabel } from '@/lib/games/registry'

export const metadata: Metadata = {
  title: 'Juegos | LuckyBingoBear',
  description: 'Lobby de juegos de LuckyBingoBear con Bingo, Truco, Golden Bear, Viborita y próximos juegos.',
}

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

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          {ACTIVE_PLATFORM_GAMES.map((game) => {
            return (
              <Link key={game.id} href={game.href} className="group relative flex min-h-[28rem] flex-col overflow-hidden rounded-[1.8rem] border border-white/10 bg-zinc-950/68 p-4 shadow-2xl shadow-black/30 transition hover:-translate-y-1 hover:border-amber-300/45 sm:p-5">
                <GameShowcaseVisual game={game} compact />
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">{game.statusLabel}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-lime-200/80">{walletModeLabel(game.walletMode)}</span>
                </div>
                <p className="relative text-[10px] font-black uppercase tracking-[0.2em] text-amber-300/80">{game.subtitle}</p>
                <h2 className="relative mt-2 text-2xl font-black text-white">{game.name}</h2>
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
          Todos los juegos de créditos consumen y acreditan desde la misma wallet LBB. El catálogo queda preparado para ranking, límites, misiones y configuración operativa por juego.
        </section>
      </div>
    </main>
  )
}
