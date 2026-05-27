import Link from 'next/link'
import { ArrowRight, Gift, Radio, Sparkles, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BearLogo } from '@/components/bear-logo'
import { BingoMachineVisual } from './bingo-machine-visual'

const heroStats = [
  { value: '75', label: 'bolillas oficiales' },
  { value: '5x5', label: 'carton digital' },
  { value: 'Live', label: 'sorteo en vivo' },
]

const floatingBalls = [
  { number: 7, className: 'left-[7%] top-28 bg-red-500' },
  { number: 21, className: 'right-[8%] top-36 bg-amber-400 text-zinc-950' },
  { number: 45, className: 'left-[18%] bottom-28 bg-emerald-500' },
  { number: 63, className: 'right-[13%] bottom-20 bg-sky-500' },
]

export function HeroSection() {
  return (
    <section className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(251,191,36,0.22),transparent_28rem),radial-gradient(circle_at_88%_28%,rgba(16,185,129,0.14),transparent_24rem),radial-gradient(circle_at_50%_100%,rgba(239,68,68,0.12),transparent_28rem)]" />
      <div className="absolute inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {floatingBalls.map((ball) => (
          <BingoBall key={ball.number} number={ball.number} className={ball.className} />
        ))}
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 overflow-hidden px-4 py-14 sm:px-6 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:px-8">
        <div className="min-w-0 text-center lg:text-left">
          <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-md border border-amber-300/30 bg-amber-300/10 px-2 py-2 text-xs font-bold text-amber-100 sm:px-3 sm:text-sm">
            <Sparkles className="h-4 w-4" />
            <span className="min-w-0">Bingo online con cartones, premios y vivo</span>
          </div>

          <h1
            className="text-4xl font-black leading-[0.95] text-white sm:text-6xl md:text-7xl"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            Lucky
            <span className="block bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              Bingo Bear
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-[34ch] text-base leading-relaxed text-zinc-200 sm:max-w-2xl sm:text-xl lg:mx-0">
            Compra tu carton digital, guarda tu codigo y segui el sorteo en vivo con bolillas cantadas, premio destacado
            y ganadores publicados.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            <Button
              asChild
              size="lg"
              className="h-14 bg-amber-400 px-7 text-base font-black text-zinc-950 shadow-xl shadow-amber-500/25 hover:bg-amber-300"
            >
              <Link href="/participar">
                Solicitar mi carton
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 border-2 border-white/20 bg-white/5 px-7 text-base font-bold text-white hover:bg-white/10"
            >
              <Link href="/en-vivo">
                <Radio className="mr-2 h-5 w-5" />
                Ver sorteo
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-2xl">
            {heroStats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-white/10 bg-white/[0.06] p-3 backdrop-blur sm:p-4">
                <p className="text-2xl font-black text-white sm:text-3xl" style={{ fontFamily: 'var(--font-fredoka)' }}>
                  {stat.value}
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase leading-tight text-amber-100 sm:text-xs">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[520px] min-w-0 overflow-hidden px-1 py-2">
          <div className="absolute left-2 top-10 z-10 rounded-lg border border-emerald-300/30 bg-emerald-400 px-3 py-3 text-zinc-950 shadow-2xl shadow-emerald-950/30 sm:-left-2 sm:px-4">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              <p className="text-sm font-black uppercase">Premio activo</p>
            </div>
            <p className="text-xs font-bold">Publicado en cada sorteo</p>
          </div>

          <div className="absolute bottom-16 right-2 z-10 rounded-lg border border-sky-300/30 bg-sky-400 px-3 py-3 text-zinc-950 shadow-2xl shadow-sky-950/30 sm:-right-1 sm:px-4">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              <p className="text-sm font-black uppercase">Carton unico</p>
            </div>
            <p className="text-xs font-bold">Codigo LBB listo</p>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-amber-300/25 bg-zinc-950/75 p-5 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <BearLogo size={92} variant="context" className="h-auto w-24 drop-shadow-xl" />
              <div className="text-right">
                <p className="text-xs font-bold uppercase text-amber-200">Proximo carton</p>
                <p className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-fredoka)' }}>
                  BINGO
                </p>
              </div>
            </div>
            <BingoMachineVisual />
          </div>
        </div>
      </div>
    </section>
  )
}

function BingoBall({ number, className }: { number: number; className: string }) {
  return (
    <div
      className={`absolute hidden h-14 w-14 animate-bounce items-center justify-center rounded-full text-sm font-black text-white shadow-xl md:flex ${className}`}
      style={{ animationDuration: `${3 + (number % 4) * 0.35}s` }}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-950">{number}</span>
    </div>
  )
}
