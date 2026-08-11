import Link from 'next/link'
import Image from 'next/image'
import { CircleDot, Diamond, Orbit, Play, Spade, Zap } from 'lucide-react'
import type { CasinoDemoGame } from '@/lib/casino/demo-catalog'

const GAME_VISUALS = [
  { icon: Diamond, palette: 'from-rose-600 via-red-950 to-zinc-950', symbols: ['♦', '7', '♦'] },
  { icon: Spade, palette: 'from-sky-600 via-indigo-950 to-zinc-950', symbols: ['♠', 'A', '♣'] },
  { icon: Zap, palette: 'from-amber-400 via-orange-800 to-zinc-950', symbols: ['⚡', '7', '★'] },
  { icon: Orbit, palette: 'from-violet-600 via-fuchsia-950 to-zinc-950', symbols: ['◉', '◆', '◌'] },
  { icon: CircleDot, palette: 'from-emerald-500 via-teal-950 to-zinc-950', symbols: ['●', '◒', '●'] },
] as const

function visualFor(game: CasinoDemoGame) {
  let hash = 0
  for (const character of game.symbol) hash = (hash * 31 + character.charCodeAt(0)) | 0
  return GAME_VISUALS[Math.abs(hash) % GAME_VISUALS.length]
}

export function CasinoDemoGameCard({ game }: { game: CasinoDemoGame }) {
  const visual = visualFor(game)
  const Icon = visual.icon

  return (
    <Link
      href={`/casino/preview/${encodeURIComponent(game.symbol)}`}
      className="group relative min-w-0 overflow-hidden rounded-[1.35rem] border border-white/10 bg-zinc-950 shadow-xl shadow-black/25 transition hover:-translate-y-1 hover:border-amber-300/60"
    >
      <div className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${visual.palette} p-3`}>
        {game.thumbnail && <Image src={game.thumbnail} alt={`Miniatura de ${game.name}`} fill sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.05]" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/25" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:22px_22px]" />
        {!game.thumbnail && <div className="absolute -right-9 -top-10 h-36 w-36 rounded-full border-[18px] border-white/15" />}
        <div className="relative flex items-start justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.14em] text-amber-100 backdrop-blur">
            <Icon className="h-3.5 w-3.5" /> {game.kind}
          </span>
          <span className="rounded-full bg-black/30 px-2 py-1 text-[9px] font-black uppercase tracking-[.12em] text-white/75">Vista LBB</span>
        </div>
        {!game.thumbnail && <div className="relative mt-5 flex items-center justify-center gap-2">
          {visual.symbols.map((symbol, index) => (
            <span key={`${symbol}-${index}`} className="grid h-14 w-12 place-items-center rounded-xl border border-amber-100/30 bg-black/40 font-serif text-2xl font-black text-amber-100 shadow-lg shadow-black/35 transition group-hover:-translate-y-1">
              {symbol}
            </span>
          ))}
        </div>}
        <p className="absolute bottom-3 left-3 text-[10px] font-black uppercase tracking-[.18em] text-white/70">{game.engine}</p>
      </div>
      <div className="p-3">
        <p className="truncate text-[10px] font-black uppercase tracking-[.18em] text-amber-300/85">Catálogo importado</p>
        <h3 className="mt-1 truncate text-xl font-black text-white">{game.name}</h3>
        <span className="mt-3 flex h-10 items-center justify-center gap-1.5 rounded-xl bg-amber-300 px-3 text-xs font-black uppercase text-zinc-950 transition group-hover:bg-amber-200">
          <Play className="h-4 w-4" /> Ver integración LBB
        </span>
      </div>
    </Link>
  )
}
