import Image from 'next/image'
import { UserPlus, Wallet, LayoutGrid, Trophy, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const steps = [
  {
    icon: UserPlus,
    title: 'Registrate',
    desc: 'Creá tu cuenta gratis en segundos.',
  },
  {
    icon: Wallet,
    title: 'Cargá créditos',
    desc: 'Depósitá de forma fácil, segura y rápida.',
  },
  {
    icon: LayoutGrid,
    title: 'Elegí tu mesa',
    desc: 'Seleccioná una mesa o creá la tuya.',
  },
  {
    icon: Trophy,
    title: 'Jugá y ganá',
    desc: 'Demostrá tu habilidad y llevate los premios.',
  },
]

export function HowToPlay() {
  return (
    <section
      id="como-jugar"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 bg-slate-950"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-yellow-500">
          Cómo jugar
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold uppercase tracking-tight text-balance sm:text-4xl text-emerald-50">
          Es fácil, rápido y divertido
        </h2>
        <p className="mt-3 text-emerald-100/70 text-pretty">
          En 4 simples pasos estás jugando tu primera partida.
        </p>
      </div>

      <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="relative rounded-2xl border border-emerald-700/50 bg-emerald-950/30 p-6 text-center"
          >
            <span className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-500 text-sm font-bold text-slate-950">
              {i + 1}
            </span>
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500">
              <s.icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-yellow-500">
              {s.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-emerald-100/70">
              {s.desc}
            </p>
          </li>
        ))}
      </ol>

      {/* welcome bonus banner */}
      <div className="mt-12 overflow-hidden rounded-3xl border border-yellow-500/30 bg-gradient-to-r from-emerald-950/50 via-emerald-950/50 to-yellow-500/10">
        <div className="grid items-center gap-6 md:grid-cols-[240px_1fr_auto] md:gap-2">
          <div className="relative hidden items-end justify-center p-4 md:flex">
            <div className="overflow-hidden rounded-2xl border border-yellow-500/20">
              <Image
                src="/luckybear-assets/images/bear-mascot.png"
                alt="Oso mascota celebrando el bono de bienvenida"
                width={300}
                height={300}
                className="w-52"
              />
            </div>
          </div>

          <div className="px-6 py-8 md:py-10">
            <h3 className="font-display text-3xl font-bold uppercase tracking-tight text-yellow-500 sm:text-4xl">
              Bono de bienvenida
            </h3>
            <p className="mt-2 text-emerald-100/70">
              100% extra en tu primer depósito. Comienza con el doble de créditos
              y maximize tu primera experiencia.
            </p>
            <Button asChild className="mt-4 bg-yellow-500 font-semibold text-slate-950 hover:bg-yellow-600">
              <Link href="/truco">
                Aprovechar ahora
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
