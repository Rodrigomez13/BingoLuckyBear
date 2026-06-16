import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { ArrowRight, Radio, ShieldCheck, Sparkles, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RaffleCountdown } from '@/components/home/raffle-countdown'
import { formatArgentinaDate } from '@/lib/date'

const floatingBalls = [
  { number: 7, className: 'left-[54%] top-24 border-white/10 bg-zinc-950 text-amber-300' },
  { number: 21, className: 'right-[9%] top-36 border-white/10 bg-zinc-950 text-amber-300' },
  { number: 45, className: 'left-[52%] bottom-24 border-white/10 bg-zinc-950 text-amber-300' },
  { number: 88, className: 'right-[11%] bottom-28 border-white/10 bg-zinc-950 text-amber-300' },
]

interface HeroSectionProps {
  raffleName?: string | null
  firstPrize?: string
  hasActiveRaffle?: boolean
  nextDrawDate?: string | null
}

export function HeroSection({ raffleName, hasActiveRaffle = true, nextDrawDate }: HeroSectionProps) {
  const nextDraw = formatArgentinaDate(nextDrawDate)
  const badgeLabel = hasActiveRaffle ? raffleName || 'Bingo digital en vivo' : 'Bingo digital en vivo'
  const headline = 'Tu suerte empieza aquí.'
  const copy = hasActiveRaffle
    ? 'Compra tu carton, mira el sorteo en vivo y recibi el aviso si ganas. Simple, transparente y 100% digital.'
    : `En este momento no hay sorteos activos. Aguarda la fecha del proximo sorteo y revisa los resultados publicados.${nextDrawDate ? ` Proxima fecha: ${nextDraw}.` : ''}`

  return (
    <section className="relative isolate w-full overflow-hidden pb-8 pt-4 sm:pt-8">
      <div className="absolute inset-0 -z-10 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:46px_46px]" />
      <Image
        src="/brand/confetti-coins.svg"
        alt=""
        width={820}
        height={480}
        priority
        className="pointer-events-none absolute -right-56 top-10 -z-10 hidden w-[42rem] opacity-25 mix-blend-screen lg:block"
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {floatingBalls.map((ball) => (
          <BingoBall key={ball.number} number={ball.number} className={ball.className} />
        ))}
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        <div className="lbb-scroll-reveal relative grid items-center gap-6 lg:min-h-[34rem] lg:grid-cols-[minmax(0,0.92fr)_minmax(24rem,1fr)]">
          <div className="pointer-events-none absolute left-0 top-20 hidden select-none font-mono text-[13rem] font-bold leading-none text-white/[0.025] lg:block">
            LUCKY
          </div>

          <div className="relative z-10 flex min-w-0 flex-col justify-center text-center lg:text-left">
            <h1 className="sr-only">Lucky Bingo Bear</h1>
            <p className="mb-5 inline-flex h-10 w-fit items-center gap-2 self-center rounded-full border border-[#04f77c]/25 bg-[#04f77c]/12 px-4 text-xs font-bold uppercase tracking-[0.16em] text-[#04f77c] lg:self-start">
              <Sparkles className="h-4 w-4" />
              {badgeLabel}
            </p>
            <h2 className="mx-auto max-w-[42rem] text-balance font-mono text-5xl font-bold leading-[0.94] tracking-normal text-white sm:text-6xl lg:mx-0 lg:text-7xl xl:text-8xl">
              {headline}
            </h2>
            <p className="mx-auto mt-6 max-w-[38rem] text-balance text-base leading-7 text-slate-300 lg:mx-0 sm:text-lg">
              {copy}
            </p>

            {hasActiveRaffle && nextDrawDate ? (
              <div className="mt-8 flex justify-center lg:justify-start">
                <RaffleCountdown drawDate={nextDrawDate} raffleName={raffleName} />
              </div>
            ) : null}

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
              {hasActiveRaffle ? (
                <Button
                  asChild
                  size="lg"
                  className="h-13 w-full rounded-full bg-amber-300 px-7 text-base font-bold text-zinc-950 shadow-xl shadow-amber-500/20 hover:bg-amber-200 sm:w-auto"
                >
                  <Link href="/participar">
                    Participar ahora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="h-13 w-full rounded-full bg-amber-300 px-7 text-base font-bold text-zinc-950 shadow-xl shadow-amber-500/20 hover:bg-amber-200 sm:w-auto"
                >
                  <Link href="/ganadores">
                    Ver ultimo sorteo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-13 w-full rounded-full border-white/20 bg-black/30 px-7 text-base font-bold text-white hover:border-amber-300 hover:bg-amber-300/10 hover:text-amber-200 sm:w-auto"
              >
                <Link href="/en-vivo">
                  <Radio className="mr-2 h-4 w-4" />
                  {hasActiveRaffle ? 'Ver sorteo' : 'Ver resultados'}
                </Link>
              </Button>
            </div>

            <div className="mt-8 grid w-full max-w-2xl gap-2 min-[560px]:grid-cols-3">
              <TrustPill icon={<ShieldCheck className="h-4 w-4" />} label="Aviso WhatsApp" />
              <TrustPill icon={<Ticket className="h-4 w-4" />} label="Carton automatico" />
              <TrustPill icon={<Radio className="h-4 w-4" />} label="Resultado publico" />
            </div>
          </div>

          <div className="relative z-10 flex min-h-[24rem] items-center justify-center sm:min-h-[30rem] lg:min-h-[34rem]">
            <div className="absolute inset-0 -z-10 mx-auto my-auto h-2/3 w-2/3 rounded-full bg-amber-300/15 blur-3xl" />
            <Image
              src="/brand/banner-logo-main.png"
              alt="Lucky Bingo Bear"
              width={900}
              height={900}
              priority
              className="lbb-float h-[22rem] w-[22rem] object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-[1.03] sm:h-[31rem] sm:w-[31rem] lg:h-[36rem] lg:w-[36rem]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function TrustPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="lbb-soft-transition flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-sm font-medium leading-tight text-slate-100 hover:border-amber-300/45 hover:bg-amber-300/10">
      <span className="shrink-0 text-[#04f77c]">{icon}</span>
      <span className="min-w-0">{label}</span>
    </div>
  )
}

function BingoBall({ number, className }: { number: number; className: string }) {
  return (
    <div
      className={`absolute hidden h-14 w-14 animate-bounce items-center justify-center rounded-full border text-sm font-bold shadow-2xl md:flex ${className}`}
      style={{ animationDuration: `${3 + (number % 4) * 0.35}s` }}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-amber-300">{number}</span>
    </div>
  )
}
