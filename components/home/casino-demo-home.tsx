'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CasinoDemoGameCard } from '@/components/casino/casino-demo-game-card'
import type { CasinoDemoGame } from '@/lib/casino/demo-catalog'

export function CasinoDemoHome() {
  const [games, setGames] = useState<CasinoDemoGame[]>([])

  useEffect(() => {
    fetch('/api/casino/demo-catalog')
      .then((response) => response.json())
      .then((data) => setGames(data.games ?? []))
      .catch(() => setGames([]))
  }, [])

  if (!games.length) return null

  return (
    <section className="rounded-[2rem] border border-violet-300/15 bg-[linear-gradient(135deg,rgba(124,58,237,.13),rgba(250,204,21,.06),rgba(0,0,0,.22))] p-4 shadow-2xl shadow-black/20">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-200">Experiencias invitadas</p>
          <h2 className="font-mono text-2xl font-black uppercase text-white">Casino integrado</h2>
          <p className="mt-1 text-sm text-emerald-50/65">Sólo juegos jugables con miniatura disponible. Cada uno abre la vista de integración LBB.</p>
        </div>
        <Link href="/casino" className="rounded-xl border border-violet-200/25 px-3 py-2 text-xs font-black uppercase text-violet-100 hover:bg-violet-300/10">Ver catálogo</Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {games.map((game) => <CasinoDemoGameCard key={game.symbol} game={game} />)}
      </div>
    </section>
  )
}
