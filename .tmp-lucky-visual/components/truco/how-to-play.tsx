import Image from 'next/image'
import { UserPlus, Wallet, LayoutGrid, Trophy, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Cómo jugar
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold uppercase tracking-tight text-balance sm:text-4xl">
          Es fácil, rápido y divertido
        </h2>
        <p className="mt-3 text-muted-foreground text-pretty">
          En 4 simples pasos estás jugando tu primera partida.
        </p>
      </div>

      <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="relative rounded-2xl border border-border bg-card p-6 text-center"
          >
            <span className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
              {i + 1}
            </span>
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <s.icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-primary">
              {s.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {s.desc}
            </p>
          </li>
        ))}
      </ol>

      {/* welcome bonus banner */}
      <div className="mt-12 overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-r from-card via-card to-primary/10">
        <div className="grid items-center gap-6 md:grid-cols-[240px_1fr_auto] md:gap-2">
          <div className="relative hidden items-end justify-center p-4 md:flex">
            <div className="overflow-hidden rounded-2xl border border-primary/20">
              <Image
                src="/images/bear-mascot.png"
                alt="Oso mascota celebrando el bono de bienvenida"
                width={300}
                height={300}
                className="w-52"
              />
            </div>
          </div>

          <div className="px-6 py-8 text-center md:px-2 md:text-left">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Bono de bienvenida
            </p>
            <p className="mt-1 font-display text-4xl font-bold uppercase leading-none text-foreground sm:text-5xl">
              100% Extra
            </p>
            <p className="mt-1 font-display text-lg font-semibold uppercase text-foreground/90">
              En tu primer depósito
            </p>
            <Button
              size="lg"
              className="group mt-6 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Aprovechar ahora
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          <div className="relative hidden items-center justify-center p-4 pr-6 lg:flex">
            <div className="overflow-hidden rounded-2xl border border-primary/20">
              <Image
                src="/images/spanish-cards.png"
                alt="Cartas españolas de Truco"
                width={320}
                height={280}
                className="w-60"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
