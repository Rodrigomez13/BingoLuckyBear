import Image from 'next/image'
import { ArrowRight, Users, ShieldCheck, Smartphone, Trophy, Layers, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const features = [
  {
    icon: Users,
    title: 'Mesas 1v1 y 2v2',
    desc: 'Partidas rápidas y competitivas',
  },
  {
    icon: ShieldCheck,
    title: '100% Seguro',
    desc: 'Tus datos y créditos siempre protegidos',
  },
  {
    icon: Smartphone,
    title: 'Juega desde cualquier lugar',
    desc: 'En móvil o desktop',
  },
]

const stats = [
  { icon: Users, value: '+50K', label: 'Jugadores activos' },
  { icon: Layers, value: '+12K', label: 'Mesas jugadas hoy' },
  { icon: Trophy, value: '+1M', label: 'Partidas completadas' },
  { icon: Clock, value: '24/7', label: 'Atención al cliente' },
]

export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-slate-950">
      {/* glow */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-[560px] w-[560px] translate-x-1/4 -translate-y-1/4 rounded-full bg-emerald-600/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:py-20 lg:px-8">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            <span className="block text-emerald-50">El mejor</span>
            <span className="block text-yellow-500">Truco online</span>
            <span className="block text-emerald-50">te espera</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-emerald-100/70">
            Mesas reales, apuestas seguras y la mejor experiencia de Truco en
            Argentina.
          </p>

          <ul className="mt-8 flex flex-wrap gap-6">
            {features.map((f) => (
              <li key={f.title} className="flex max-w-[9rem] flex-col gap-2">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-700 bg-emerald-950 text-yellow-500">
                  <f.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-yellow-500">
                  {f.title}
                </span>
                <span className="text-xs leading-snug text-emerald-100/60">
                  {f.desc}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap gap-4">
            <Button
              size="lg"
              asChild
              className="group bg-yellow-500 font-semibold text-slate-950 hover:bg-yellow-600"
            >
              <Link href="/truco">
                Jugar ahora
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-yellow-500/50 bg-transparent text-yellow-500 hover:bg-yellow-500/10"
              asChild
            >
              <a href="#como-jugar">Cómo jugar</a>
            </Button>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-emerald-700/50 shadow-2xl lg:max-w-lg">
            <Image
              src="/luckybear-assets/images/bear-mascot.png"
              alt="Oso mascota de Lucky Bear con corona sosteniendo cartas de Truco"
              width={620}
              height={620}
              priority
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* stats bar */}
      <div className="relative mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-emerald-700/50 bg-emerald-900/10 md:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 bg-slate-900 px-5 py-5"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500">
                <s.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <div className="font-display text-2xl font-bold text-emerald-50">
                  {s.value}
                </div>
                <div className="text-xs text-emerald-100/60">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
