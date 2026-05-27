import { Card, CardContent } from '@/components/ui/card'

const steps = [
  {
    step: 1,
    title: 'Espera el Sorteo',
    description: 'Cuando un sorteo este activo, podras participar. Te avisaremos por nuestras redes.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    step: 2,
    title: 'Completa tus Datos',
    description: 'Ingresa tu informacion personal y sube el comprobante de tu transferencia.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    step: 3,
    title: 'Recibe tu Carton',
    description: 'Se generara automaticamente tu carton unico con un codigo exclusivo.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  {
    step: 4,
    title: 'Participa y Gana',
    description: 'Sigue el sorteo en vivo y cruza los dedos. Tu carton podria ser el ganador!',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 bg-white/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 
            className="text-4xl md:text-5xl font-bold text-amber-900 mb-4"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            Como Funciona
          </h2>
          <p className="text-lg text-amber-700 max-w-2xl mx-auto">
            Participar es muy facil. Sigue estos simples pasos y podras tener tu carton de bingo en minutos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item) => (
            <Card 
              key={item.step} 
              className="relative overflow-hidden border-amber-100 hover:border-amber-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
              <CardContent className="pt-8 pb-6 px-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-amber-600">
                    {item.icon}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-amber-900" style={{ fontFamily: 'var(--font-fredoka)' }}>
                    {item.title}
                  </h3>
                  <p className="text-amber-700 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
