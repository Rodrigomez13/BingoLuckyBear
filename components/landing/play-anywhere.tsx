import { Smartphone, Apple, Globe, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const platforms = [
  { icon: Smartphone, label: 'Android' },
  { icon: Apple, label: 'iOS' },
  { icon: Globe, label: 'Web' },
]

export function PlayAnywhere() {
  return (
    <section
      id="contacto"
      className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 bg-slate-950"
    >
      <div>
        <h2 className="font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-balance sm:text-5xl">
          <span className="block text-emerald-50">Jugá Truco</span>
          <span className="block text-yellow-500">donde quieras</span>
        </h2>
        <p className="mt-5 max-w-sm text-base leading-relaxed text-emerald-100/70">
          En tu celular, tablet o computadora. Siempre conectado, siempre
          divertido.
        </p>

        <ul className="mt-8 flex gap-4">
          {platforms.map((p) => (
            <li
              key={p.label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-700/50 bg-emerald-950/30 px-6 py-4"
            >
              <p.icon className="h-6 w-6 text-yellow-500" aria-hidden="true" />
              <span className="text-xs font-medium text-emerald-100/70">
                {p.label}
              </span>
            </li>
          ))}
        </ul>

        <Button asChild className="mt-8 bg-yellow-500 font-semibold text-slate-950 hover:bg-yellow-600">
          <Link href="/truco">
            Jugar ahora
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="relative hidden items-center justify-center lg:flex">
        <div className="relative h-96 w-full rounded-2xl border border-emerald-700/50 bg-emerald-950/30 p-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-emerald-100/50">
              <Smartphone className="mx-auto mb-4 h-12 w-12" />
              <p className="text-sm">Disponible en todas las plataformas</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
