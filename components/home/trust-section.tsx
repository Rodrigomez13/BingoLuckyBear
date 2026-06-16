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

const testimonials = [
  {
    quote: 'El aviso por WhatsApp llego al instante y pude ver el resultado publicado. Muy prolijo todo.',
    name: 'Valentina G.',
    date: 'Mayo 2026',
  },
  {
    quote: 'Me gusta que el carton se marque solo. Compre, espere el vivo y despues revise todo en ganadores.',
    name: 'Rodrigo M.',
    date: 'Abril 2026',
  },
  {
    quote: 'La experiencia es simple y clara. Sirve para jugar con amigos aunque estemos en ciudades distintas.',
    name: 'Luciana P.',
    date: 'Abril 2026',
  },
]

export function TrustSection() {
  return (
    <section className="lbb-scroll-reveal py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-center">
            <div>
              <div className="mb-4 inline-flex h-9 items-center gap-2 rounded-full border border-[#04f77c]/25 bg-[#04f77c]/10 px-4 text-xs font-bold uppercase tracking-[0.18em] text-[#04f77c]">
                <ShieldCheck className="h-4 w-4" />
                Transparencia
              </div>
              <h2 className="text-4xl font-bold leading-tight tracking-normal text-white sm:text-5xl">
                Resultados claros para todos
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-400">
                El sorteo no termina en el vivo: despues queda publicado para que puedas revisar quien gano y con que carton.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Button asChild className="h-11 rounded-full bg-amber-300 px-5 text-sm font-bold text-zinc-950 hover:bg-amber-200">
                  <Link href="/en-vivo">
                    <Radio className="mr-2 h-4 w-4" />
                Ir al vivo
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-11 rounded-full border-white/20 bg-transparent px-5 text-sm font-bold text-white hover:border-amber-300 hover:text-amber-200">
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
                  <div key={item.title} className="h-full rounded-[1.2rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/15 transition-all duration-300 hover:border-amber-300/45">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#04f77c]/15 text-[#04f77c]">
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

        <div className="grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">Comunidad</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
              Lo que dicen nuestros jugadores
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <div key={item.name} className="rounded-[1.2rem] border border-white/10 bg-black/30 p-5 shadow-xl shadow-black/15">
                <p className="text-sm leading-6 text-slate-300">&quot;{item.quote}&quot;</p>
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="font-bold text-white">{item.name}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
