import Link from 'next/link'
import { ClipboardCheck, ExternalLink, History, Radio, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const trustItems = [
  {
    title: 'Sorteo visible',
    copy: 'Podes mirar la cuenta regresiva, las bolillas y los premios pendientes desde la pantalla en vivo.',
    icon: Radio,
  },
  {
    title: 'Resultados publicos',
    copy: 'Cada sorteo cerrado queda como referencia con ganadores, cartones, montos y numeros cantados.',
    icon: History,
  },
  {
    title: 'Pago coordinado',
    copy: 'Si ganas, usamos los datos de cobro que cargaste para avisarte y avanzar con el pago.',
    icon: ClipboardCheck,
  },
]

export function TrustSection() {
  return (
    <section className="lbb-scroll-reveal py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lbb-surface rounded-xl p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-center">
            <div>
              <div className="mb-3 inline-flex h-8 items-center gap-2 rounded border border-[#04f77c]/35 bg-[#04f77c]/10 px-3 text-xs font-bold uppercase tracking-wide text-[#04f77c]">
                <ShieldCheck className="h-4 w-4" />
                Transparencia
              </div>
              <h2 className="text-2xl font-bold leading-tight tracking-normal text-white sm:text-3xl">
                Resultados claros para todos
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                El sorteo no termina en el vivo: despues queda publicado para que puedas revisar quien gano y con que carton.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Button asChild className="h-9 rounded bg-[#04f77c] px-4 text-sm font-bold text-zinc-950 hover:bg-[#30e17b]">
                  <Link href="/en-vivo">
                    <Radio className="mr-2 h-4 w-4" />
                Ir al vivo
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-9 rounded border-white/20 bg-transparent px-4 text-sm font-bold text-white hover:border-[#04f77c] hover:text-[#04f77c]">
                  <Link href="/ganadores">
                    Ganadores
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

              <div className="grid auto-rows-fr gap-4 min-[520px]:grid-cols-2 md:grid-cols-3">
              {trustItems.map((item) => {
                const Icon = item.icon

                return (
                  <div key={item.title} className="lbb-compact-card h-full p-4 transition-all duration-300 hover:border-[#04f77c]/60">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded bg-[#04f77c]/15 text-[#04f77c]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold leading-6 tracking-normal text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.copy}</p>
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
