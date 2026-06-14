'use client'

import { Badge } from '@/components/ui/badge'
import { BearLogo } from '@/components/bear-logo'
import { Hash } from 'lucide-react'
import { getBingoColumnLabels, getBingoRows, getWinningLines, isMarked } from '@/lib/bingo'
import { cn } from '@/lib/utils'

interface BingoCard {
  id: string
  card_number: string
  full_name: string
  created_at: string
  bingo_numbers: number[][]
  payment_status?: 'pending' | 'approved' | 'rejected' | null
}

export function BingoCardArtboard({
  card,
  raffleName,
  drawnNumbers = [],
  forDownload = false,
}: {
  card: BingoCard
  raffleName: string
  drawnNumbers?: number[]
  forDownload?: boolean
}) {
  const paymentStatus = card.payment_status ?? 'pending'
  const isApproved = paymentStatus === 'approved'
  const isRejected = paymentStatus === 'rejected'
  const rows = getBingoRows(card.bingo_numbers)
  const columnLabels = getBingoColumnLabels(card.bingo_numbers)
  const winningLines = isApproved ? getWinningLines(card.bingo_numbers, drawnNumbers) : []
  const hasPrizeColumn = columnLabels.length === 9
  const gridTemplateColumns = `${hasPrizeColumn ? '58px ' : ''}repeat(${columnLabels.length}, 1fr)`
  const formattedDate = new Date(card.created_at).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const status = isApproved
    ? { label: winningLines.length ? 'Cartón ganador' : 'Pago aprobado', className: 'bg-emerald-500 text-white hover:bg-emerald-500' }
    : isRejected
      ? { label: 'Pago rechazado', className: 'bg-red-500 text-white hover:bg-red-500' }
      : { label: 'Pendiente de aprobación', className: 'bg-amber-300 text-amber-950 hover:bg-amber-300' }

  return (
    <div className="mx-auto w-full max-w-[760px]">
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '760 / 520' }}>
        <div
          data-bingo-artboard="true"
          className={cn(
            'absolute left-1/2 top-0 h-[520px] w-[760px] origin-top -translate-x-1/2 overflow-hidden rounded-[30px] border border-amber-300/30 bg-[#06100c] shadow-2xl shadow-black/40',
            !isApproved && 'opacity-95',
          )}
          style={{ transform: 'translateX(-50%) scale(var(--bingo-card-scale, 1))' }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,190,70,0.22),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(16,185,129,0.16),transparent_42%),linear-gradient(180deg,#0b1b14_0%,#07100c_54%,#030806_100%)]" />
          <div className="absolute inset-[18px] rounded-[24px] border border-amber-300/25" />
          <div className="absolute inset-[30px] rounded-[18px] border border-white/8" />
          <div className="absolute left-1/2 top-[-90px] h-[180px] w-[420px] -translate-x-1/2 rounded-full bg-amber-300/15 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle_at_center,#fff_1px,transparent_1px)] [background-size:22px_22px]" />

          {!isApproved && (
            <div className="absolute left-[54px] right-[54px] top-[20px] z-20 rounded-full border border-amber-300/45 bg-black/78 px-4 py-2 text-center text-[12px] font-black uppercase tracking-[0.18em] text-amber-100">
              No participa hasta aprobar pago
            </div>
          )}

          <div className={cn('relative z-10 flex h-full flex-col px-[46px] pb-[30px] pt-[32px]', !isApproved && 'pt-[62px]')}>
            <header className="flex shrink-0 items-center justify-between gap-5">
              <div className="flex min-w-0 items-center gap-3">
                <BearLogo size={48} className="shrink-0" />
                <div className="min-w-0">
                  <h2 className="truncate font-mono text-[29px] font-black leading-none text-white">Lucky Bingo Bear</h2>
                  <p className="mt-1 truncate text-[14px] font-bold uppercase tracking-[0.15em] text-amber-300">{raffleName}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <Badge className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1.5 text-[13px] font-black text-amber-950 hover:from-amber-400 hover:to-orange-500">
                  <Hash className="mr-1 h-3.5 w-3.5" /> {card.card_number}
                </Badge>
                <div className="mt-2">
                  <Badge className={cn('rounded-full px-3 py-1 text-[11px] font-black', status.className)}>{status.label}</Badge>
                </div>
              </div>
            </header>

            <section className="mt-[22px] shrink-0 rounded-[20px] border-[3px] border-amber-400/65 bg-black p-[7px] shadow-inner">
              <div className="grid gap-[5px]" style={{ gridTemplateColumns }}>
                {hasPrizeColumn && <HeaderCell className="bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950">P</HeaderCell>}
                {columnLabels.map((label) => (
                  <HeaderCell key={label} className="bg-emerald-950 text-amber-200 ring-1 ring-inset ring-emerald-700/70">
                    {label}
                  </HeaderCell>
                ))}
              </div>
              {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="mt-[5px] grid gap-[5px]" style={{ gridTemplateColumns }}>
                  {hasPrizeColumn && (
                    <div className="flex h-[62px] items-center justify-center rounded-[13px] bg-gradient-to-b from-amber-300 to-amber-500 font-mono text-[17px] font-black text-amber-950">
                      P{rowIndex + 1}
                    </div>
                  )}
                  {row.map((cell, colIndex) => {
                    const marked = isApproved && isMarked(cell, drawnNumbers)
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={cn(
                          'flex h-[62px] items-center justify-center rounded-[13px] bg-[#0a0a0a] font-mono text-[29px] font-black leading-none tabular-nums text-white shadow-inner',
                          cell === null && 'text-transparent',
                          cell === 'FREE' && 'bg-gradient-to-b from-amber-300 to-amber-500 text-[15px] text-amber-950',
                          marked && cell !== null && 'bg-emerald-600 text-white ring-2 ring-inset ring-amber-300/70',
                        )}
                      >
                        {cell ?? ''}
                      </div>
                    )
                  })}
                </div>
              ))}
            </section>

            <footer className="mt-auto grid shrink-0 grid-cols-[1fr_auto] items-end gap-4 pt-[18px]">
              <div className="min-w-0">
                <p className="truncate text-[18px] font-black text-amber-50">{card.full_name}</p>
                <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.16em] text-amber-300/85">Emitido {formattedDate}</p>
              </div>
              <div className="rounded-[16px] border border-amber-300/20 bg-black/24 px-4 py-3 text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/45">Formato</p>
                <p className="mt-1 font-mono text-[17px] font-black text-emerald-200">Bingo 90</p>
              </div>
            </footer>
          </div>
        </div>
      </div>
      <style jsx>{`
        div[style] > [data-bingo-artboard='true'] {
          --bingo-card-scale: min(1, calc(100vw / 760));
        }
        @media (min-width: 760px) {
          div[style] > [data-bingo-artboard='true'] {
            --bingo-card-scale: 1;
          }
        }
      `}</style>
    </div>
  )
}

function HeaderCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex h-[46px] items-center justify-center rounded-[12px] px-1 text-center font-mono text-[17px] font-black leading-tight', className)}>
      {children}
    </div>
  )
}
