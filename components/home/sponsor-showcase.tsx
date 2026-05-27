import Image from 'next/image'
import type { ReactNode } from 'react'
import { BadgeDollarSign, CalendarDays, Gift, Megaphone, ShieldCheck, Sparkles, Trophy } from 'lucide-react'
import { PAYMENT_INFO } from '@/lib/payment'

const prizeHighlights = [
  {
    title: 'Premio principal',
    copy: 'El destaque de la semana aparece primero para que el visitante entienda que se juega y por que conviene entrar.',
    icon: Trophy,
    tone: 'from-amber-300 to-orange-500',
  },
  {
    title: 'Rondas especiales',
    copy: 'Fechas tematicas, bingos relampago o premios sorpresa pueden comunicarse sin agregar pasos al formulario.',
    icon: CalendarDays,
    tone: 'from-emerald-300 to-teal-500',
  },
  {
    title: 'Promos visibles',
    copy: 'El espacio de combos o beneficios ayuda a vender mas cartones sin repetir el mismo mensaje de confianza.',
    icon: Gift,
    tone: 'from-sky-300 to-blue-500',
  },
]

const sponsorSlots = ['Marca invitada', 'Combo del sorteo', 'Premio sorpresa']

export function SponsorShowcase() {
  return (
    <section className="border-y border-amber-400/10 bg-zinc-950/55 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900/75 shadow-2xl shadow-black/20">
            <div className="grid min-h-[390px] sm:grid-cols-[230px_minmax(0,1fr)]">
              <div className="relative flex items-center justify-center border-b border-white/10 bg-[radial-gradient(circle_at_50%_35%,rgba(251,191,36,0.35),transparent_14rem),linear-gradient(140deg,rgba(239,68,68,0.22),rgba(16,185,129,0.16))] p-8 sm:border-b-0 sm:border-r">
                <Image
                  src="/logo-contexto.svg"
                  alt="Lucky Bingo Bear"
                  width={260}
                  height={260}
                  className="h-auto w-[min(64vw,220px)] drop-shadow-2xl"
                />
              </div>

              <div className="flex flex-col justify-center p-6 sm:p-8">
                <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-md border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm font-bold text-amber-200">
                  <Sparkles className="h-4 w-4" />
                  Premios, precios y cartones
                </div>
                <h2
                  className="max-w-2xl text-3xl font-black leading-tight text-white sm:text-4xl"
                  style={{ fontFamily: 'var(--font-fredoka)' }}
                >
                  Una landing que muestra el juego antes de pedir el pago
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300">
                  El visitante ve el monto configurado, la mecanica del carton y los espacios de premio en el mismo
                  tramo visual. Menos explicacion repetida, mas decision rapida.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <Metric icon={<BadgeDollarSign className="h-5 w-5" />} value={PAYMENT_INFO.amount} label="monto" />
                  <Metric value="1" label="carton unico" />
                  <Metric value="75" label="numeros" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {prizeHighlights.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.title}
                  className="rounded-lg border border-white/10 bg-zinc-900/75 p-5 shadow-lg shadow-black/15"
                >
                  <div className="flex gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${item.tone} text-zinc-950 shadow-lg`}
                    >
                      <Icon className="h-6 w-6" />
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

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <VisualPanel title="Carton digital">
            <MiniBingoCard />
          </VisualPanel>
          <VisualPanel title="Premio destacado">
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
  return (
    <div className="min-h-24 rounded-md border border-white/10 bg-black/25 p-4">
      <div className="flex items-center gap-2 text-white">
        {icon}
        <p className="text-xl font-black leading-tight break-words">{value}</p>
      </div>
      <p className="mt-2 text-xs font-bold uppercase text-amber-200">{label}</p>
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
  const numbers = [7, 18, 33, 52, 69, 11, 24, 'FREE', 47, 71, 3, 29, 40, 58, 64]

  return (
    <div className="w-full max-w-[230px] overflow-hidden rounded-md border-4 border-amber-300 bg-zinc-950 shadow-2xl">
      <div className="grid grid-cols-5 text-center text-sm font-black text-white">
        {['B', 'I', 'N', 'G', 'O'].map((letter, index) => (
          <div
            key={letter}
            className={['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-blue-500'][index]}
          >
            {letter}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5">
        {numbers.map((number, index) => (
          <div
            key={`${number}-${index}`}
            className="flex aspect-square items-center justify-center border-r border-t border-amber-200 text-xs font-bold text-zinc-100 last:border-r-0"
          >
            {number}
          </div>
        ))}
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
        <Trophy className="mx-auto mb-2 h-9 w-9" />
        <p className="text-2xl font-black">PREMIO</p>
        <p className="text-xs font-bold uppercase">principal</p>
      </div>
    </div>
  )
}

function DrawVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="grid grid-cols-4 gap-2">
        {[5, 14, 26, 39, 48, 53, 62, 75].map((number, index) => (
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
