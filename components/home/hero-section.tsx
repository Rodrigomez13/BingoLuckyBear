import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { CheckCircle2, Radio, ShieldCheck, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HeroBannerSequence } from './hero-banner-sequence'

const floatingBalls = [
  { number: 7, className: 'left-[7%] top-28 bg-red-500' },
  { number: 21, className: 'right-[8%] top-36 bg-amber-400 text-zinc-950' },
  { number: 45, className: 'left-[18%] bottom-28 bg-emerald-500' },
  { number: 88, className: 'right-[13%] bottom-20 bg-sky-500' },
]

export function HeroSection() {
  return (
    <section className="relative isolate w-full overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(251,191,36,0.14),transparent_34%),linear-gradient(245deg,rgba(14,165,233,0.16),transparent_30%),linear-gradient(0deg,rgba(16,185,129,0.1),transparent_46%)]" />
      <div className="absolute inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:44px_44px]" />
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

      <HeroBannerSequence />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-7 overflow-hidden px-4 py-9 text-center sm:px-6 md:py-12 lg:px-8">
        <div className="w-full min-w-0">
          <h1 className="sr-only">Lucky Bingo Bear</h1>
          <p className="mx-auto w-full max-w-[20rem] text-balance text-base leading-relaxed text-zinc-200 sm:max-w-[44rem] sm:text-lg">
            Compra tu carton digital, recibi tu codigo LBB y segui cada bolilla desde una experiencia clara, rapida y
            lista para compartir.
          </p>

          <div className="mx-auto mt-6 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
            <TrustPill icon={<ShieldCheck className="h-4 w-4" />} label="Pago verificado" />
            <TrustPill icon={<Ticket className="h-4 w-4" />} label="Carton unico" />
            <TrustPill icon={<Radio className="h-4 w-4" />} label="Sorteo online" />
          </div>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 border border-white/20 bg-white/5 px-5 text-sm font-semibold text-white hover:bg-white/10"
            >
              <Link href="/en-vivo">
                <Radio className="mr-2 h-4 w-4" />
                Ver sorteo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrustPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-medium text-zinc-100">
      <span className="text-emerald-300">{icon}</span>
      <span className="min-w-0 truncate">{label}</span>
      <CheckCircle2 className="h-4 w-4 text-amber-300" />
    </div>
  )
}

function BingoBall({ number, className }: { number: number; className: string }) {
  return (
    <div
      className={`absolute hidden h-12 w-12 animate-bounce items-center justify-center rounded-full text-sm font-bold text-white shadow-xl md:flex ${className}`}
      style={{ animationDuration: `${3 + (number % 4) * 0.35}s` }}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-950">{number}</span>
    </div>
  )
}
