import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Gamepad2, Swords, Ticket, Trophy } from 'lucide-react'
import type { ComponentType } from 'react'
import type { PlatformGame, PlatformGameId } from '@/lib/games/registry'
import { walletModeLabel } from '@/lib/games/registry'

type IconType = ComponentType<{ className?: string }>

const catalogIcons: Partial<Record<PlatformGameId, IconType>> = {
  bingo: Ticket,
  truco: Swords,
  truco_anotador: Swords,
  golden_bear: Trophy,
  viborita: Gamepad2,
}

interface GameCatalogCardProps {
  game: PlatformGame
  priority?: boolean
}

export function GameCatalogCard({ game, priority = false }: GameCatalogCardProps) {
  const Icon = catalogIcons[game.id] ?? Gamepad2

  return (
    <Link
      href={game.href}
      data-sound={game.sound}
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-gradient-to-br ${game.accent} shadow-xl shadow-black/25 transition hover:-translate-y-1 hover:border-amber-300/45`}
    >
      <div className="relative aspect-[16/10] min-h-0 overflow-hidden bg-black/35">
        <Image
          src={game.visualAsset}
          alt={game.name}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
          priority={priority}
          className="object-cover transition duration-300 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/10 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-lime-200 backdrop-blur">
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{game.statusLabel}</span>
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-amber-300/85">{game.subtitle}</p>
        <h3 className="mt-1 truncate text-xl font-black text-white">{game.name}</h3>
        <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-200">
          {walletModeLabel(game.walletMode)}
        </span>
      </div>

      <span className="mx-3 mb-3 flex h-10 items-center justify-center rounded-xl bg-amber-300 px-3 text-xs font-black uppercase text-zinc-950 group-hover:bg-amber-200">
        <span className="truncate">{game.cta}</span>
        <ChevronRight className="ml-1 h-4 w-4 shrink-0" />
      </span>
    </Link>
  )
}
