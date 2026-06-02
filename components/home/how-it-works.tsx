import { CreditCard, FileCheck2, Radio } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const steps = [
  {
    step: '01',
    title: 'Compras tu carton',
    description: 'Elegis el sorteo, cargas tus datos y adjuntas el comprobante para quedar participando.',
    icon: CreditCard,
  },
  {
    step: '02',
    title: 'Tu jugada se marca sola',
    description: 'Cuando el sorteo inicia, las bolillas se aplican automaticamente a tu carton.',
    icon: FileCheck2,
  },
  {
    step: '03',
    title: 'Te avisamos si ganas',
    description: 'Si tu carton sale premiado, recibis un WhatsApp con el premio, el monto y los datos del pago.',
    icon: Radio,
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="lbb-scroll-reveal py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-4 border-b border-[#04f77c]/35 pb-4 lg:grid-cols-[0.8fr_1fr] lg:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#04f77c]">Como participar</p>
            <h2
              className="text-2xl font-bold leading-tight tracking-normal text-white md:text-3xl"
            >
              Jugar es simple
            </h2>
          </div>
          <p className="w-full max-w-[22rem] min-w-0 text-sm leading-6 text-slate-400 sm:max-w-2xl lg:justify-self-end">
            Compras tu carton una vez y el sistema se encarga de seguir la jugada hasta el resultado.
          </p>
        </div>

        <div className="grid items-stretch gap-4 min-[520px]:grid-cols-2 md:grid-cols-3">
          {steps.map((item) => {
            const Icon = item.icon

            return (
              <Card
                key={item.step}
                className="lbb-compact-card relative h-full overflow-hidden py-0 text-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#04f77c]/60"
              >
                <div className="absolute right-4 top-3 text-4xl font-semibold text-white/[0.05]">{item.step}</div>
                <CardContent className="flex h-full flex-col p-4">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded bg-[#04f77c] text-zinc-950">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#04f77c]">Paso {item.step}</p>
                  <h3 className="min-w-0 break-words text-lg font-bold leading-6 tracking-normal text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 min-w-0 break-words text-sm leading-6 text-slate-400">{item.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
