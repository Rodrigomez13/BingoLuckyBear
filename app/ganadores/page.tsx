import Image from 'next/image'
import type { ReactNode } from 'react'
import { CalendarDays, CheckCircle2, Crown, Hash, MessageCircle, Quote, Star, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { SiteHeader } from '@/components/site-header'
import { formatDrawnNumber, getPrizeAmounts, getPrizeAwards, getPrizeLabel } from '@/lib/bingo'
import { formatArgentinaDate } from '@/lib/date'
import { createServiceClient } from '@/lib/supabase/server'
import { getWinnerExample, winnerExamples } from '@/lib/winner-examples'

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

interface WinnerDisplay {
  key: string
  name: string
  date: string
  raffleName: string
  cardNumber: string
  prizeLabel: string
  amount: string
  photo: string
  quote: string
  drawnNumber?: number
  rowLabel: string
  isExample: boolean
}

async function getWinnerRecords() {
  const supabase = await createServiceClient()

  const { data: raffles } = await supabase
    .from('raffles')
    .select('*')
    .eq('draw_status', 'finished')
    .order('created_at', { ascending: false })

  if (!raffles?.length) {
    return { raffles: [] as Raffle[], winners: [] as WinnerRecord[], cards: [] as BingoCard[] }
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

  return { raffles: raffles as Raffle[], winners, cards: cards ?? [] }
}

function toWinnerDisplay(winner: WinnerRecord, index: number): WinnerDisplay {
  const example = getWinnerExample(index)
  const photo = winner.card.winner_photo_url
    ? `/api/file?pathname=${encodeURIComponent(winner.card.winner_photo_url)}`
    : example.image

  return {
    key: `${winner.raffle.id}-${winner.card.id}-${winner.prizeNumber}`,
    name: winner.card.full_name,
    date: formatArgentinaDate(winner.raffle.draw_date ?? winner.raffle.created_at),
    raffleName: winner.raffle.name,
    cardNumber: winner.card.card_number,
    prizeLabel: getPrizeLabel(winner.prizeNumber as 1 | 2 | 3 | 4),
    amount: winner.amount || 'Monto a confirmar',
    photo,
    quote: winner.card.winner_testimonial || 'Ganador validado con carton registrado, premio publicado y aviso enviado por WhatsApp.',
    drawnNumber: winner.drawnNumber,
    rowLabel: winner.rowIndex >= 0 ? `Fila ${winner.rowIndex + 1}` : 'Carton completo',
    isExample: false,
  }
}

function getExampleDisplays(): WinnerDisplay[] {
  return winnerExamples.slice(0, 4).map((winner, index) => ({
    key: `example-${winner.name}`,
    name: winner.name,
    date: winner.date,
    raffleName: 'Sorteo de referencia',
    cardNumber: `LBB-${String(index + 1).padStart(4, '0')}`,
    prizeLabel: winner.label,
    amount: winner.prize,
    photo: winner.image,
    quote: winner.quote,
    drawnNumber: undefined,
    rowLabel: winner.label,
    isExample: true,
  }))
}

export default async function WinnersPage() {
  const { raffles, winners, cards } = await getWinnerRecords()
  const displays = winners.map(toWinnerDisplay)
  const visibleDisplays = displays.length > 0 ? displays : getExampleDisplays()
  const latestRaffle = raffles[0]
  const latestRaffleCards = latestRaffle ? cards.filter((card) => card.raffle_id === latestRaffle.id) : []
  const latestRaffleWinners = latestRaffle ? winners.filter((winner) => winner.raffle.id === latestRaffle.id) : []

  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-zinc-100">
      <div className="lbb-ambient" />
      <SiteHeader activePath="ganadores" kicker="Resultados oficiales" compact />

      <section className="relative z-10 mx-auto max-w-[1800px] px-4 pb-12 pt-[104px] sm:px-6 lg:px-8 2xl:px-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
          <div>
            <Badge className="mb-5 rounded-full bg-emerald-500 text-white hover:bg-emerald-500">
              <Crown className="mr-1 h-3.5 w-3.5" />
              Comunidad Lucky
            </Badge>
            <h1 className="max-w-4xl font-mono text-4xl font-black leading-[0.92] tracking-normal text-white sm:text-6xl lg:text-7xl">
              Lo que dicen nuestros jugadores
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300">
              Cada sorteo cerrado deja una referencia publica con ganador, premio y monto. Cuando se carga una foto del ganador, tambien queda visible para reforzar la confianza de la comunidad.
            </p>
          </div>

          <Card className="lbb-premium-panel rounded-[1.35rem] border-white/10 text-zinc-100">
            <CardContent className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
              <Metric value={String(raffles.length)} label="sorteos" />
              <Metric value={String(winners.length)} label="premios" />
              <Metric value={String(cards.length)} label="cartones" />
              <Metric value={latestRaffle ? 'Activo' : 'Listo'} label="historial" />
            </CardContent>
          </Card>
        </div>

        {displays.length === 0 && (
          <div className="mt-8 rounded-[1.2rem] border border-amber-300/25 bg-amber-400/10 p-4 text-sm text-amber-50">
            Esta es una vista de ejemplo con imagenes de referencia. Cuando finalices sorteos reales, los ganadores publicados reemplazaran automaticamente esta seccion.
          </div>
        )}

        <div className="mt-8">
          <div className="no-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-4">
            {visibleDisplays.map((winner, index) => (
              <WinnerCard key={winner.key} winner={winner} index={index} />
            ))}
          </div>
        </div>

        {latestRaffle && (
          <section className="mt-8 grid gap-4 rounded-[1.35rem] border border-white/10 bg-black/30 p-4 shadow-2xl shadow-black/25 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Ultimo sorteo cerrado</p>
              <h2 className="mt-2 text-2xl font-bold text-white">{latestRaffle.name}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Fecha: {formatArgentinaDate(latestRaffle.draw_date ?? latestRaffle.created_at)}. Los resultados quedan disponibles como referencia para cualquier jugador.
              </p>
              <div className="mt-4 grid max-w-2xl gap-2 sm:grid-cols-3">
                <Metric value={String(latestRaffleCards.length)} label="cartones vendidos" />
                <Metric value={String(latestRaffleWinners.length)} label="premios adjudicados" />
                <Metric value={String((latestRaffle.drawn_numbers ?? []).length)} label="bolillas cantadas" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(latestRaffle.drawn_numbers ?? []).slice(-6).map((number) => (
                <span key={number} className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-300 text-xs font-black text-zinc-950">
                  {number}
                </span>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  )
}

function WinnerCard({ winner, index }: { winner: WinnerDisplay; index: number }) {
  return (
    <article className="group w-[min(82vw,330px)] shrink-0 snap-start overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/25 transition duration-300 hover:-translate-y-1 hover:border-amber-300/40 lg:w-auto">
      <div className="relative aspect-[1.25] overflow-hidden bg-zinc-950">
        <Image
          src={winner.photo}
          alt={`Ganador ${winner.name}`}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 82vw"
          className="object-cover transition duration-500 group-hover:scale-105"
          priority={index < 2}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <Badge className="absolute left-3 top-3 rounded-full bg-amber-300 text-zinc-950 hover:bg-amber-300">
          <Trophy className="mr-1 h-3.5 w-3.5" />
          {winner.prizeLabel}
        </Badge>
        {winner.isExample && (
          <Badge className="absolute right-3 top-3 rounded-full bg-zinc-950/75 text-zinc-200 hover:bg-zinc-950/75">
            Ejemplo
          </Badge>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-2xl font-black text-white">{winner.amount}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-200">{winner.raffleName}</p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex gap-1 text-amber-300">
          {Array.from({ length: 5 }).map((_, starIndex) => (
            <Star key={starIndex} className="h-4 w-4 fill-current" />
          ))}
        </div>

        <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-zinc-300">
          <Quote className="mr-1 inline h-4 w-4 text-amber-200" />
          {winner.quote}
        </p>

        <div className="grid gap-2 text-xs text-zinc-400">
          <Info icon={<CheckCircle2 className="h-4 w-4" />} label={winner.name} value={winner.date} />
          <Info icon={<Hash className="h-4 w-4" />} label="Carton" value={winner.cardNumber} />
          <Info icon={<CalendarDays className="h-4 w-4" />} label={winner.rowLabel} value={winner.drawnNumber ? `Bolilla ${formatDrawnNumber(winner.drawnNumber)}` : 'Referencia visual'} />
        </div>

        <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100">
          <MessageCircle className="h-4 w-4" />
          Aviso y pago coordinado por WhatsApp
        </div>
      </div>
    </article>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <p className="text-xl font-black text-white">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-amber-200">{label}</p>
    </div>
  )
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-black/20 px-3 py-2">
      <span className="flex min-w-0 items-center gap-2 font-semibold text-zinc-200">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 text-right text-zinc-400">{value}</span>
    </div>
  )
}
