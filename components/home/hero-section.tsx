import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { ArrowRight, Gamepad2, Radio, ShieldCheck, Sparkles, Ticket, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RaffleCountdown } from '@/components/home/raffle-countdown'
import { formatArgentinaDate } from '@/lib/date'

const floatingTokens = [
  { label: 'TRUCO', className: 'left-[54%] top-24 border-emerald-300/20 bg-zinc-950 text-emerald-300' },
  { label: 'BINGO', className: 'right-[9%] top-36 border-amber-300/20 bg-zinc-950 text-amber-300' },
  { label: 'SLOTS', className: 'left-[52%] bottom-24 border-sky-300/20 bg-zinc-950 text-sky-300' },
  { label: 'LBB', className: 'right-[11%] bottom-28 border-white/10 bg-zinc-950 text-amber-300' },
]

interface HeroSectionProps {
  raffleName?: string | null
  firstPrize?: string
  hasActiveRaffle?: boolean
  nextDrawDate?: string | null
}

export function HeroSection({ raffleName, hasActiveRaffle = true, nextDrawDate }: HeroSectionProps) {
  const nextDraw = formatArgentinaDate(nextDrawDate)

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
        {floatingTokens.map((token) => (
          <GameToken key={token.label} label={token.label} className={token.className} />
        ))}
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        <div className="lbb-scroll-reveal relative grid items-center gap-6 lg:min-h-[34rem] lg:grid-cols-[minmax(0,0.92fr)_minmax(24rem,1fr)]">
          <div className="pointer-events-none absolute left-0 top-20 hidden select-none font-mono text-[13rem] font-bold leading-none text-white/[0.025] lg:block">
            GAMES
          </div>

          <div className="relative z-10 flex min-w-0 flex-col justify-center text-center lg:text-left">
            <h1 className="sr-only">LuckyBingoBear plataforma de juegos</h1>
            <p className="mb-5 inline-flex h-10 w-fit items-center gap-2 self-center rounded-full border border-[#04f77c]/25 bg-[#04f77c]/12 px-4 text-xs font-bold uppercase tracking-[0.16em] text-[#04f77c] lg:self-start">
              <Sparkles className="h-4 w-4" />
              Una cuenta, múltiples juegos
            </p>
            <h2 className="mx-auto max-w-[44rem] text-balance font-mono text-5xl font-bold leading-[0.94] tracking-normal text-white sm:text-6xl lg:mx-0 lg:text-7xl xl:text-8xl">
              Elegí tu juego. Jugá con créditos LBB.
            </h2>
            <p className="mx-auto mt-6 max-w-[38rem] text-balance text-base leading-7 text-slate-300 lg:mx-0 sm:text-lg">
              Bingo, Truco, Slots y futuras experiencias dentro de una misma plataforma. Tu saldo LBB funciona en todos los juegos y queda registrado en una wallet central.
              {hasActiveRaffle && nextDrawDate ? ` Próximo sorteo de Bingo: ${nextDraw}.` : ''}
            </p>

            {hasActiveRaffle && nextDrawDate ? (
              <div className="mt-8 flex justify-center lg:justify-start">
                <RaffleCountdown drawDate={nextDrawDate} raffleName={raffleName || 'Bingo LBB'} />
              </div>
            ) : null}

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
              <Button
                asChild
                size="lg"
                className="h-13 w-full rounded-full bg-amber-300 px-7 text-base font-bold text-zinc-950 shadow-xl shadow-amber-500/20 hover:bg-amber-200 sm:w-auto"
              >
                <Link href="/juegos">
                  Ver juegos
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-13 w-full rounded-full border-white/20 bg-black/30 px-7 text-base font-bold text-white hover:border-amber-300 hover:bg-amber-300/10 hover:text-amber-200 sm:w-auto"
              >
                <Link href="/mi-cuenta/jugador">
                  <WalletCards className="mr-2 h-4 w-4" />
                  Ver saldo LBB
                </Link>
              </Button>
            </div>

            <div className="mt-8 grid w-full max-w-2xl gap-2 min-[560px]:grid-cols-3">
              <TrustPill icon={<WalletCards className="h-4 w-4" />} label="Wallet central" />
              <TrustPill icon={<Gamepad2 className="h-4 w-4" />} label="Múltiples juegos" />
              <TrustPill icon={<ShieldCheck className="h-4 w-4" />} label="Movimientos claros" />
            </div>
          </div>

          <div className="relative z-10 flex min-h-[24rem] items-center justify-center sm:min-h-[30rem] lg:min-h-[34rem]">
            <div className="absolute inset-0 -z-10 mx-auto my-auto h-2/3 w-2/3 rounded-full bg-amber-300/15 blur-3xl" />
            <Image
              src="/brand/banner-logo-main.png"
              alt="LuckyBingoBear plataforma de juegos"
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

function GameToken({ label, className }: { label: string; className: string }) {
  return (
    <div
      className={`absolute hidden h-14 min-w-14 animate-bounce items-center justify-center rounded-full border px-3 text-[10px] font-black uppercase tracking-[0.16em] shadow-2xl md:flex ${className}`}
      style={{ animationDuration: `${3 + label.length * 0.18}s` }}
    >
      {label}
    </div>
  )
}
