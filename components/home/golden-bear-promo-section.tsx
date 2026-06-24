import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Coins, Layers3, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  { icon: Layers3, title: 'Cascadas reales', text: 'Solo desaparecen los símbolos ganadores; el resto cae y abre nuevas combinaciones.' },
  { icon: Sparkles, title: 'Bonus persistente', text: 'Free spins con WILD fijo, multiplicador acumulado y posibilidad de retrigger.' },
  { icon: Coins, title: 'Un solo saldo', text: 'Las apuestas y premios se registran directamente en el saldo general de tu cuenta.' },
]

export function GoldenBearPromoSection() {
  return (
    <section className="relative isolate overflow-hidden py-10 sm:py-14">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_76%_22%,rgba(251,191,36,.16),transparent_30%),radial-gradient(circle_at_18%_76%,rgba(4,247,124,.09),transparent_28%)]" />
      <div className="lbb-scroll-reveal mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(22rem,1.04fr)_minmax(0,.96fr)] lg:px-8">
        <div className="relative min-h-[28rem] overflow-hidden rounded-[2rem] border border-amber-300/25 bg-[#180905] shadow-2xl shadow-black/50">
          <Image
            src="/games/golden-bear/assets/golden-bear-western-bg.webp"
            alt="Golden Bear Megaways de Lucky Bingo Bear"
            fill
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <Image
            src="/games/golden-bear/assets/golden-bear-mascot.webp"
            alt="Oso Golden Bear"
            width={768}
            height={768}
            className="absolute bottom-8 left-1/2 w-[72%] max-w-[28rem] -translate-x-1/2 drop-shadow-[0_28px_35px_rgba(0,0,0,.58)]"
          />
          <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/10 bg-black/65 p-4 backdrop-blur-md sm:inset-x-7 sm:bottom-7">
            <p className="text-[10px] font-black uppercase tracking-[.24em] text-amber-200">Lucky Bingo Bear Originals</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <h3 className="font-mono text-2xl font-black text-white sm:text-3xl">Golden Bear Megaways</h3>
              <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase text-emerald-200">Disponible</span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-center text-center lg:text-left">
          <p className="mb-4 inline-flex w-fit items-center gap-2 self-center rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[.2em] text-amber-200 lg:self-start">
            <Sparkles className="h-4 w-4" /> Slots Lucky Bear
          </p>
          <h2 className="text-balance font-mono text-4xl font-black leading-tight text-white sm:text-5xl">El oso dorado llegó con cascadas y Megaways.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-slate-300 lg:mx-0">
            Jugá desde tu cuenta LuckyBingoBear. Cada giro usa el saldo general y cada premio vuelve a la misma billetera, con historial financiero unificado.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-left transition hover:-translate-y-1 hover:border-amber-300/40 hover:bg-white/[.07]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300 text-zinc-950"><Icon className="h-5 w-5" /></div>
                <h3 className="text-sm font-black text-white">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-400">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button asChild size="lg" className="h-12 rounded-full bg-amber-300 px-7 font-black text-zinc-950 hover:bg-amber-200">
              <Link href="/juegos/golden-bear">Jugar Golden Bear <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <div className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-black/25 px-5 text-sm font-bold text-slate-200">
              <ShieldCheck className="h-4 w-4 text-emerald-300" /> Rondas validadas en servidor
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
