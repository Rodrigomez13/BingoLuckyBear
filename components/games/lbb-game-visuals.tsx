import { Gamepad2, Sparkles, Swords, Ticket, Trophy, type LucideIcon } from 'lucide-react'
import type { PlatformGame, PlatformGameId } from '@/lib/games/registry'

type VisualSpec = {
  title: string
  ribbon: string
  miniature: string
  promo: Array<{ title: string; detail: string }>
  stats: Array<{ label: string; value: string }>
  symbols: string[]
  icon: LucideIcon
  tone: string
}

const visualSpecs: Record<PlatformGameId, VisualSpec> = {
  golden_bear: {
    title: 'Golden Bear',
    ribbon: 'Lucky Ways',
    miniature: 'Slot de cascadas',
    promo: [
      { title: 'Bonus', detail: 'Giros gratis' },
      { title: 'Jackpot', detail: 'Pozo actual' },
      { title: 'Misión', detail: 'Girá y ganá' },
    ],
    stats: [
      { label: 'Slots', value: 'LBB' },
      { label: 'Volatilidad', value: 'Alta' },
      { label: 'Saldo', value: 'Único' },
    ],
    symbols: ['♛', '🐾', '🪙', '★'],
    icon: Trophy,
    tone: 'from-amber-300/28 via-orange-500/18 to-emerald-950/40',
  },
  bingo: {
    title: 'Bingo',
    ribbon: 'Sorteos LBB',
    miniature: 'Bolillero en vivo',
    promo: [
      { title: 'Cartón', detail: 'Comprá y jugá' },
      { title: 'Sorteo', detail: 'En vivo' },
      { title: 'Racha', detail: 'Completá líneas' },
    ],
    stats: [
      { label: 'Cartones', value: 'Activos' },
      { label: 'Premios', value: 'LBB' },
      { label: 'Sorteos', value: 'Live' },
    ],
    symbols: ['7', '28', '45', '12'],
    icon: Ticket,
    tone: 'from-purple-500/24 via-amber-300/16 to-emerald-950/44',
  },
  truco: {
    title: 'Truco',
    ribbon: 'Cartas LBB',
    miniature: 'Mesas rápidas',
    promo: [
      { title: 'Mesa', detail: 'Al instante' },
      { title: 'Torneo', detail: 'Semanal' },
      { title: 'Ranking', detail: 'Truquero' },
    ],
    stats: [
      { label: 'Mesas', value: 'Activas' },
      { label: 'Anti-cheat', value: 'Justo' },
      { label: 'Rival', value: 'Online' },
    ],
    symbols: ['1♠', '7♦', '3♣', '12🏆'],
    icon: Swords,
    tone: 'from-emerald-400/22 via-lime-300/12 to-black/38',
  },
  viborita: {
    title: 'Viborita',
    ribbon: 'Arcade LBB',
    miniature: 'Desafío semanal',
    promo: [
      { title: 'Combo', detail: 'Sumá puntos' },
      { title: 'Misión', detail: 'Diaria' },
      { title: 'Nivel', detail: 'Subí XP' },
    ],
    stats: [
      { label: 'Arcade', value: 'LBB' },
      { label: 'Ranking', value: 'Pronto' },
      { label: 'Logros', value: 'XP' },
    ],
    symbols: ['●', '■', '◆', '✦'],
    icon: Gamepad2,
    tone: 'from-lime-300/22 via-emerald-400/16 to-black/40',
  },
  future_games: {
    title: 'LBB',
    ribbon: 'Roadmap',
    miniature: 'Nuevos juegos',
    promo: [
      { title: 'Ruleta', detail: 'Próxima' },
      { title: 'Torneos', detail: 'Globales' },
      { title: 'VIP', detail: 'Beneficios' },
    ],
    stats: [
      { label: 'Wallet', value: 'Lista' },
      { label: 'Admin', value: 'Modular' },
      { label: 'Eventos', value: 'Live' },
    ],
    symbols: ['✦', '◆', '●', '★'],
    icon: Sparkles,
    tone: 'from-fuchsia-400/20 via-violet-400/12 to-black/42',
  },
}

export function GameShowcaseVisual({ game, compact = false }: { game: PlatformGame; compact?: boolean }) {
  const spec = visualSpecs[game.id]
  const Icon = spec.icon

  return (
    <div className={`relative overflow-hidden rounded-[1.4rem] border border-amber-300/25 bg-gradient-to-br ${spec.tone} shadow-2xl shadow-black/35 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,232,160,.22),transparent_28%),radial-gradient(circle_at_88%_22%,rgba(74,222,128,.12),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.35))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,215,128,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,215,128,.5)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="min-w-0 rounded-[1.1rem] border border-amber-300/20 bg-black/35 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200/80">LBB Originals</p>
              <h3 className={`${compact ? 'text-2xl' : 'text-3xl'} mt-1 font-serif font-black uppercase leading-none text-amber-100 drop-shadow-[0_2px_0_rgba(72,24,0,.8)]`}>
                {spec.title}
              </h3>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-amber-300/40 bg-amber-300/15 text-amber-100 shadow-[inset_0_0_18px_rgba(251,191,36,.18)]">
              <Icon className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-3 inline-flex rounded-full border border-emerald-300/25 bg-emerald-950/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-lime-200">
            {spec.ribbon}
          </div>

          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {spec.symbols.map((symbol) => (
              <span key={symbol} className="grid aspect-square place-items-center rounded-xl border border-amber-300/25 bg-black/45 font-serif text-lg font-black text-amber-100 shadow-inner">
                {symbol}
              </span>
            ))}
          </div>
        </div>

        <div className="grid min-w-0 gap-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {spec.promo.map((item) => (
              <div key={item.title} className="rounded-xl border border-amber-300/20 bg-black/38 p-2.5 text-center shadow-inner">
                <p className="font-serif text-sm font-black uppercase leading-tight text-amber-100">{item.title}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-100/70">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-amber-300/20 bg-[radial-gradient(circle_at_center,rgba(251,191,36,.12),transparent_55%),rgba(0,0,0,.34)] p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300/80">Miniatura lobby</p>
                <p className="mt-1 font-serif text-xl font-black uppercase text-white">{spec.miniature}</p>
              </div>
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-amber-300/30 bg-amber-300/15 font-mono text-lg font-black text-amber-100">
                {game.logo}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {spec.stats.map((item) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-emerald-950/38 px-2 py-2 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-100/55">{item.label}</p>
                <p className="mt-0.5 text-xs font-black text-amber-200">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
