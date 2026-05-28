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
    <section id="como-funciona" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 grid gap-4 lg:grid-cols-[0.8fr_1fr] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-black uppercase text-amber-300">Flujo</p>
            <h2
              className="text-4xl font-black leading-tight text-white md:text-5xl"
              style={{ fontFamily: 'var(--font-fredoka)' }}
            >
              Cuatro pasos, sin vueltas
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-relaxed text-zinc-300 lg:justify-self-end">
            El recorrido separa decision, pago, carton y sorteo para que cada participante sepa exactamente donde esta.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => {
            const Icon = item.icon

            return (
              <Card
                key={item.step}
                className="relative overflow-hidden border-zinc-800 bg-zinc-950/80 text-zinc-100 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-lg"
              >
                <div className="absolute right-4 top-3 text-5xl font-black text-white/[0.05]">{item.step}</div>
                <CardContent className="p-6">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-amber-400 text-zinc-950">
                    <Icon className="h-7 w-7" />
                  </div>
                  <p className="mb-2 text-xs font-black uppercase text-amber-300">Paso {item.step}</p>
                  <h3 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-fredoka)' }}>
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">{item.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
