'use client'

import { Badge } from '@/components/ui/badge'
import { BearLogo } from '@/components/bear-logo'
import { Hash, ShieldAlert, Sparkles, Trophy } from 'lucide-react'
import { BINGO_90_COLUMN_LABELS, getBingoRows, getWinningLines, isMarked } from '@/lib/bingo'
import { cn } from '@/lib/utils'

export type Bingo90PaymentStatus = 'pending' | 'approved' | 'rejected'

export interface Bingo90CardData {
  id: string
  card_number: string
  full_name: string
  created_at: string
  bingo_numbers: number[][]
  payment_status?: Bingo90PaymentStatus | null
}

export function createExampleBingo90Card(): Bingo90CardData {
  return {
    id: 'example-bingo-90',
    card_number: 'LBB-90A1F7',
    full_name: 'Jugador Lucky',
    created_at: new Date().toISOString(),
    payment_status: 'approved',
    bingo_numbers: [
      [3, 0, 24, 0, 42, 0, 66, 0, 88],
      [0, 16, 0, 35, 0, 57, 0, 74, 90],
      [7, 0, 29, 0, 49, 59, 0, 0, 84],
    ],
  }
}

export function BingoCardArtboard({
  card,
  raffleName,
  drawnNumbers = [],
  isWinner: forcedWinner,
}: {
  card: Bingo90CardData
  raffleName: string
  drawnNumbers?: number[]
  forDownload?: boolean
  isWinner?: boolean
}) {
  const paymentStatus = card.payment_status ?? 'pending'
  const isApproved = paymentStatus === 'approved'
  const isRejected = paymentStatus === 'rejected'
  const rows = getBingoRows(card.bingo_numbers)
  const winningLines = isApproved ? getWinningLines(card.bingo_numbers, drawnNumbers) : []
  const isWinner = Boolean(forcedWinner || winningLines.length)
  const formattedDate = new Date(card.created_at).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const status = isWinner
    ? { label: 'Cartón ganador', className: 'bg-emerald-300 text-emerald-950 hover:bg-emerald-300', icon: <Trophy className="mr-1 h-3.5 w-3.5" /> }
    : isApproved
      ? { label: 'Participando', className: 'bg-emerald-500 text-white hover:bg-emerald-500', icon: <Sparkles className="mr-1 h-3.5 w-3.5" /> }
      : isRejected
        ? { label: 'Pago rechazado', className: 'bg-red-500 text-white hover:bg-red-500', icon: <ShieldAlert className="mr-1 h-3.5 w-3.5" /> }
        : { label: 'Pendiente de aprobación', className: 'bg-amber-300 text-amber-950 hover:bg-amber-300', icon: <ShieldAlert className="mr-1 h-3.5 w-3.5" /> }

  return (
    <div className="mx-auto w-full max-w-[960px] [container-type:inline-size]">
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '960 / 420' }}>
        <div
          data-bingo-artboard="true"
          className={cn(
            'absolute left-1/2 top-0 h-[420px] w-[960px] origin-top -translate-x-1/2 overflow-hidden rounded-[30px] border border-amber-300/30 bg-[#06100c] shadow-2xl shadow-black/40',
            !isApproved && 'opacity-95',
          )}
          style={{ transform: 'translateX(-50%) scale(min(1, calc(100cqw / 960)))' }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(245,190,70,0.28),transparent_32%),radial-gradient(circle_at_0%_100%,rgba(16,185,129,0.18),transparent_42%),linear-gradient(180deg,#0b1b14_0%,#07100c_54%,#030806_100%)]" />
          <div className="absolute inset-[16px] rounded-[24px] border border-amber-300/25" />
          <div className="absolute inset-[28px] rounded-[18px] border border-white/10" />
          <div className="absolute left-1/2 top-[-100px] h-[190px] w-[520px] -translate-x-1/2 rounded-full bg-amber-300/15 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle_at_center,#fff_1px,transparent_1px)] [background-size:22px_22px]" />

          {!isApproved && (
            <div className="absolute left-[58px] right-[58px] top-[18px] z-20 rounded-full border border-amber-300/45 bg-black/80 px-4 py-2 text-center text-[12px] font-black uppercase tracking-[0.2em] text-amber-100">
              {isRejected ? 'Pago rechazado · no participa' : 'Pendiente de aprobación · no participa todavía'}
            </div>
          )}

          <div className={cn('relative z-10 flex h-full flex-col px-[44px] pb-[28px] pt-[28px]', !isApproved && 'pt-[56px]')}>
            <header className="flex shrink-0 items-center justify-between gap-6">
              <div className="flex min-w-0 items-center gap-3">
                <BearLogo size={46} className="shrink-0" />
                <div className="min-w-0">
                  <h2 className="truncate font-mono text-[28px] font-black leading-none text-white">Lucky Bingo Bear</h2>
                  <p className="mt-1 truncate text-[13px] font-bold uppercase tracking-[0.16em] text-amber-300">{raffleName}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <Badge className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1.5 text-[13px] font-black text-amber-950 hover:from-amber-400 hover:to-orange-500">
                  <Hash className="mr-1 h-3.5 w-3.5" /> {card.card_number}
                </Badge>
                <div className="mt-2">
                  <Badge className={cn('rounded-full px-3 py-1 text-[11px] font-black', status.className)}>
                    {status.icon}
                    {status.label}
                  </Badge>
                </div>
              </div>
            </header>

            <section className="mt-[18px] shrink-0 rounded-[20px] border-[3px] border-amber-400/65 bg-black p-[7px] shadow-inner">
              <div className="grid grid-cols-9 gap-[5px]">
                {BINGO_90_COLUMN_LABELS.map((label) => (
                  <HeaderCell key={label}>{label}</HeaderCell>
                ))}
              </div>
              {rows.slice(0, 3).map((row, rowIndex) => (
                <div key={rowIndex} className="mt-[5px] grid grid-cols-9 gap-[5px]">
                  {Array.from({ length: 9 }).map((_, colIndex) => {
                    const cell = row[colIndex] ?? null
                    const marked = isApproved && isMarked(cell, drawnNumbers)
                    const empty = cell === null
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={cn(
                          'flex h-[56px] items-center justify-center rounded-[13px] border border-white/8 bg-[#0a0a0a] font-mono text-[28px] font-black leading-none tabular-nums text-white shadow-inner',
                          empty && 'bg-white/[0.035] text-transparent shadow-none [background-image:linear-gradient(135deg,rgba(245,190,70,0.08)_25%,transparent_25%,transparent_50%,rgba(245,190,70,0.08)_50%,rgba(245,190,70,0.08)_75%,transparent_75%,transparent)] [background-size:12px_12px]',
                          marked && !empty && 'bg-emerald-600 text-white ring-2 ring-inset ring-amber-300/75',
                          isWinner && marked && !empty && 'bg-emerald-400 text-emerald-950 ring-2 ring-inset ring-white/90',
                        )}
                      >
                        {cell ?? ''}
                      </div>
                    )
                  })}
                </div>
              ))}
            </section>

            <footer className="mt-auto grid shrink-0 grid-cols-[1fr_auto] items-end gap-4 pt-[16px]">
              <div className="min-w-0">
                <p className="truncate text-[17px] font-black text-amber-50">{card.full_name}</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300/85">Emitido {formattedDate}</p>
              </div>
              <div className="rounded-[15px] border border-amber-300/20 bg-black/25 px-4 py-2.5 text-right">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-100/45">Formato</p>
                <p className="mt-0.5 font-mono text-[16px] font-black text-emerald-200">Bingo 90 · 3×9</p>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[34px] items-center justify-center rounded-[11px] bg-emerald-950 px-1 text-center font-mono text-[13px] font-black leading-tight text-amber-200 ring-1 ring-inset ring-emerald-700/70">
      {children}
    </div>
  )
}
