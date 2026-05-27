import { Eye, LockKeyhole, MonitorSmartphone, ReceiptText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    title: 'Carton para guardar',
    description: 'El jugador obtiene su codigo y puede descargar o consultar el carton cuando lo necesite.',
    icon: ReceiptText,
    color: 'bg-sky-400 text-zinc-950',
  },
  {
    title: 'Diseñado para celular',
    description: 'La compra, el comprobante y el vivo se leen bien desde pantallas chicas.',
    icon: MonitorSmartphone,
    color: 'bg-emerald-400 text-zinc-950',
  },
  {
    title: 'Control de comprobantes',
    description: 'El admin revisa participantes, pagos y cartones desde una vista operativa.',
    icon: LockKeyhole,
    color: 'bg-amber-400 text-zinc-950',
  },
  {
    title: 'Resultados a la vista',
    description: 'Ganadores y numeros cantados quedan publicados para consulta posterior.',
    icon: Eye,
    color: 'bg-red-400 text-zinc-950',
  },
]

export function Features() {
  return (
    <section className="bg-black/20 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 max-w-3xl">
          <p className="mb-3 text-sm font-black uppercase text-amber-300">Experiencia</p>
          <h2
            className="text-4xl font-black leading-tight text-white md:text-5xl"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            Mas profesional para quien compra y para quien organiza
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-zinc-300">
            Estos beneficios evitan repetir el mismo argumento: hablan de carton, mobile, operacion y resultados.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon

            return (
              <Card
                key={feature.title}
                className="border-zinc-800 bg-zinc-950/80 text-zinc-100 transition-all duration-300 hover:border-amber-400/60 hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md ${feature.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-fredoka)' }}>
                        {feature.title}
                      </h3>
                      <p className="mt-2 leading-relaxed text-zinc-400">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
