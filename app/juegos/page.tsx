import type { Metadata } from 'next'
import Link from 'next/link'
import { Grid3X3, WalletCards } from 'lucide-react'
import { GameCatalogCard } from '@/components/games/game-catalog-card'
import { SiteHeader } from '@/components/site-header'
import { ACTIVE_PLATFORM_GAMES } from '@/lib/games/registry'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Juegos | LuckyBingoBear',
  description: 'Lobby de juegos disponibles de LuckyBingoBear con Bingo, Truco, Golden Bear y Viborita.',
}

async function hasVerifiedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return Boolean(user?.email_confirmed_at || user?.confirmed_at)
}

export default async function GamesPage() {
  const showWallet = await hasVerifiedUser()

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
                {showWallet
                  ? 'Bingo, Truco, Slots y arcade conectados al mismo saldo LBB. No hay saldos separados por juego.'
                  : 'Bingo, Truco, Slots y arcade reunidos en un lobby simple, con acceso directo a las experiencias disponibles.'}
              </p>
            </div>
            {showWallet && (
              <Link href="/mi-cuenta/jugador" className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-3 text-sm font-black text-amber-100 hover:bg-amber-300/20">
                <WalletCards className="h-4 w-4" />
                Ver wallet
              </Link>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ACTIVE_PLATFORM_GAMES.map((game, index) => (
            <GameCatalogCard key={game.id} game={game} priority={index < 2} />
          ))}
        </section>

        <section className="mt-6 rounded-[1.5rem] border border-emerald-300/15 bg-emerald-300/5 p-5 text-sm leading-6 text-emerald-50/80">
          <Grid3X3 className="mb-3 h-5 w-5 text-amber-300" />
          {showWallet
            ? 'Todos los juegos de créditos consumen y acreditan desde el mismo saldo LBB. El catálogo queda preparado para ranking, límites y misiones.'
            : 'El catálogo muestra las experiencias disponibles de LuckyBingoBear, con navegación rápida y diseño preparado para jugar en cualquier pantalla.'}
        </section>
      </div>
    </main>
  )
}
