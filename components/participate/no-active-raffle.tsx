import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BearLogo } from '@/components/bear-logo'

export function NoActiveRaffle() {
  return (
    <Card className="border-zinc-800 bg-zinc-950/80 max-w-xl mx-auto text-zinc-100">
      <CardContent className="py-16 text-center">
        <BearLogo size={82} sad className="mx-auto mb-6" />
        <h1 
          className="mb-4 text-2xl font-semibold tracking-tight text-white"
        >
          No Hay Sorteo Activo
        </h1>
        <p className="text-zinc-300 mb-8 max-w-md mx-auto leading-relaxed">
          En este momento no hay un sorteo disponible para comprar cartones.
          Cuando se habilite el proximo, vas a poder participar desde aca y recibir el aviso por WhatsApp si ganas.
        </p>
        <Button asChild className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
          <Link href="/">Volver al Inicio</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
