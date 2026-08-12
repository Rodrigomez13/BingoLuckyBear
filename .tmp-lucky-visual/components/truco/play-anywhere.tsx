import { Smartphone, Apple, Globe, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const platforms = [
  { icon: Smartphone, label: 'Android' },
  { icon: Apple, label: 'iOS' },
  { icon: Globe, label: 'Web' },
]

function GameTable({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="relative flex h-full w-full items-center justify-center rounded-[999px] border-4 border-primary/40 bg-[radial-gradient(ellipse_at_center,#166534,#052e16)] p-4">
        {/* seats */}
        <span className="absolute left-1/2 top-2 h-6 w-6 -translate-x-1/2 rounded-full bg-primary/70" />
        <span className="absolute bottom-2 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-accent" />
        <span className="absolute left-2 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-primary/50" />
        <span className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-primary/50" />
        {/* cards */}
        <div className="flex gap-1">
          <span className="h-9 w-6 rotate-[-12deg] rounded-sm bg-card shadow" />
          <span className="h-9 w-6 rounded-sm bg-card shadow" />
          <span className="h-9 w-6 rotate-[12deg] rounded-sm bg-card shadow" />
        </div>
      </div>
    </div>
  )
}

export function PlayAnywhere() {
  return (
    <section
      id="contacto"
      className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8"
    >
      <div>
        <h2 className="font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-balance sm:text-5xl">
          <span className="block text-foreground">Jugá Truco</span>
          <span className="block text-primary">donde quieras</span>
        </h2>
        <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground">
          En tu celular, tablet o computadora. Siempre conectado, siempre
          divertido.
        </p>

        <ul className="mt-8 flex gap-4">
          {platforms.map((p) => (
            <li
              key={p.label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-6 py-4"
            >
              <p.icon className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="text-xs font-medium text-muted-foreground">
                {p.label}
              </span>
            </li>
          ))}
        </ul>

        <Button
          size="lg"
          className="group mt-8 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Jugar ahora
          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      {/* device mockups */}
      <div className="relative flex items-center justify-center">
        {/* laptop */}
        <div className="w-full max-w-lg">
          <div className="rounded-t-xl border-4 border-b-0 border-secondary bg-popover p-3">
            <div className="mb-2 flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-border" />
              <span className="h-2 w-2 rounded-full bg-border" />
              <span className="h-2 w-2 rounded-full bg-border" />
            </div>
            <GameTable className="h-44 sm:h-52" />
          </div>
          <div className="h-3 rounded-b-lg bg-secondary" />
          <div className="mx-auto h-1.5 w-1/3 rounded-b-lg bg-secondary/70" />
        </div>

        {/* phone */}
        <div className="absolute -bottom-4 left-0 w-32 rounded-[1.5rem] border-4 border-secondary bg-popover p-2 shadow-2xl sm:w-40">
          <div className="rounded-[1rem] bg-background p-2">
            <div className="mb-2 text-center">
              <div className="text-[10px] font-semibold text-foreground">
                Mesa del Osos
              </div>
              <div className="text-[9px] text-primary">2v2 · 100</div>
            </div>
            <GameTable className="h-24 sm:h-28" />
            <Button className="mt-2 h-6 w-full bg-accent text-[9px] font-semibold text-accent-foreground hover:bg-accent/90">
              Ir a la mesa
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
