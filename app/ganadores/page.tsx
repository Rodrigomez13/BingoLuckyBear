import Image from 'next/image'
import type { ReactNode } from 'react'
import { CalendarDays, Crown, Hash, Quote, Radio, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDrawnNumber, getPrizeAmounts, getPrizeAwards, getPrizeLabel } from '@/lib/bingo'
import { formatArgentinaDate } from '@/lib/date'
import { createServiceClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/site-header'

export const dynamic = 'force-dynamic'

interface Raffle {
  id: string
  name: string
  description: string | null
  created_at: string
  draw_date?: string | null
  draw_status?: 'idle' | 'running' | 'finished' | null
  drawn_numbers?: number[] | null
  prize?: string | null
  additional_prizes?: string[] | null
}

interface BingoCard {
  id: string
  card_number: string
  full_name: string
  created_at: string
  bingo_numbers: number[][]
  raffle_id: string
  winner_photo_url?: string | null
  winner_testimonial?: string | null
}

interface WinnerRecord {
  raffle: Raffle
  card: BingoCard
  prizeNumber: number
  rowIndex: number
  amount: string
  drawnNumber: number
}

async function getWinnerRecords() {
  const supabase = await createServiceClient()

  const { data: raffles } = await supabase
    .from('raffles')
    .select('*')
    .eq('draw_status', 'finished')
    .order('created_at', { ascending: false })

  if (!raffles?.length) {
    return { raffles: [] as Raffle[], winners: [] as WinnerRecord[] }
  }

  const raffleIds = raffles.map((raffle) => raffle.id)
  let cards: BingoCard[] | null = null
  const { data, error } = await supabase
    .from('bingo_cards')
    .select('id, card_number, full_name, created_at, bingo_numbers, raffle_id, winner_photo_url, winner_testimonial')
    .in('raffle_id', raffleIds)

  if (error && /winner_photo_url|winner_testimonial|schema cache|column/i.test(error.message)) {
    const fallback = await supabase
      .from('bingo_cards')
      .select('id, card_number, full_name, created_at, bingo_numbers, raffle_id')
      .in('raffle_id', raffleIds)

    cards = (fallback.data ?? []) as BingoCard[]
  } else {
    cards = (data ?? []) as BingoCard[]
  }

  const winners = (raffles as Raffle[]).flatMap((raffle) => {
    const raffleCards = (cards ?? []).filter((card) => card.raffle_id === raffle.id)
    const awards = getPrizeAwards(raffleCards, raffle.drawn_numbers ?? [], getPrizeAmounts(raffle.prize, raffle.additional_prizes))

    return awards.flatMap((award) =>
      award.winners.map((winner) => {
        const card = raffleCards.find((item) => item.id === winner.id) as BingoCard

        return {
          raffle,
          card,
          prizeNumber: award.prizeNumber,
          rowIndex: award.rowIndex,
          amount: award.amount,
          drawnNumber: award.drawnNumber,
        }
      })
    )
  })

  return { raffles: raffles as Raffle[], winners }
}

export default async function WinnersPage() {
  const { raffles, winners } = await getWinnerRecords()
  const latestRaffle = raffles[0]
  const latestWinners = latestRaffle ? winners.filter((winner) => winner.raffle.id === latestRaffle.id) : []

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_34rem),linear-gradient(135deg,#09090b,#18181b_45%,#111827)] text-zinc-100">
      <SiteHeader activePath="ganadores" kicker="Resultados oficiales" compact />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <Badge className="mb-5 rounded-full bg-emerald-500 text-white hover:bg-emerald-500">
              <Crown className="mr-1 h-3.5 w-3.5" />
              Resultados oficiales
            </Badge>
            <h1 className="max-w-4xl font-mono text-4xl font-bold leading-[0.98] tracking-normal text-white sm:text-6xl">
              Ganadores reales. Resultados claros.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300">
              Cada sorteo cerrado queda como referencia publica: premio, monto, carton ganador y datos que demuestran que la jugada se resolvio con transparencia.
            </p>
          </div>

          <Card className="border-amber-400/25 bg-zinc-950/80 text-zinc-100 shadow-xl shadow-black/20">
            <CardContent className="grid grid-cols-2 gap-4 p-5">
              <Metric value={String(raffles.length)} label="sorteos cerrados" />
              <Metric value={String(winners.length)} label="premios adjudicados" />
            </CardContent>
          </Card>
        </div>

        {winners.length === 0 ? (
          <div className="mt-12 rounded-lg border border-dashed border-amber-300/30 bg-zinc-950/55 p-10 text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-amber-300" />
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Todavia no hay ganadores publicados
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-zinc-400">
              Cuando un sorteo se finalice y exista una fila premiada, aparecera automaticamente en esta pagina.
            </p>
          </div>
        ) : (
          <>
          {latestRaffle && (
            <div className="mt-12 rounded-lg border border-amber-400/25 bg-zinc-950/80 p-5 shadow-xl shadow-black/20">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
                <div>
                  <Badge className="mb-3 bg-amber-400 text-zinc-950 hover:bg-amber-400">
                    Ultimo sorteo cerrado
                  </Badge>
                  <h2 className="text-2xl font-semibold tracking-tight text-white">{latestRaffle.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    {latestWinners.length} premio{latestWinners.length !== 1 ? 's' : ''} adjudicado{latestWinners.length !== 1 ? 's' : ''}. Si fuiste ganador, tambien recibis el aviso por WhatsApp con el monto correspondiente.
                  </p>
                </div>
                <div className="rounded-md border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Fecha</p>
                  <p className="mt-2 font-bold text-white">
                    {formatArgentinaDate(latestRaffle.draw_date ?? latestRaffle.created_at)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {winners.map((winner) => {
              const drawnNumbers = winner.raffle.drawn_numbers ?? []
              const compactNumbers = drawnNumbers.slice(-8)
              const photoPath = winner.card.winner_photo_url

              return (
                <Card key={`${winner.raffle.id}-${winner.card.id}-${winner.prizeNumber}`} className="overflow-hidden border-zinc-800 bg-zinc-950/80 text-zinc-100 shadow-xl shadow-black/20">
                  <div className="grid min-h-full md:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="relative min-h-48 border-b border-amber-400/20 bg-gradient-to-br from-amber-400/25 to-emerald-400/10 md:border-b-0 md:border-r">
                      {photoPath ? (
                        <Image
                          src={`/api/file?pathname=${encodeURIComponent(photoPath)}`}
                          alt={`Foto de ${winner.card.full_name}`}
                          fill
                          sizes="(min-width: 768px) 180px, 100vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full min-h-48 items-center justify-center">
                          <Image src="/logo-solo.svg" alt="" width={120} height={120} className="h-24 w-24 object-contain opacity-90" />
                        </div>
                      )}
                    </div>
                    <div>
                  <div className="border-b border-amber-400/20 bg-gradient-to-r from-amber-400/15 to-emerald-400/10 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Badge className="mb-3 bg-amber-400 text-zinc-950 hover:bg-amber-400">
                          <Trophy className="mr-1 h-3.5 w-3.5" />
                          {getPrizeLabel(winner.prizeNumber as 1 | 2 | 3 | 4)}
                        </Badge>
                        <h2 className="text-xl font-semibold tracking-tight text-white">
                          {winner.card.full_name}
                        </h2>
                        <p className="mt-1 text-sm text-zinc-300">{winner.raffle.name}</p>
                        <p className="mt-1 font-bold text-amber-200">{winner.amount || 'Monto a confirmar'}</p>
                      </div>
                      <div className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-right">
                        <p className="text-xs font-bold uppercase text-emerald-100">Pago publicado</p>
                        <p className="text-xs text-zinc-300">Referencia oficial</p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="space-y-5 p-5">
                    <div className="grid auto-rows-fr gap-3 sm:grid-cols-3">
                      <Info icon={<Hash className="h-4 w-4" />} label="Carton" value={winner.card.card_number} />
                      <Info icon={<Radio className="h-4 w-4" />} label="Numero premio" value={formatDrawnNumber(winner.drawnNumber)} />
                      <Info icon={<CalendarDays className="h-4 w-4" />} label="Fecha" value={formatArgentinaDate(winner.raffle.created_at)} />
                    </div>

                    <div className="rounded-md border border-emerald-400/25 bg-emerald-500/10 p-4">
                      <p className="text-sm font-semibold text-emerald-100">Fila premiada</p>
                      <p className="mt-1 text-sm text-zinc-200">
                        {getPrizeLabel(winner.prizeNumber as 1 | 2 | 3 | 4)} - {winner.rowIndex >= 0 ? `fila ${winner.rowIndex + 1}` : 'carton completo'}
                      </p>
                    </div>

                    <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                      <p className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                        <Quote className="h-4 w-4 text-amber-200" />
                        Confianza Lucky Bingo Bear
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                        {winner.card.winner_testimonial || 'Ganador validado con carton registrado y premio adjudicado automaticamente por el sistema.'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 rounded-md border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-zinc-200">Bolillas de cierre</p>
                        <p className="text-xs text-zinc-500">{drawnNumbers.length} numeros cantados en total</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {compactNumbers.map((number) => (
                          <span key={number} className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-[11px] font-bold text-zinc-950">
                            {number}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
          </>
        )}
      </section>
    </main>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-4">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-200">{label}</p>
    </div>
  )
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-200">
        {icon}
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-semibold text-white">{value}</p>
    </div>
  )
}
