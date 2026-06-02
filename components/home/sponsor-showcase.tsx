import Image from 'next/image'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { BadgeDollarSign, Radio, Sparkles, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatMoneyAmount, type BingoPrizeTarget } from '@/lib/bingo'
import { formatArgentinaDate } from '@/lib/date'

const prizeHighlights = [
  {
    title: 'Premios visibles',
    copy: 'Antes de comprar ves los montos disponibles y que condicion gana cada premio.',
    asset: '/brand/winner-crown.svg',
    tone: 'from-amber-300 to-orange-500',
  },
  {
    title: 'Carton digital',
    copy: 'Cada carton queda identificado y participa automaticamente cuando comienza el sorteo.',
    asset: '/brand/gold-medal.svg',
    tone: 'from-emerald-300 to-teal-500',
  },
  {
    title: 'Aviso y pago',
    copy: 'Si tu carton gana, te llega el aviso por WhatsApp y se coordina el pago con tus datos.',
    asset: '/brand/confetti-coins.svg',
    tone: 'from-sky-300 to-blue-500',
  },
]

interface SponsorShowcaseProps {
  activeAmount?: string | null
  drawDate?: string | null
  prizeSchedule?: BingoPrizeTarget[]
  hasActiveRaffle?: boolean
  nextRaffleName?: string | null
}

