import Image from 'next/image'
import type { ReactNode } from 'react'
import { BadgeDollarSign, Megaphone, ShieldCheck, Sparkles } from 'lucide-react'
import { PAYMENT_INFO } from '@/lib/payment'
import { formatMoneyAmount } from '@/lib/bingo'

const prizeHighlights = [
  {
    title: 'Premios descendentes',
    copy: 'El premio mayor se destaca primero y los premios secundarios mantienen una jerarquia facil de entender.',
    asset: '/brand/winner-crown.svg',
    tone: 'from-amber-300 to-orange-500',
  },
  {
    title: 'Sorteo inverso',
    copy: 'La partida inicia por el premio 3, sigue con el premio 2 y reserva el premio principal para el cierre.',
    asset: '/brand/gold-medal.svg',
    tone: 'from-emerald-300 to-teal-500',
  },
  {
    title: 'Una fila, un premio',
    copy: 'Cada carton muestra filas identificadas para que el participante sepa que esta siguiendo en vivo.',
    asset: '/brand/confetti-coins.svg',
    tone: 'from-sky-300 to-blue-500',
  },
]

const sponsorSlots = ['Marca invitada', 'Combo del sorteo', 'Premio sorpresa']

export function SponsorShowcase() {
  const paymentAmount = /\d/.test(PAYMENT_INFO.amount) ? formatMoneyAmount(PAYMENT_INFO.amount) : 'A confirmar'

  return (
    <section className="border-y border-white/10 bg-zinc-950/62 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-zinc-900/78 shadow-xl shadow-black/20">
            <Image
              src="/brand/confetti-coins.svg"
              alt=""
              width={520}
              height={320}
              className="pointer-events-none absolute -right-28 -top-28 h-auto w-96 opacity-20"
            />
            <div className="grid sm:grid-cols-[220px_minmax(0,1fr)]">
              <div className="relative flex items-center justify-center border-b border-white/10 bg-[radial-gradient(circle_at_50%_35%,rgba(251,191,36,0.35),transparent_14rem),linear-gradient(140deg,rgba(239,68,68,0.22),rgba(16,185,129,0.16))] p-8 sm:border-b-0 sm:border-r">
                <Image
                  src="/logo-contexto.svg"
                  alt="Lucky Bingo Bear"
                  width={260}
                  height={260}
                  className="h-auto w-[min(64vw,220px)] drop-shadow-2xl"
                />
              </div>

              <div className="flex flex-col justify-center p-5 sm:p-6">
                <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-md border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm font-bold text-amber-200">
                  <Sparkles className="h-4 w-4" />
                  Premio, carton y sorteo en una sola vista
                </div>
                <h2
                  className="max-w-2xl text-2xl font-black leading-tight text-white sm:text-3xl"
                  style={{ fontFamily: 'var(--font-fredoka)' }}
                >
                  Una experiencia visual lista para convertir visitas en participantes
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300">
                  El visitante entiende que puede comprar, recibir su carton y mirar el sorteo sin saltar entre mensajes
                  dispersos. La interfaz prioriza decision rapida, confianza y lectura mobile.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <Metric icon={<BadgeDollarSign className="h-5 w-5" />} value={paymentAmount} label="monto" />
                  <Metric value="1" label="carton por compra" />
                  <Metric value="90" label="bolillas" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid self-start gap-4">
            {prizeHighlights.map((item) => {
              return (
                <div
                  key={item.title}
                  className="min-h-[132px] rounded-lg border border-white/10 bg-zinc-900/75 p-5 shadow-lg shadow-black/15"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${item.tone} text-zinc-950 shadow-lg`}
                    >
                      <Image src={item.asset} alt="" width={42} height={42} className="h-10 w-10 object-contain" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white" style={{ fontFamily: 'var(--font-fredoka)' }}>
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-400">{item.copy}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <VisualPanel title="Carton digital">
            <MiniBingoCard />
          </VisualPanel>
          <VisualPanel title="Orden de premios">
            <PrizeVisual />
          </VisualPanel>
          <VisualPanel title="Bolillas cantadas">
            <DrawVisual />
          </VisualPanel>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {sponsorSlots.map((slot) => (
            <AdSlot key={slot} title={slot} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Metric({ value, label, icon }: { value: string; label: string; icon?: ReactNode }) {
  const isLongValue = value.length > 12

  return (
    <div className="flex min-h-24 flex-col justify-between rounded-md border border-white/10 bg-black/25 p-4">
      <div className="flex min-w-0 items-start gap-2 text-white">
        {icon && <span className="mt-1 shrink-0">{icon}</span>}
        <p className={`${isLongValue ? 'text-base' : 'text-2xl'} min-w-0 break-words font-black leading-tight`}>
          {value}
        </p>
      </div>
      <p className="mt-3 text-xs font-bold uppercase leading-tight text-amber-200">{label}</p>
    </div>
  )
}

function VisualPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900/70">
      <div className="flex h-52 items-center justify-center bg-black/25 p-5">{children}</div>
      <div className="border-t border-white/10 px-5 py-4">
        <p className="font-bold text-white">{title}</p>
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
    <div className="w-full max-w-[300px] overflow-hidden rounded-md border-4 border-amber-300 bg-zinc-950 shadow-2xl">
      <div className="grid grid-cols-[2rem_repeat(9,minmax(0,1fr))] text-center text-[10px] font-black text-white">
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
          <div key={`p-${rowIndex}`} className="flex aspect-square items-center justify-center border-r border-t border-amber-200 bg-amber-400 text-xs font-black text-zinc-950">
            P{rowIndex + 1}
          </div>,
          ...row.map((number, index) => (
          <div
            key={`${number}-${rowIndex}-${index}`}
            className="flex aspect-square items-center justify-center border-r border-t border-amber-200 text-xs font-bold text-zinc-100 last:border-r-0"
          >
            {number}
          </div>
          )),
        ])}
      </div>
    </div>
  )
}

function PrizeVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="absolute left-8 top-8 h-16 w-16 rounded-full bg-emerald-400 text-center text-xl font-black leading-[4rem] text-zinc-950 shadow-xl">
        21
      </div>
      <div className="absolute right-8 top-10 h-14 w-14 rounded-full bg-sky-400 text-center text-lg font-black leading-[3.5rem] text-zinc-950 shadow-xl">
        54
      </div>
      <div className="rounded-lg border border-amber-200 bg-gradient-to-br from-amber-300 to-orange-500 px-8 py-6 text-center text-zinc-950 shadow-2xl">
        <Image src="/brand/gold-medal.svg" alt="" width={54} height={54} className="mx-auto mb-2 h-12 w-12 object-contain" />
        <p className="text-2xl font-black">P3 - P2 - P1</p>
        <p className="text-xs font-bold uppercase">mayor al final</p>
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
            className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-black text-white shadow-lg ${
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
      <div className="absolute bottom-4 right-4 rounded-md border border-red-400/30 bg-red-500/15 px-3 py-2 text-xs font-bold uppercase text-red-200">
        En vivo
      </div>
    </div>
  )
}

function AdSlot({ title }: { title: string }) {
  return (
    <div className="relative min-h-[150px] overflow-hidden rounded-lg border border-dashed border-amber-300/35 bg-zinc-900/55 p-5">
      <div className="absolute -right-6 -top-6 opacity-10">
        <Image src="/logo-solo.svg" alt="" width={130} height={130} className="h-auto w-[130px]" />
      </div>
      <div className="relative flex h-full flex-col justify-between gap-5">
        <div className="flex items-center gap-2 text-amber-200">
          <Megaphone className="h-4 w-4" />
          <p className="text-xs font-bold uppercase">Espacio visual</p>
        </div>
        <div>
          <h3 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-fredoka)' }}>
            {title}
          </h3>
          <p className="mt-1 text-sm text-zinc-400">Ideal para destacar sponsors, premios reales o beneficios activos.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-bold text-emerald-200">
          <ShieldCheck className="h-4 w-4" />
          Listo para actualizar
        </div>
      </div>
    </div>
  )
}
