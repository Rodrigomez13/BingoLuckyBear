import Link from 'next/link'
import { ArrowRight, Coins, Crown, ShieldCheck, Trophy, Users, Sword, Wine } from 'lucide-react'
import type { ComponentType } from 'react'
import { Button } from '@/components/ui/button'

const SUIT_ICON: Record<string, ComponentType<{ className?: string }>> = {
  ESPADA: Sword,
  ORO: Coins,
  COPA: Wine,
}

const featureCards = [
  {
    icon: <Users className="h-5 w-5" />,
    title: 'Antesala pública',
    text: 'Mirá mesas disponibles, entrá como rival o creá una sala privada por código.',
  },
  {
    icon: <Trophy className="h-5 w-5" />,
    title: 'Ranking de jugadores',
    text: 'Competí con alias y avatar. Cada partida rankeada suma historial y estadísticas.',
  },
  {
    icon: <Coins className="h-5 w-5" />,
    title: 'Saldo compartido',
    text: 'Usá puntos internos para jugar, torneos y futuras promociones dentro de la plataforma.',
  },
]

const sampleCards = [
  { rank: '1', suit: 'ESPADA', power: 'MATA' },
  { rank: '7', suit: 'ORO', power: 'FUERTE' },
  { rank: '3', suit: 'COPA', power: 'JUEGO' },
]

export function TrucoPromoSection() {
  return (
    <section className="relative isolate overflow-hidden py-10 sm:py-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,.13),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(4,247,124,.09),transparent_28%)]" />
      <div className="lbb-scroll-reveal mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,.92fr)_minmax(22rem,1fr)] lg:px-8">
        <div className="flex min-w-0 flex-col justify-center text-center lg:text-left">
          <p className="mb-4 inline-flex w-fit items-center gap-2 self-center rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-amber-200 lg:self-start">
            <Coins className="h-4 w-4" /> Nuevo juego online
          </p>
          <h2 className="text-balance font-mono text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            Truco argentino con la estética Lucky Bear.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-slate-300 lg:mx-0">
            Además del bingo, ahora podés jugar Truco contra el oso, crear mesas online, competir por ranking y usar el mismo saldo de tu cuenta. Todo desde un solo lugar.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button asChild size="lg" className="h-12 rounded-full bg-amber-300 px-7 font-black text-zinc-950 hover:bg-amber-200">
              <Link href="/truco">
                Jugar Truco
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/15 bg-black/25 px-7 font-bold text-white hover:border-amber-300 hover:bg-amber-300/10 hover:text-amber-200">
              <Link href="/truco/ranking">
                Ver ranking
                <Trophy className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {featureCards.map((feature) => (
              <div key={feature.title} className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/40 hover:bg-white/[0.07]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300 text-zinc-950 transition-transform duration-300 group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-black text-white">{feature.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-400">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[30rem] rounded-[2rem] border border-amber-300/20 bg-[#06140e]/80 p-4 shadow-2xl shadow-black/40 sm:p-6">
          <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative flex h-full flex-col justify-between gap-5">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200/80">Mesa pública</p>
                  <p className="font-mono text-2xl font-black tracking-[0.18em] text-amber-300">LBB27</p>
                </div>
                <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase text-emerald-200">
                  Esperando rival
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Puntos" value="30" />
                <MiniStat label="Entrada" value="50" />
                <MiniStat label="Pozo" value="100" />
              </div>
            </div>

            <div className="relative flex min-h-[12rem] items-center justify-center">
              {sampleCards.map((card, index) => {
                const SuitIcon = SUIT_ICON[card.suit] ?? Sword
                return (
                <div
                  key={`${card.rank}-${card.suit}`}
                  className="absolute aspect-[5/7] w-28 rounded-2xl border border-amber-300/35 bg-gradient-to-br from-[#f8e5b0] to-[#b7822d] p-2 shadow-2xl shadow-black/40 transition-transform duration-500 hover:-translate-y-2 sm:w-32"
                  style={{ transform: `translateX(${(index - 1) * 4.25}rem) rotate(${(index - 1) * 9}deg)`, zIndex: index + 1 }}
                >
                  <div className="flex h-full flex-col justify-between rounded-xl border border-amber-950/20 bg-[#fff4ca] p-2 text-amber-950">
                    <div className="flex items-center justify-between font-mono font-black">
                      <span>{card.rank}</span>
                      <SuitIcon className="h-4 w-4" />
                    </div>
                    <div className="text-center">
                      <Crown className="mx-auto mb-2 h-8 w-8" />
                      <p className="font-mono text-lg font-black">{card.power}</p>
                      <p className="text-[9px] font-black tracking-[0.16em]">{card.suit}</p>
                    </div>
                    <div className="text-right font-mono font-black">LBB</div>
                  </div>
                </div>
                )
              })}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="flex items-center gap-2 text-sm font-black text-white">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" /> Partidas validadas
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-400">El servidor valida cada acción para reducir trampas y errores de sincronización.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="flex items-center gap-2 text-sm font-black text-white">
                  <Coins className="h-4 w-4 text-amber-300" /> Economía interna
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-400">La cuenta concentra avatar, historial, movimientos y puntos internos.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <p className="font-mono text-xl font-black text-white">{value}</p>
      <p className="text-[9px] font-black uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  )
}