export function SponsorShowcase({
  activeAmount,
  drawDate,
  prizeSchedule = [],
  hasActiveRaffle = true,
  nextRaffleName,
}: SponsorShowcaseProps) {
  const paymentAmount = formatMoneyAmount(activeAmount, 'A confirmar')
  const visiblePrizes = prizeSchedule.filter((target) => target.amount)
  const nextDraw = formatArgentinaDate(drawDate)
  const title = hasActiveRaffle
    ? 'Compras una vez y tu carton sigue participando'
    : 'No hay sorteo activo en este momento'
  const copy = hasActiveRaffle
    ? 'No tenes que estar marcando bolillas. El sorteo actualiza tu carton, publica el resultado y te avisa si salis ganador.'
    : `Aguarda la fecha del proximo sorteo${nextRaffleName ? `: ${nextRaffleName}` : ''}. Cuando este habilitado, la compra de cartones vuelve a estar disponible.`

  return (
    <section className="lbb-scroll-reveal border-y border-[#04f77c]/20 bg-black/25 py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)]">
          <div className="lbb-compact-card relative h-full overflow-hidden rounded-xl lg:min-h-[24rem]">
            <Image
              src="/brand/confetti-coins.svg"
              alt=""
              width={520}
              height={320}
              className="pointer-events-none absolute -right-28 -top-28 h-auto w-96 opacity-20"
            />
            <div className="grid h-full min-[520px]:grid-cols-[140px_minmax(0,1fr)] sm:grid-cols-[160px_minmax(0,1fr)]">
              <div className="relative flex min-h-32 items-start justify-center border-b border-[#04f77c]/20 bg-[radial-gradient(circle_at_50%_22%,rgba(4,247,124,0.22),transparent_10rem),linear-gradient(150deg,rgba(249,115,22,0.12),rgba(4,247,124,0.1))] px-5 pb-5 pt-6 min-[520px]:min-h-0 min-[520px]:border-b-0 min-[520px]:border-r">
                <Image
                  src="/logo-contexto.svg"
                  alt="Lucky Bingo Bear"
                  width={260}
                  height={260}
                  className="h-auto w-[min(42vw,128px)] drop-shadow-2xl lg:w-[min(48vw,150px)]"
                />
              </div>

              <div className="flex min-w-0 flex-col justify-center p-4 sm:p-5">
                <div className="mb-3 inline-flex h-8 w-fit items-center gap-2 rounded border border-[#04f77c]/35 bg-[#04f77c]/10 px-3 text-xs font-bold uppercase tracking-wide text-[#04f77c]">
                  <Sparkles className="h-4 w-4" />
                  Beneficios
                </div>
                <h2 className="max-w-2xl break-words text-2xl font-bold leading-tight tracking-normal text-white">
                  {title}
                </h2>
                <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-slate-400">
                  {copy}
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  {hasActiveRaffle ? (
                    <Button asChild className="h-9 rounded bg-[#04f77c] px-4 text-sm font-bold text-zinc-950 hover:bg-[#30e17b]">
                      <Link href="/participar">
                        <Ticket className="mr-2 h-4 w-4" />
                        Comprar carton
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="h-9 rounded bg-[#04f77c] px-4 text-sm font-bold text-zinc-950 hover:bg-[#30e17b]">
                      <Link href="/ganadores">
                        <Ticket className="mr-2 h-4 w-4" />
                        Ver referencias
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="outline" className="h-9 rounded border-white/20 bg-transparent px-4 text-sm font-bold text-white hover:border-[#04f77c] hover:text-[#04f77c]">
                    <Link href="/en-vivo">
                      <Radio className="mr-2 h-4 w-4" />
                      Ver vivo
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="border-t border-white/10 p-5 sm:col-span-2 sm:p-6">
                <div className="grid auto-rows-fr gap-3 sm:grid-cols-3">
                  <Metric icon={<BadgeDollarSign className="h-5 w-5" />} value={hasActiveRaffle ? paymentAmount : 'Sin venta'} label={hasActiveRaffle ? 'carton' : 'estado'} />
                  <Metric value={hasActiveRaffle ? 'Auto' : 'Espera'} label={hasActiveRaffle ? 'marcado' : 'compra'} />
                  <Metric value={nextDraw} label="sorteo" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid auto-rows-fr gap-4 min-[520px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-1">
            {prizeHighlights.map((item) => {
              return (
                <div key={item.title} className="lbb-compact-card h-full p-4 transition-all duration-300 hover:border-[#04f77c]/60">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gradient-to-br ${item.tone} text-zinc-950`}
                    >
                      <Image src={item.asset} alt="" width={40} height={40} className="h-9 w-9 object-contain" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-bold leading-6 tracking-normal text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1 break-words text-sm leading-6 text-slate-400">{item.copy}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-4 grid auto-rows-fr gap-4 min-[520px]:grid-cols-2 md:grid-cols-3">
          <VisualPanel title="Carton digital">
            <MiniBingoCard />
          </VisualPanel>
          <VisualPanel title="Premios">
            <PrizeVisual prizes={visiblePrizes} hasActiveRaffle={hasActiveRaffle} />
          </VisualPanel>
          <VisualPanel title="Bolillas cantadas">
            <DrawVisual />
          </VisualPanel>
        </div>
      </div>
    </section>
  )
}

function Metric({ value, label, icon }: { value: string; label: string; icon?: ReactNode }) {
  const isLongValue = value.length > 10

  return (
    <div className="flex h-full min-h-20 flex-col justify-between rounded border border-[#04f77c]/20 bg-black/35 p-3">
      <div className="flex min-w-0 items-center gap-2 text-white">
        {icon && <span className="shrink-0 text-zinc-200">{icon}</span>}
        <p className={`${isLongValue ? 'text-sm' : 'text-xl'} min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-bold leading-tight`}>
          {value}
        </p>
      </div>
      <p className="mt-3 text-[11px] font-bold uppercase leading-tight tracking-wide text-[#04f77c]">{label}</p>
    </div>
  )
}

function VisualPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="lbb-compact-card flex h-full min-h-[15rem] flex-col overflow-hidden transition-all duration-300 hover:border-[#04f77c]/60">
      <div className="flex min-h-44 flex-1 items-center justify-center bg-black/20 p-4">{children}</div>
      <div className="border-t border-[#04f77c]/20 px-4 py-3">
        <p className="font-mono text-sm font-bold tracking-normal text-white">{title}</p>
      </div>
    </div>
  )
}

function MiniBingoCard() {
  const rows = [
    [7, null, 23, 34, null, 56, null, 71, 88],
    [null, 16, null, 39, 45, null, 64, 77, null],
    [3, 19, 28, null, null, 58, 69, null, 90],
  ]
  const labels = ['1-9', '10', '20', '30', '40', '50', '60', '70', '80']

  return (
    <div className="w-full max-w-[300px] overflow-hidden rounded-md border-[3px] border-amber-300 bg-zinc-950 shadow-2xl">
      <div className="grid grid-cols-[2rem_repeat(9,minmax(0,1fr))] text-center text-[9px] font-medium leading-none text-white">
        <div className="bg-amber-800 text-amber-100">P</div>
        {labels.map((letter, index) => (
          <div
            key={letter}
            className={['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-blue-500', 'bg-sky-500', 'bg-violet-500', 'bg-pink-500', 'bg-teal-500'][index]}
          >
            {letter}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[2rem_repeat(9,minmax(0,1fr))]">
        {rows.flatMap((row, rowIndex) => [
          <div key={`p-${rowIndex}`} className="flex aspect-square items-center justify-center border-r border-t border-amber-200 bg-amber-400 text-[10px] font-semibold text-zinc-950">
            P{rowIndex + 1}
          </div>,
          ...row.map((number, index) => (
          <div
            key={`${number}-${rowIndex}-${index}`}
            className="flex aspect-square items-center justify-center border-r border-t border-amber-200 text-xs font-semibold text-zinc-100 last:border-r-0"
          >
            {number}
          </div>
          )),
        ])}
      </div>
    </div>
  )
}

function PrizeVisual({ prizes, hasActiveRaffle }: { prizes: BingoPrizeTarget[]; hasActiveRaffle: boolean }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="absolute left-8 top-8 h-14 w-14 rounded-full bg-emerald-400 text-center text-lg font-bold leading-[3.5rem] text-zinc-950 shadow-xl">
        21
      </div>
      <div className="absolute right-8 top-10 h-12 w-12 rounded-full bg-sky-400 text-center text-base font-bold leading-[3rem] text-zinc-950 shadow-xl">
        54
      </div>
      <div className="rounded-lg border border-amber-200 bg-gradient-to-br from-amber-300 to-orange-500 px-8 py-6 text-center text-zinc-950 shadow-2xl">
        <Image src="/brand/gold-medal.svg" alt="" width={54} height={54} className="mx-auto mb-2 h-12 w-12 object-contain" />
        {hasActiveRaffle && prizes.length > 0 ? (
          <div className="space-y-1">
            {prizes.slice(0, 4).map((prize) => (
              <p key={prize.prizeNumber} className="text-sm font-bold">
                {prize.label}: {prize.amount}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-xl font-bold">{hasActiveRaffle ? 'Premios a confirmar' : 'Sin sorteo activo'}</p>
        )}
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide">{hasActiveRaffle ? 'sin orden fijo' : 'proximo a publicar'}</p>
      </div>
    </div>
  )
}

function DrawVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="grid grid-cols-4 gap-2">
        {[5, 14, 26, 39, 48, 53, 62, 90].map((number, index) => (
          <div
            key={number}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg ${
              index % 4 === 0
                ? 'bg-red-500'
                : index % 4 === 1
                  ? 'bg-amber-500'
                  : index % 4 === 2
                    ? 'bg-emerald-500'
                    : 'bg-blue-500'
            }`}
          >
            {number}
          </div>
        ))}
      </div>
      <div className="absolute bottom-4 right-4 rounded-md border border-red-400/30 bg-red-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-200">
        En vivo
      </div>
    </div>
  )
}
