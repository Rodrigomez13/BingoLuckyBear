import Link from 'next/link'
import { ArrowRight, Bot, CircleDollarSign, Coins, Gamepad2, Radio, Sparkles, Ticket, Trophy, WalletCards } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const games = [
  {
    name: 'Bingo LBB',
    type: 'Sorteos y cartones',
    href: '/participar',
    cta: 'Comprar cartón',
    status: 'Sorteos activos',
    description: 'Entrá a sorteos, comprá cartones digitales y seguí los resultados en vivo.',
    icon: Ticket,
    accent: 'from-emerald-400/24 to-amber-300/18',
  },
  {
    name: 'Truco',
    type: 'Mesas online y bot',
    href: '/truco',
    cta: 'Ver mesas',
    status: 'Partidas disponibles',
    description: 'Jugá contra el oso, armá mesa con rival o seguí partidas públicas.',
    icon: Gamepad2,
    accent: 'from-sky-400/20 to-emerald-300/16',
  },
  {
    name: 'Golden Bear',
    type: 'Slots LBB Original',
    href: '/juegos/golden-bear',
    cta: 'Entrar al slot',
    status: 'Modo demo / créditos LBB',
    description: 'Giros, cascadas, bonus y premios integrados al saldo central LBB.',
    icon: Trophy,
    accent: 'from-amber-300/24 to-orange-500/18',
  },
  {
    name: 'Próximos juegos',
    type: 'Nuevas experiencias',
    href: '/juegos',
    cta: 'Ver plataforma',
    status: 'En preparación',
    description: 'La arquitectura queda lista para sumar ruleta, cartas, torneos y más.',
    icon: Sparkles,
    accent: 'from-violet-400/18 to-amber-300/16',
  },
]

const walletPills = [
  { icon: WalletCards, label: 'Una cuenta' },
  { icon: Coins, label: 'Saldo LBB central' },
  { icon: CircleDollarSign, label: 'Créditos para todos los juegos' },
  { icon: Radio, label: 'Historial y movimientos' },
]

export function GameLobbySection() {
  return (
    <section id="juegos" className="lbb-scroll-reveal py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-amber-300">Lobby de juegos</p>
            <h2 className="text-balance text-3xl font-black leading-tight text-white sm:text-5xl">
              Elegí tu juego. Usá el mismo saldo en toda la plataforma.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
              LuckyBingoBear concentra Bingo, Truco, Slots y futuros juegos en una sola cuenta. Tu saldo LBB se acredita, consume y registra desde una wallet central.
            </p>
          </div>
          <Link
            href="/mi-cuenta/jugador"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-300/20 sm:w-auto"
          >
            Ver wallet
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mb-6 grid gap-2 min-[520px]:grid-cols-2 lg:grid-cols-4">
          {walletPills.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm font-bold text-slate-100">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-400/12 text-emerald-300">
                  <Icon className="h-4 w-4" />
                </span>
                {item.label}
              </div>
            )
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {games.map((game) => {
            const Icon = game.icon
            return (
              <Card key={game.name} className="group relative overflow-hidden rounded-[1.6rem] border-white/10 bg-zinc-950/62 py-0 text-white shadow-2xl shadow-black/30 transition hover:-translate-y-1 hover:border-amber-300/40">
                <div className={`absolute inset-0 bg-gradient-to-br ${game.accent}`} />
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5 blur-2xl transition group-hover:bg-amber-300/12" />
                <CardContent className="relative flex h-full min-h-[18rem] flex-col p-5">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-300/20 bg-black/35 text-amber-200 shadow-inner">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
                      {game.status}
                    </span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300/80">{game.type}</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-white">{game.name}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{game.description}</p>
                  <Link href={game.href} className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 px-4 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-200">
                    {game.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-emerald-300/15 bg-emerald-300/5 p-4 text-sm leading-6 text-emerald-50/80 sm:p-5">
          <strong className="text-emerald-200">Saldo LBB:</strong> todos los juegos consumen créditos desde la misma wallet y los premios vuelven al mismo saldo. No hay saldos separados por juego.
        </div>
      </div>
    </section>
  )
}
