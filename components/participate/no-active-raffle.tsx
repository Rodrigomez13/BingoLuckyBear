import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BearLogo } from '@/components/bear-logo'

export function NoActiveRaffle() {
  return (
    <Card className="border-amber-200 bg-white/80 max-w-xl mx-auto">
      <CardContent className="py-16 text-center">
        <BearLogo size={100} sad className="mx-auto mb-6" />
        <h1 
          className="text-3xl font-bold text-amber-900 mb-4"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          No Hay Sorteo Activo
        </h1>
        <p className="text-amber-700 mb-8 max-w-md mx-auto leading-relaxed">
          En este momento no hay ningun sorteo disponible para participar. 
          Siguenos en redes sociales para enterarte cuando haya un nuevo sorteo.
        </p>
        <Button asChild className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
          <Link href="/">Volver al Inicio</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
