import Link from 'next/link'
import { ClipboardCheck, ExternalLink, History, Radio, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const trustItems = [
  {
    title: 'Sorteo visible',
    copy: 'La pantalla en vivo muestra cuenta regresiva, ultimo numero, bolillero y cartones participantes.',
    icon: Radio,
  },
  {
    title: 'Resultados publicos',
    copy: 'Los sorteos finalizados quedan publicados con ganador, carton y numeros cantados.',
    icon: History,
  },
  {
    title: 'Registro exportable',
    copy: 'El panel admin mantiene participantes, comprobantes y cartones en una vista operativa.',
    icon: ClipboardCheck,
  },
]

export function TrustSection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-emerald-400/20 bg-zinc-950/70 p-5 shadow-xl shadow-black/20 sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                <ShieldCheck className="h-4 w-4" />
                Transparencia
              </div>
              <h2 className="text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
                Confianza antes, durante y despues del sorteo
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                La experiencia no termina al pedir el carton: el jugador puede seguir el vivo y revisar resultados cuando lo necesite.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Button asChild className="bg-amber-400 font-semibold text-zinc-950 hover:bg-amber-300">
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

              <div className="grid auto-rows-fr gap-4 md:grid-cols-3">
              {trustItems.map((item) => {
                const Icon = item.icon

                return (
                  <div key={item.title} className="h-full rounded-lg border border-white/10 bg-white/[0.04] p-5">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-emerald-400/15 text-emerald-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold tracking-tight text-white">
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
