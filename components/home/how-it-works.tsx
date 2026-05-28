import { CreditCard, FileCheck2, Radio, TicketCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const steps = [
  {
    step: '01',
    title: 'Elegis el sorteo',
    description: 'Ves el premio activo, el monto y la informacion clave antes de avanzar.',
    icon: TicketCheck,
  },
  {
    step: '02',
    title: 'Envias el pago',
    description: 'Completas tus datos y adjuntas el comprobante desde una pantalla simple.',
    icon: CreditCard,
  },
  {
    step: '03',
    title: 'Recibis tu carton',
    description: 'La app genera un carton digital con codigo LBB para identificar tu jugada.',
    icon: FileCheck2,
  },
  {
    step: '04',
    title: 'Seguis el vivo',
    description: 'Miras las bolillas cantadas y despues consultas los ganadores publicados.',
    icon: Radio,
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 grid gap-4 lg:grid-cols-[0.8fr_1fr] lg:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-300">Flujo</p>
            <h2
              className="text-2xl font-semibold leading-tight tracking-tight text-white md:text-3xl"
            >
              Cuatro pasos, sin vueltas
            </h2>
          </div>
          <p className="w-full max-w-[22rem] min-w-0 text-sm leading-relaxed text-zinc-300 sm:max-w-2xl sm:text-base lg:justify-self-end">
            El recorrido separa decision, pago, carton y sorteo para que cada participante sepa exactamente donde esta.
          </p>
        </div>

        <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => {
            const Icon = item.icon

            return (
              <Card
                key={item.step}
                className="relative h-full overflow-hidden border-zinc-800 bg-zinc-950/80 text-zinc-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/50 hover:shadow-md"
              >
                <div className="absolute right-4 top-3 text-4xl font-semibold text-white/[0.04]">{item.step}</div>
                <CardContent className="flex h-full flex-col p-5">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-amber-400 text-zinc-950">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-amber-300">Paso {item.step}</p>
                  <h3 className="min-w-0 break-words text-base font-semibold tracking-tight text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 min-w-0 break-words text-sm leading-relaxed text-zinc-400">{item.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
