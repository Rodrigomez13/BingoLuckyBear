import Link from 'next/link'
import type { ComponentType } from 'react'
import { ArrowRight, BarChart3, Gamepad2, Settings, Sparkles, Swords, Ticket, Trophy, WalletCards } from 'lucide-react'
import { requireAdminPage } from '@/lib/auth/roles'
import { LOBBY_PLATFORM_GAMES, walletModeLabel, type PlatformGameId } from '@/lib/games/registry'

export const dynamic = 'force-dynamic'

type IconType = ComponentType<{ className?: string }>

const gameIcons: Record<PlatformGameId, IconType> = {
  bingo: Ticket,
  truco: Swords,
  golden_bear: Trophy,
  viborita: Gamepad2,
  future_games: Sparkles,
}

export default async function AdminGamesPage() {
  await requireAdminPage()

  return (
    <main className="min-h-screen bg-[#050805] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">Panel admin</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Juegos de la plataforma</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Administrá Bingo, Truco, Slots y futuros juegos desde una arquitectura común. Cada juego consume y acredita créditos desde la wallet central LBB.
            </p>
          </div>
          <Link href="/juegos" className="rounded-full border border-amber-300/30 px-4 py-2 text-sm font-bold text-amber-100 hover:bg-amber-300/10">
            Ver lobby público
          </Link>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <Metric icon={WalletCards} label="Economía" value="Wallet central" />
          <Metric icon={BarChart3} label="Métricas" value="Por juego" />
          <Metric icon={Settings} label="Configuración" value="Modular" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {LOBBY_PLATFORM_GAMES.map((game) => {
            const Icon = gameIcons[game.id]
            const config = [game.category, walletModeLabel(game.walletMode), game.releaseStage, game.featured ? 'destacado' : 'catálogo']
            return (
              <div key={game.name} className="flex min-h-[20rem] flex-col rounded-[1.5rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/35">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
                    {game.statusLabel}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white">{game.name}</h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-400">{game.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {config.map((item) => (
                    <span key={item} className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300">
                      {item}
                    </span>
                  ))}
                </div>
                <Link href={game.adminHref ?? '/admin/games'} className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 px-4 py-3 text-sm font-black text-zinc-950 hover:bg-amber-200">
                  Configurar
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )
          })}
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-amber-300/15 bg-amber-300/5 p-5 text-sm leading-6 text-amber-50/85">
          El registro `platform_games` ya queda creado por migración para evolucionar a configuración dinámica desde base de datos. El registry de código mantiene sincronizados lobby, menú y panel mientras activamos esa administración completa.
        </div>
      </div>
    </main>
  )
}

function Metric({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <Icon className="mb-3 h-5 w-5 text-amber-300" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  )
}
