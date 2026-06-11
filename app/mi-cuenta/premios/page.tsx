import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Crown, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getWinningLines } from '@/lib/bingo'
import { formatArgentinaDate } from '@/lib/date'

export const dynamic = 'force-dynamic'

interface CustomerCard {
  id: string
  card_number: string
  full_name: string
  payment_status?: 'pending' | 'approved' | 'rejected' | null
  bingo_numbers: number[][] | null
  created_at: string
  raffle?: {
    id: string
    name: string
    draw_date?: string | null
    draw_status?: 'idle' | 'running' | 'finished' | null
    drawn_numbers?: number[] | null
  } | null
}

export default async function CustomerPrizesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    redirect('/mi-cuenta')
  }

  const { data: cards } = await supabase
    .from('bingo_cards')
    .select('id, card_number, full_name, created_at, payment_status, bingo_numbers, raffle:raffles(id, name, draw_date, draw_status, drawn_numbers)')
    .eq('email', user.email)
    .eq('payment_status', 'approved')
    .order('created_at', { ascending: false })

  const prizes = ((cards ?? []) as CustomerCard[])
    .flatMap((card) => {
      const lines = getWinningLines(card.bingo_numbers, card.raffle?.drawn_numbers ?? [])
      return lines.map((line) => ({ card, line }))
    })

  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-zinc-100">
      <div className="lbb-ambient" />
      <SiteHeader activePath="mi-cuenta" kicker="Premios ganados" compact />

      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-[104px] sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center rounded-full bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-zinc-950">
            <Crown className="mr-1 h-3.5 w-3.5" />
            Mi cuenta
          </div>
          <h1 className="font-mono text-4xl font-black leading-none text-white sm:text-6xl">Premios ganados</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300">
            Aca aparecen los premios detectados en tus cartones aprobados cuando el sorteo tiene numeros cantados.
          </p>
        </div>

        {prizes.length === 0 ? (
          <Card className="border-dashed border-white/15 bg-zinc-950/70 text-zinc-100">
            <CardContent className="p-8 text-center">
              <Trophy className="mx-auto mb-3 h-12 w-12 text-amber-300" />
              <h2 className="text-xl font-bold text-white">Todavia no hay premios ganados</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
                Cuando uno de tus cartones aprobados complete una fila o carton completo, va a aparecer aca.
              </p>
              <Button asChild className="mt-6 rounded-full bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200">
                <Link href="/mi-cuenta">Volver a Mi cuenta</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {prizes.map((prize) => (
              <Card key={`${prize.card.id}-${prize.line}`} className="border-amber-300/25 bg-zinc-950/80 text-zinc-100">
                <CardContent className="p-5">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-zinc-950">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-200">{prize.line}</p>
                  <h2 className="mt-1 text-xl font-black text-white">{prize.card.raffle?.name ?? 'Sorteo'}</h2>
                  <div className="mt-4 space-y-2 text-sm text-zinc-300">
                    <p>Carton: <span className="font-bold text-white">{prize.card.card_number}</span></p>
                    <p>Fecha: {formatArgentinaDate(prize.card.raffle?.draw_date ?? prize.card.created_at)}</p>
                    <p>Estado: pago aprobado</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
