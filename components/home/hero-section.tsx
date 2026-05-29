import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { ArrowRight, CalendarDays, CheckCircle2, Radio, ShieldCheck, Ticket, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatMoneyAmount, getPrizeAmounts } from '@/lib/bingo'
import { HeroCountdown } from './hero-countdown'

interface HeroRaffle {
  name: string
  prize?: string | null
  additional_prizes?: string[] | null
  amount?: string | null
  draw_date?: string | null
  draw_status?: 'idle' | 'running' | 'finished' | null
  bundle_offers?: string[] | null
}

interface HeroSectionProps {
  raffle: HeroRaffle | null
}

const floatingBalls = [
  { number: 7, className: 'left-[6%] top-24 bg-red-500' },
  { number: 21, className: 'right-[7%] top-32 bg-amber-400 text-zinc-950' },
  { number: 45, className: 'left-[14%] bottom-24 bg-emerald-500' },
  { number: 88, className: 'right-[11%] bottom-16 bg-sky-500' },
]

export function HeroSection({ raffle }: HeroSectionProps) {
  const prizeAmounts = raffle ? getPrizeAmounts(raffle.prize, raffle.additional_prizes) : []
  const firstPrize = prizeAmounts[0]
  const cardPrice = raffle?.amount ? formatMoneyAmount(raffle.amount) : null
  const isLive = raffle?.draw_status === 'running'
  const drawDate = raffle?.draw_date ? new Date(raffle.draw_date) : null
  const hasValidDate = drawDate && !Number.isNaN(drawDate.getTime())

  return (
    <section className="relative isolate w-full overflow-hidden border-b border-white/10">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(251,191,36,0.14),transparent_34%),linear-gradient(245deg,rgba(14,165,233,0.16),transparent_30%),linear-gradient(0deg,rgba(16,185,129,0.1),transparent_46%)]" />
      <div className="absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:44px_44px]" />
      <Image
        src="/brand/confetti-coins.svg"
        alt=""
        width={820}
        height={480}
        priority
        className="pointer-events-none absolute -right-56 top-0 -z-10 hidden w-[42rem] opacity-20 mix-blend-screen lg:block"
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {floatingBalls.map((ball) => (
          <BingoBall key={ball.number} number={ball.number} className={ball.className} />
        ))}
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-8">
        {/* Left: message + CTA */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          {/* Status badge */}
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
              isLive
                ? 'border-red-400/40 bg-red-500/15 text-red-200'
                : 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200'
            }`}
          >
            <span className={`h-2 w-2 animate-pulse rounded-full ${isLive ? 'bg-red-400' : 'bg-emerald-400'}`} />
            {isLive ? 'Sorteo en vivo ahora' : raffle ? 'Sorteo activo - cupos abiertos' : 'Proximamente'}
          </span>

          <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
            {firstPrize ? (
              <>
                Gana <span className="text-amber-300">{firstPrize}</span> con tu carton de bingo
              </>
            ) : (
              <>
                Jugá al bingo y ganá <span className="text-amber-300">premios reales</span>
              </>
            )}
          </h1>

          <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-zinc-300 sm:text-lg">
            {raffle?.name ? (
              <>
                Participa en <span className="font-semibold text-white">{raffle.name}</span>. Compra tu carton digital,
                recibi tu codigo LBB y segui cada bolilla en vivo.
              </>
            ) : (
              <>Compra tu carton digital, recibi tu codigo LBB y segui cada bolilla en vivo, sin complicaciones.</>
            )}
          </p>

          {/* Key facts strip */}
          <dl className="mt-7 grid w-full max-w-md grid-cols-2 gap-3 sm:max-w-xl sm:grid-cols-3">
            <FactCard
              icon={<Trophy className="h-4 w-4" />}
              label="Premio mayor"
              value={firstPrize ?? 'A confirmar'}
              highlight
            />
            <FactCard icon={<Ticket className="h-4 w-4" />} label="Precio del carton" value={cardPrice ?? 'Ver datos'} />
            <FactCard
              icon={<CalendarDays className="h-4 w-4" />}
              label="Fecha del sorteo"
              value={
                hasValidDate
                  ? drawDate!.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
                  : 'A confirmar'
              }
            />
          </dl>

          {/* CTAs */}
          <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="h-12 w-full bg-gradient-to-r from-amber-400 to-orange-500 px-7 text-base font-bold text-zinc-950 shadow-xl shadow-amber-500/25 transition-transform hover:scale-[1.02] hover:from-amber-300 hover:to-orange-400 sm:w-auto"
            >
              <Link href="/participar">
                <Ticket className="mr-2 h-5 w-5" />
                Participar ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 w-full border-white/20 bg-white/5 px-6 text-base font-semibold text-white hover:bg-white/10 sm:w-auto"
            >
              <Link href="/en-vivo">
                <Radio className="mr-2 h-5 w-5" />
                Ver sorteo en vivo
              </Link>
            </Button>
          </div>

          {/* Trust line */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-zinc-400 lg:justify-start">
            <TrustItem icon={<ShieldCheck className="h-4 w-4 text-emerald-300" />} label="Pago verificado" />
            <TrustItem icon={<Ticket className="h-4 w-4 text-amber-300" />} label="Carton unico por jugador" />
            <TrustItem icon={<Radio className="h-4 w-4 text-sky-300" />} label="Sorteo 100% online" />
          </div>
        </div>

        {/* Right: prize / countdown card */}
        <div className="w-full">
          <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-amber-300/25 bg-zinc-950/70 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-7">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-200">
                {isLive ? 'Jugando ahora' : 'Premio mayor en juego'}
              </p>
              <Image src="/logo-solo.svg" alt="" width={36} height={36} className="h-9 w-9" />
            </div>

            <p className="mt-3 text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {firstPrize ?? 'Gran premio'}
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {raffle?.name ?? 'Sorteo de bingo Lucky Bingo Bear'}
            </p>

            {/* Countdown */}
            {hasValidDate && !isLive && (
              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">El sorteo arranca en</p>
                <HeroCountdown targetDate={raffle!.draw_date!} />
              </div>
            )}

            {/* All prizes preview */}
            {prizeAmounts.length > 1 && (
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-center"
                  >
                    <span className="block text-[10px] font-semibold uppercase text-amber-200">Premio {index + 1}</span>
                    <span className="mt-0.5 block truncate text-sm font-bold text-white">
                      {prizeAmounts[index] ?? '--'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Price highlight */}
            {cardPrice && (
              <div className="mt-5 flex items-center justify-between rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3">
                <span className="text-sm font-medium text-emerald-100">Carton desde</span>
                <span className="text-xl font-bold text-white">{cardPrice}</span>
              </div>
            )}

            <Button
              asChild
              className="mt-5 h-12 w-full bg-gradient-to-r from-amber-400 to-orange-500 text-base font-bold text-zinc-950 hover:from-amber-300 hover:to-orange-400"
            >
              <Link href="/participar">
                Conseguir mi carton
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function FactCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: ReactNode
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-1 rounded-xl border p-3 text-left ${
        highlight ? 'border-amber-300/30 bg-amber-400/10' : 'border-white/10 bg-white/[0.04]'
      }`}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        <span className={highlight ? 'text-amber-300' : 'text-zinc-400'}>{icon}</span>
        {label}
      </span>
      <span className="truncate text-base font-bold text-white">{value}</span>
    </div>
  )
}

function TrustItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      {label}
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/70" />
    </span>
  )
}

function BingoBall({ number, className }: { number: number; className: string }) {
  return (
    <div
      className={`absolute hidden h-12 w-12 animate-bounce items-center justify-center rounded-full text-sm font-bold text-white shadow-xl xl:flex ${className}`}
      style={{ animationDuration: `${3 + (number % 4) * 0.35}s` }}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-950">{number}</span>
    </div>
  )
}
