import type { ReactNode } from 'react'
import Image from 'next/image'
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
  {
    title: 'Transparencia total',
    copy: 'El sorteo se puede seguir en vivo y los resultados quedan publicados para revisar.',
    asset: '/brand/winner-crown.svg',
    tone: 'from-lime-300 to-emerald-500',
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
  hasActiveRaffle = true,
  nextRaffleName,
}: SponsorShowcaseProps) {
  const paymentAmount = formatMoneyAmount(activeAmount, 'A confirmar')
  const nextDraw = formatArgentinaDate(drawDate)
  const title = hasActiveRaffle
    ? 'Compras una vez y tu carton sigue participando'
    : 'No hay sorteo activo en este momento'
  const copy = hasActiveRaffle
    ? 'No tenes que estar marcando bolillas. El sorteo actualiza tu carton, publica el resultado y te avisa si salis ganador.'
    : `Aguarda la fecha del proximo sorteo${nextRaffleName ? `: ${nextRaffleName}` : ''}. Cuando este habilitado, la compra de cartones vuelve a estar disponible.`

  return (
    <section className="lbb-scroll-reveal py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)]">
          <div className="lbb-premium-panel relative h-full overflow-hidden rounded-[1.5rem] lg:min-h-[24rem]">
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
                <div className="mb-3 inline-flex h-9 w-fit items-center gap-2 rounded-full border border-[#04f77c]/25 bg-[#04f77c]/10 px-4 text-xs font-bold uppercase tracking-[0.18em] text-[#04f77c]">
                  <Sparkles className="h-4 w-4" />
                  Beneficios
                </div>
                <h2 className="max-w-2xl break-words text-3xl font-bold leading-tight tracking-normal text-white sm:text-4xl">
                  {title}
                </h2>
                <p className="mt-3 max-w-2xl break-words text-base leading-7 text-slate-400">
                  {copy}
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  {hasActiveRaffle ? (
                    <Button asChild className="h-10 rounded-full bg-amber-300 px-5 text-sm font-bold text-zinc-950 hover:bg-amber-200">
                      <Link href="/participar">
                        <Ticket className="mr-2 h-4 w-4" />
                        Comprar carton
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="h-10 rounded-full bg-amber-300 px-5 text-sm font-bold text-zinc-950 hover:bg-amber-200">
                      <Link href="/ganadores">
                        <Ticket className="mr-2 h-4 w-4" />
                        Ver referencias
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="outline" className="h-10 rounded-full border-white/20 bg-transparent px-5 text-sm font-bold text-white hover:border-amber-300 hover:text-amber-200">
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

          <div className="grid auto-rows-fr gap-4 min-[520px]:grid-cols-2">
            {prizeHighlights.map((item) => {
              return (
                <div key={item.title} className="h-full rounded-[1.2rem] border border-white/10 bg-white/[0.045] p-4 shadow-xl shadow-black/15 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300/45">
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

