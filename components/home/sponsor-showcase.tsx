import Image from 'next/image'
import type { ReactNode } from 'react'
import { CalendarDays, Gift, Megaphone, ShieldCheck, Sparkles, Trophy } from 'lucide-react'

const prizeHighlights = [
  {
    title: 'Premios destacados',
    copy: 'Muestra aqui el premio principal, combos especiales o beneficios de la semana.',
    icon: Trophy,
    tone: 'from-amber-400 to-orange-500',
  },
  {
    title: 'Sorteos especiales',
    copy: 'Reserva este bloque para fechas fuertes, rondas relampago o bingos tematicos.',
    icon: CalendarDays,
    tone: 'from-emerald-400 to-teal-500',
  },
  {
    title: 'Bonos y promos',
    copy: 'Un lugar visible para anunciar bonificaciones, codigos o premios sorpresa.',
    icon: Gift,
    tone: 'from-sky-400 to-blue-500',
  },
]

const sponsorSlots = [
  'Sponsor principal',
  'Banner lateral',
  'Promo del sorteo',
]

export function SponsorShowcase() {
  return (
    <section className="border-y border-amber-400/10 bg-zinc-950/55 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900/70 shadow-2xl shadow-black/20">
            <div className="grid min-h-[360px] sm:grid-cols-[240px_minmax(0,1fr)]">
              <div className="flex items-center justify-center border-b border-white/10 bg-gradient-to-br from-amber-400/18 via-red-500/10 to-emerald-400/12 p-8 sm:border-b-0 sm:border-r">
                <Image
                  src="/logo-contexto.svg"
                  alt="Lucky Bingo Bear"
                  width={260}
                  height={260}
                  className="h-auto w-[min(64vw,220px)] drop-shadow-2xl"
                />
              </div>

              <div className="flex flex-col justify-center p-6 sm:p-8">
                <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-md border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-200">
                  <Sparkles className="h-4 w-4" />
                  Sorteos con presencia visual
                </div>
                <h2
                  className="max-w-2xl text-3xl font-bold text-white sm:text-4xl"
                  style={{ fontFamily: 'var(--font-fredoka)' }}
                >
                  Mas contexto para que cada bingo se sienta activo
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300">
                  Usa esta zona para presentar premios, marcas amigas, fechas importantes y mensajes del sorteo sin sacar
                  al usuario del camino principal de participacion.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <Metric value="75" label="bolillas" />
                  <Metric value="24/7" label="carton online" />
                  <Metric value="Live" label="sorteo visible" />
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
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${item.tone} text-white shadow-lg`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-fredoka)' }}>
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
          <VisualPanel title="Cartones en pantalla">
            <MiniBingoCard />
          </VisualPanel>
          <VisualPanel title="Premios y combos">
            <PrizeVisual />
          </VisualPanel>
          <VisualPanel title="Momento del sorteo">
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

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-4">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-amber-200">{label}</p>
    </div>
  )
}

function VisualPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900/70">
      <div className="flex h-48 items-center justify-center bg-black/25 p-5">{children}</div>
      <div className="border-t border-white/10 px-5 py-4">
        <p className="font-semibold text-white">{title}</p>
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
      <div className="rounded-lg border border-amber-300/45 bg-gradient-to-br from-amber-300 to-orange-500 px-8 py-6 text-center text-zinc-950 shadow-2xl">
        <Trophy className="mx-auto mb-2 h-9 w-9" />
        <p className="text-2xl font-black">PREMIO</p>
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
      <div className="absolute bottom-4 right-4 rounded-md border border-red-400/30 bg-red-500/15 px-3 py-2 text-xs font-bold uppercase tracking-wide text-red-200">
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
          <p className="text-xs font-bold uppercase tracking-wide">Publicidad</p>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-fredoka)' }}>
            {title}
          </h3>
          <p className="mt-1 text-sm text-zinc-400">Tu marca, premio o promocion puede ir aqui.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-200">
          <ShieldCheck className="h-4 w-4" />
          Espacio listo
        </div>
      </div>
    </div>
  )
}
