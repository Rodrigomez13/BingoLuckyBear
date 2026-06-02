import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { ArrowRight, CheckCircle2, Radio, ShieldCheck, Ticket, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'

const floatingBalls = [
  { number: 7, className: 'left-[7%] top-28 bg-red-500' },
  { number: 21, className: 'right-[8%] top-36 bg-amber-400 text-zinc-950' },
  { number: 45, className: 'left-[18%] bottom-28 bg-emerald-500' },
  { number: 88, className: 'right-[13%] bottom-20 bg-sky-500' },
]

export function HeroSection({ raffleName, firstPrize }: { raffleName?: string | null; firstPrize?: string }) {
  return (
    <section className="relative isolate w-full overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:46px_46px]" />
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

      <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        <div className="lbb-hero-panel lbb-scroll-reveal relative grid overflow-hidden rounded-xl min-[560px]:grid-cols-[minmax(0,1fr)_18rem] lg:min-h-[31rem] lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
          <Image
            src="/brand/banner-bg-overlay.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="pointer-events-none object-cover opacity-30 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.92),rgba(0,0,0,0.62)_48%,rgba(4,247,124,0.12))]" />

          <div className="relative z-10 flex min-w-0 flex-col justify-center p-5 text-center min-[560px]:text-left sm:p-8 lg:p-10">
            <h1 className="sr-only">Lucky Bingo Bear</h1>
            <p className="mb-4 inline-flex h-8 w-fit items-center gap-2 self-center rounded border border-[#04f77c]/45 bg-[#04f77c] px-3 text-xs font-bold uppercase tracking-wide text-zinc-950 min-[560px]:self-start">
              <Trophy className="h-4 w-4" />
              {raffleName || 'Sorteo activo'}
            </p>
            <h2 className="mx-auto max-w-[42rem] text-balance font-mono text-3xl font-bold leading-[1.02] tracking-normal text-white min-[560px]:mx-0 sm:text-4xl lg:text-5xl">
              Compra tu carton y espera el aviso si ganas.
            </h2>
            <p className="mx-auto mt-4 max-w-[38rem] text-balance text-sm leading-6 text-slate-300 min-[560px]:mx-0 sm:text-base">
              Tu carton participa automaticamente. No necesitas marcar bolillas: si tu jugada sale premiada,
              te avisamos por WhatsApp y coordinamos el pago con los datos que cargaste.
            </p>

            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row min-[560px]:items-start">
              <Button
                asChild
                size="lg"
                className="h-12 w-full rounded bg-[#04f77c] px-6 text-base font-bold text-zinc-950 hover:bg-[#30e17b] sm:w-auto"
              >
                <Link href="/participar">
                  Participar ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 w-full rounded border-white/30 bg-black/20 px-6 text-base font-bold text-white hover:border-[#04f77c] hover:bg-[#04f77c]/10 hover:text-[#04f77c] sm:w-auto"
              >
                <Link href="/en-vivo">
                  <Radio className="mr-2 h-4 w-4" />
                  Ver sorteo
                </Link>
              </Button>
            </div>

            <div className="mt-7 grid w-full max-w-2xl gap-2 min-[560px]:grid-cols-3">
              <TrustPill icon={<ShieldCheck className="h-4 w-4" />} label="Aviso por WhatsApp" />
              <TrustPill icon={<Ticket className="h-4 w-4" />} label="Carton automatico" />
              <TrustPill icon={<Radio className="h-4 w-4" />} label="Resultado publicado" />
            </div>
          </div>

          <div className="relative z-10 flex min-h-[14rem] flex-col justify-end p-5 sm:min-h-[16rem] sm:p-6 lg:min-h-[20rem] lg:p-8">
            <Image
              src="/brand/banner-logo-main.png"
              alt="Lucky Bingo Bear"
              width={900}
              height={900}
              priority
              className="absolute left-1/2 top-4 h-28 w-28 -translate-x-1/2 object-contain drop-shadow-2xl sm:h-36 sm:w-36 lg:left-[45%] lg:top-8 lg:h-64 lg:w-64"
            />
            <Image
              src="/brand/banner-logo-lbb.png"
              alt="LBB Lucky Bingo Bear"
              width={900}
              height={900}
              priority
              className="absolute right-5 top-7 hidden h-20 w-28 object-contain opacity-90 drop-shadow-2xl md:block lg:h-24 lg:w-36"
            />
            <div className="relative ml-auto grid w-full max-w-[24rem] gap-2 min-[560px]:grid-cols-1 lg:gap-3">
              <HeroStat label="Premio" value={firstPrize || 'A confirmar'} />
              <HeroStat label="Carton" value="Participa solo" />
              <HeroStat label="Resultado" value="Aviso por WhatsApp" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-20 rounded border border-[#04f77c]/25 bg-black/55 p-3 backdrop-blur">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 break-words font-mono text-lg font-bold leading-6 text-white">{value}</p>
    </div>
  )
}

function TrustPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="lbb-soft-transition flex min-h-10 min-w-0 items-center justify-center gap-2 rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-slate-100 hover:border-[#04f77c]/45 hover:bg-[#04f77c]/10">
      <span className="text-[#04f77c]">{icon}</span>
      <span className="min-w-0 truncate">{label}</span>
      <CheckCircle2 className="h-4 w-4 text-[#04f77c]" />
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
