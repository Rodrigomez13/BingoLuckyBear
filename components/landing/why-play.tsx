import { Table2, Coins, Scale, Users, Crown } from 'lucide-react'

const benefits = [
  {
    icon: Table2,
    title: 'Mesas para todos',
    desc: 'Elegí entre mesas 1v1 o 2v2 con apuestas a tu medida.',
  },
  {
    icon: Coins,
    title: 'Sistema de créditos',
    desc: 'Jugá con créditos reales, con depósitos y retiros rápidos.',
  },
  {
    icon: Scale,
    title: 'Juego justo',
    desc: 'Sistema antitrampas y partidas 100% transparentes.',
  },
  {
    icon: Users,
    title: 'Comunidad activa',
    desc: 'Miles de jugadores online todos los días. ¡Siempre hay mesa!',
  },
]

export function WhyPlay() {
  return (
    <section
      id="beneficios"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 bg-slate-950"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-yellow-500">
          Por qué jugar
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold uppercase tracking-tight text-balance sm:text-4xl text-emerald-50">
          Truco en Lucky Bear
        </h2>
        <p className="mt-3 text-emerald-100/70 text-pretty">
          Todo lo que necesitás para disfrutar del Truco online como nunca antes.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((b) => (
          <div
            key={b.title}
            className="rounded-2xl border border-emerald-700/50 bg-emerald-950/30 p-6 transition-colors hover:border-yellow-500/50"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500">
              <b.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-50">
              <Crown className="h-4 w-4 text-yellow-500" aria-hidden="true" />
              {b.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-emerald-100/70">
              {b.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
