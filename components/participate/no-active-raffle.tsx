import Link from 'next/link'
import { Bell, CalendarClock, MessageCircle, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BearLogo } from '@/components/bear-logo'
import { CONTACT_LINKS } from '@/lib/contact'
import { PLACEHOLDER_RAFFLES } from '@/lib/bingo-placeholder-raffles'

const referencePrizes = ['$350.000', '$200.000', '$150.000', '$50.000']

export function NoActiveRaffle() {
  return (
    <Card className="mx-auto max-w-5xl border-white/10 bg-zinc-950/80 text-zinc-100 shadow-2xl shadow-black/30">
      <CardContent className="px-5 py-8 text-center sm:px-8 sm:py-10">
        <BearLogo size={76} className="mx-auto mb-5" />
        <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">Cartelera de sorteos</p>
        <h1 className="mb-3 text-2xl font-semibold tracking-tight text-white">Próximos sorteos Lucky Bear</h1>
        <p className="mx-auto mb-7 max-w-2xl leading-relaxed text-zinc-300">
          Estos sorteos son de muestra y mantienen la cartelera completa. La compra de cartones se habilita solo cuando haya un sorteo oficial disponible.
        </p>

        <div className="mb-7 grid gap-3 md:grid-cols-3">
          {PLACEHOLDER_RAFFLES.map((raffle) => (
            <div key={raffle.name} className="rounded-2xl border border-amber-300/18 bg-black/30 p-4 text-left">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-zinc-400">
                  {raffle.status}
                </span>
                <CalendarClock className="h-4 w-4 text-amber-300" />
              </div>
              <h2 className="text-lg font-black text-white">{raffle.name}</h2>
              <p className="mt-1 text-sm text-zinc-400">{raffle.dateLabel}</p>
              <p className="mt-4 font-mono text-2xl font-black text-amber-300">{raffle.prize}</p>
              <p className="mt-3 text-xs leading-5 text-zinc-500">{raffle.detail}</p>
              <button type="button" disabled className="mt-4 h-10 w-full cursor-not-allowed rounded-full border border-white/10 bg-white/[0.03] text-xs font-black text-zinc-500">
                Compra no habilitada
              </button>
            </div>
          ))}
        </div>

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
