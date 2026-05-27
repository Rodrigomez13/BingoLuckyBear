import Link from 'next/link'
import { ClipboardCheck, ExternalLink, History, Radio, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const trustItems = [
  {
    title: 'Sorteo visible',
    copy: 'La pantalla en vivo muestra cuenta regresiva, ultimo numero, bolillero y cantidad de cartones.',
    icon: Radio,
  },
  {
    title: 'Resultados publicos',
    copy: 'Los sorteos finalizados quedan disponibles con ganador, carton y numeros cantados.',
    icon: History,
  },
  {
    title: 'Registro exportable',
    copy: 'El panel admin permite descargar participantes para respaldo y control operativo.',
    icon: ClipboardCheck,
  },
]

export function TrustSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-emerald-400/20 bg-zinc-950/70 p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-sm font-semibold text-emerald-200">
                <ShieldCheck className="h-4 w-4" />
                Transparencia
              </div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl" style={{ fontFamily: 'var(--font-fredoka)' }}>
                Mas confianza antes, durante y despues del sorteo
              </h2>
              <p className="mt-3 text-zinc-300">
                La experiencia no termina al pedir el carton: ahora hay caminos claros para mirar el sorteo y revisar resultados.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Button asChild className="bg-amber-400 font-bold text-zinc-950 hover:bg-amber-300">
                  <Link href="/en-vivo">
                    <Radio className="mr-2 h-4 w-4" />
                    Ver en vivo
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-amber-400/40 bg-transparent text-amber-200 hover:bg-amber-400/10">
                  <Link href="/ganadores">
                    Ganadores
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {trustItems.map((item) => {
                const Icon = item.icon

                return (
                  <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-emerald-400/15 text-emerald-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-fredoka)' }}>
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.copy}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
