import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { GameLobbySection } from '@/components/home/game-lobby-section'
import { Footer } from '@/components/home/footer'

export const metadata: Metadata = {
  title: 'Juegos | LuckyBingoBear',
  description: 'Lobby de juegos de LuckyBingoBear: Bingo, Truco, Golden Bear y próximos juegos con saldo LBB centralizado.',
}

export default function GamesPage() {
  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-slate-50">
      <div className="lbb-ambient" />
      <SiteHeader activePath="juegos" kicker="Lobby multiproducto" />
      <div className="relative z-10 pt-[92px]">
        <section className="mx-auto max-w-6xl px-4 pb-2 pt-6 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">LuckyBingoBear Games</p>
            <h1 className="mt-3 max-w-4xl text-balance text-4xl font-black leading-tight text-white sm:text-6xl">
              Un saldo LBB para Bingo, Truco, Slots y nuevos juegos.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
              Elegí una experiencia, entrá con tu cuenta y usá la misma wallet central en toda la plataforma.
            </p>
          </div>
        </section>
        <GameLobbySection />
        <Footer />
      </div>
    </main>
  )
}
