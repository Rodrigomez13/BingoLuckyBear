import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { CalendarDays, Crown, Hash, Radio, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getBingoLetter, getWinningLines } from '@/lib/bingo'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface Raffle {
  id: string
  name: string
  description: string | null
  created_at: string
  draw_status?: 'idle' | 'running' | 'finished' | null
  drawn_numbers?: number[] | null
}

interface BingoCard {
  id: string
  card_number: string
  full_name: string
  created_at: string
  bingo_numbers: number[][]
  raffle_id: string
}

interface WinnerRecord {
  raffle: Raffle
  card: BingoCard
  lines: string[]
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
  const { data: cards } = await supabase
    .from('bingo_cards')
    .select('id, card_number, full_name, created_at, bingo_numbers, raffle_id')
    .in('raffle_id', raffleIds)

  const winners = (cards ?? []).flatMap((card) => {
    const raffle = raffles.find((item) => item.id === card.raffle_id) as Raffle | undefined
    const drawnNumbers = raffle?.drawn_numbers ?? []
    const lines = getWinningLines(card.bingo_numbers, drawnNumbers)

    return raffle && lines.length > 0 ? [{ raffle, card, lines }] : []
  })

  return { raffles: raffles as Raffle[], winners }
}

export default async function WinnersPage() {
  const { raffles, winners } = await getWinnerRecords()

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_34rem),linear-gradient(135deg,#09090b,#18181b_45%,#111827)] text-zinc-100">
      <header className="sticky top-0 z-50 border-b border-amber-400/20 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo-solo.svg" alt="Lucky Bingo Bear" width={46} height={46} className="h-11 w-11 object-contain" />
            <span className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-fredoka)' }}>
              Lucky Bingo Bear
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/en-vivo" className="hidden text-sm font-medium text-amber-200 transition-colors hover:text-white sm:inline">
              En vivo
            </Link>
            <Button asChild className="bg-amber-400 font-bold text-zinc-950 hover:bg-amber-300">
              <Link href="/participar">Participar</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <Badge className="mb-5 bg-emerald-500 text-white hover:bg-emerald-500">
              <Crown className="mr-1 h-3.5 w-3.5" />
              Resultados oficiales
            </Badge>
            <h1 className="max-w-4xl text-5xl font-black text-white sm:text-6xl" style={{ fontFamily: 'var(--font-fredoka)' }}>
              Ganadores y sorteos finalizados
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-300">
              Un registro publico para revisar los sorteos cerrados, los cartones ganadores y el orden de numeros cantados.
            </p>
          </div>

          <Card className="border-amber-400/25 bg-zinc-950/80 text-zinc-100 shadow-xl shadow-black/20">
            <CardContent className="grid grid-cols-2 gap-4 p-5">
              <Metric value={String(raffles.length)} label="sorteos cerrados" />
              <Metric value={String(winners.length)} label="ganadores detectados" />
            </CardContent>
          </Card>
        </div>

        {winners.length === 0 ? (
          <div className="mt-12 rounded-lg border border-dashed border-amber-300/30 bg-zinc-950/55 p-10 text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-amber-300" />
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-fredoka)' }}>
              Todavia no hay ganadores publicados
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-zinc-400">
              Cuando un sorteo se finalice y exista un carton con linea ganadora, aparecera automaticamente en esta pagina.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {winners.map((winner) => {
              const drawnNumbers = winner.raffle.drawn_numbers ?? []
              const lastNumber = drawnNumbers[drawnNumbers.length - 1]

              return (
                <Card key={`${winner.raffle.id}-${winner.card.id}`} className="overflow-hidden border-zinc-800 bg-zinc-950/80 text-zinc-100 shadow-xl shadow-black/20">
                  <div className="border-b border-amber-400/20 bg-gradient-to-r from-amber-400/15 to-emerald-400/10 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <Badge className="mb-3 bg-amber-400 text-zinc-950 hover:bg-amber-400">
                          <Trophy className="mr-1 h-3.5 w-3.5" />
                          Ganador
                        </Badge>
                        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-fredoka)' }}>
                          {winner.card.full_name}
                        </h2>
                        <p className="mt-1 text-sm text-zinc-300">{winner.raffle.name}</p>
                      </div>
                      <Image src="/logo-solo.svg" alt="" width={84} height={84} className="h-16 w-16 object-contain opacity-90" />
                    </div>
                  </div>
                  <CardContent className="space-y-5 p-5">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Info icon={<Hash className="h-4 w-4" />} label="Carton" value={winner.card.card_number} />
                      <Info icon={<Radio className="h-4 w-4" />} label="Ultimo" value={lastNumber ? `${getBingoLetter(lastNumber)}-${lastNumber}` : '--'} />
                      <Info icon={<CalendarDays className="h-4 w-4" />} label="Fecha" value={new Date(winner.raffle.created_at).toLocaleDateString('es-ES')} />
                    </div>

                    <div className="rounded-md border border-emerald-400/25 bg-emerald-500/10 p-4">
                      <p className="text-sm font-semibold text-emerald-100">Lineas ganadoras</p>
                      <p className="mt-1 text-sm text-zinc-200">{winner.lines.join(', ')}</p>
                    </div>

                    <div>
                      <p className="mb-3 text-sm font-semibold text-zinc-200">Numeros cantados</p>
                      <div className="flex flex-wrap gap-2">
                        {drawnNumbers.map((number) => (
                          <span key={number} className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-zinc-950">
                            {number}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-4">
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-amber-200">{label}</p>
    </div>
  )
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-200">
        {icon}
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-semibold text-white">{value}</p>
    </div>
  )
}
