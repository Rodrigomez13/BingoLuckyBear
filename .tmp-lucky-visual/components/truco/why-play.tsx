import { Table2, Coins, Scale, Users, Plus, ArrowRight, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from './logo'

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

const tables = [
  { name: 'Mesa del Osos', type: '2v2', bet: '100', players: '3/4', status: 'En juego' },
  { name: 'Mesa de la Suerte', type: '1v1', bet: '200', players: '1/2', status: 'Esperando' },
  { name: 'Mesa Ganadora', type: '2v2', bet: '500', players: '2/4', status: 'En juego' },
  { name: 'Mesa Pro', type: '1v1', bet: '1.000', players: '1/2', status: 'Esperando' },
]

const sidebarItems = ['Lobby', 'Mis mesas', 'Perfil', 'Mis partidas', 'Tienda', 'Ayuda']

export function WhyPlay() {
  return (
    <section
      id="beneficios"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Por qué jugar
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold uppercase tracking-tight text-balance sm:text-4xl">
          Truco en Lucky Bingo Bear
        </h2>
        <p className="mt-3 text-muted-foreground text-pretty">
          Todo lo que necesitás para disfrutar del Truco online como nunca antes.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((b) => (
          <div
            key={b.title}
            className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <b.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Crown className="h-4 w-4 text-primary" aria-hidden="true" />
              {b.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {b.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Lobby / dashboard mockup */}
      <div
        id="truco"
        className="mt-10 overflow-hidden rounded-3xl border border-border bg-popover shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                R
              </span>
              <div className="text-right leading-tight">
                <div className="text-xs font-medium text-foreground">Rodrigo</div>
                <div className="text-[10px] text-primary">$ 5.250</div>
              </div>
            </div>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 border-border bg-card"
              aria-label="Agregar créditos"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[180px_1fr_200px]">
          {/* sidebar */}
          <aside className="hidden border-r border-border p-3 lg:block">
            <ul className="space-y-1">
              {sidebarItems.map((item, i) => (
                <li key={item}>
                  <span
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      i === 0
                        ? 'bg-accent/15 font-medium text-accent'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </aside>

          {/* tables */}
          <div className="p-4 sm:p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Mesas disponibles
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Mesa</th>
                    <th className="pb-2 pr-3 font-medium">Tipo</th>
                    <th className="pb-2 pr-3 font-medium">Apuesta</th>
                    <th className="pb-2 pr-3 font-medium">Jugadores</th>
                    <th className="pb-2 pr-3 font-medium">Estado</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tables.map((t) => (
                    <tr key={t.name}>
                      <td className="py-3 pr-3 font-medium text-foreground">
                        {t.name}
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">{t.type}</td>
                      <td className="py-3 pr-3 text-foreground">{t.bet}</td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {t.players}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`text-xs ${
                            t.status === 'En juego'
                              ? 'text-accent'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          className="h-7 bg-accent px-4 text-xs font-semibold text-accent-foreground hover:bg-accent/90"
                        >
                          Jugar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* create table panel */}
          <aside className="border-t border-border p-4 lg:border-l lg:border-t-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Crear mesa
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Elegí las opciones y creá tu propia mesa.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Tipo de mesa
                </span>
                <div className="mt-1 flex gap-2">
                  <span className="flex-1 rounded-md border border-border px-3 py-1.5 text-center text-xs text-muted-foreground">
                    1v1
                  </span>
                  <span className="flex-1 rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-center text-xs font-medium text-primary">
                    2v2
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Apuesta
                </span>
                <div className="mt-1 rounded-md border border-border px-3 py-1.5 text-xs text-foreground">
                  100
                </div>
              </div>
              <Button className="w-full bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                Crear mesa
              </Button>
            </div>
          </aside>
        </div>

        {/* tournament banner */}
        <div className="m-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Crown className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <div className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
                Torneo diario
              </div>
              <div className="text-xs text-muted-foreground">
                ¡Participá y ganá increíbles premios!
              </div>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
          >
            Ver más
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
