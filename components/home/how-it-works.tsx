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
    <section id="como-funciona" className="lbb-scroll-reveal py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-amber-300">Como participar</p>
          <h2
            className="text-4xl font-bold leading-tight tracking-normal text-white md:text-5xl"
          >
              Jugar es simple
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Compras tu carton una vez y el sistema se encarga de seguir la jugada hasta el resultado.
          </p>
        </div>

        <div className="grid items-stretch gap-5 min-[520px]:grid-cols-2 md:grid-cols-3">
          {steps.map((item) => {
            const Icon = item.icon

            return (
              <Card
                key={item.step}
                className="relative h-full overflow-hidden rounded-[1.35rem] border-white/10 bg-white/[0.045] py-0 text-slate-100 shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/45"
              >
                <div className="absolute right-5 top-4 font-mono text-6xl font-bold text-white/[0.04]">{item.step}</div>
                <CardContent className="flex h-full flex-col p-6">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300 text-zinc-950 shadow-lg shadow-amber-500/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">Paso {item.step}</p>
                  <h3 className="min-w-0 break-words text-xl font-bold leading-7 tracking-normal text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 min-w-0 break-words text-sm leading-6 text-slate-400">{item.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
