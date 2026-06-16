import Link from 'next/link'
import { Bell, MessageCircle, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BearLogo } from '@/components/bear-logo'
import { CONTACT_LINKS } from '@/lib/contact'

const referencePrizes = ['$350.000', '$200.000', '$150.000', '$50.000']

export function NoActiveRaffle() {
  return (
    <Card className="mx-auto max-w-xl border-white/10 bg-zinc-950/80 text-zinc-100 shadow-2xl shadow-black/30">
      <CardContent className="px-6 py-12 text-center sm:px-10">
        <BearLogo size={82} sad className="mx-auto mb-6" />
        <h1 className="mb-3 text-2xl font-semibold tracking-tight text-white">No hay sorteo activo</h1>
        <p className="mx-auto mb-7 max-w-md leading-relaxed text-zinc-300">
          En este momento no hay un sorteo disponible para comprar cartones. Cuando se habilite el proximo, vas a poder
          participar desde aca y recibir el aviso por WhatsApp si ganas.
        </p>

        <div className="mb-7">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Premios de referencia</p>
          <div className="flex flex-wrap justify-center gap-2">
            {referencePrizes.map((prize) => (
              <span
                key={prize}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-sm font-bold text-amber-100"
              >
                <Trophy className="h-3.5 w-3.5" />
                {prize}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          {CONTACT_LINKS.whatsappGroupUrl ? (
            <Button asChild className="h-12 w-full rounded-full bg-[#25d366] font-bold text-zinc-950 hover:bg-[#30e17b] sm:w-auto">
              <Link href={CONTACT_LINKS.whatsappGroupUrl} target="_blank" rel="noreferrer">
                <Bell className="mr-2 h-4 w-4" />
                Avisame del proximo sorteo
              </Link>
            </Button>
          ) : (
            <Button asChild className="h-12 w-full rounded-full bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200 sm:w-auto">
              <Link href="/">Volver al inicio</Link>
            </Button>
          )}
          <Button
            asChild
            variant="outline"
            className="h-12 w-full rounded-full border-emerald-400/40 bg-transparent font-bold text-emerald-200 hover:bg-emerald-400/10 sm:w-auto"
          >
            <Link href="/ganadores">
              <MessageCircle className="mr-2 h-4 w-4" />
              Ver ultimos ganadores
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
