'use client'

import { useEffect, useState } from 'react'
import type { CasinoDemoGame } from '@/lib/casino/demo-catalog'
import { CasinoDemoGameCard } from '@/components/casino/casino-demo-game-card'

export function CasinoDemoCatalog() {
  const [games, setGames] = useState<CasinoDemoGame[]>([])
  const [source, setSource] = useState<'remote' | 'fallback' | null>(null)

  useEffect(() => {
    fetch('/api/casino/demo-catalog').then((response) => response.json()).then((data) => {
      setGames(data.games ?? [])
      setSource(data.source ?? 'fallback')
    }).catch(() => setSource('fallback'))
  }, [])

  return <section className="mt-10"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-black">Catálogo de casino</h2><p className="mt-1 text-sm text-zinc-400">Mostramos únicamente juegos jugables con miniatura disponible. Cada acceso abre la vista de integración LBB.</p></div><span className="rounded-full border border-amber-300/25 px-3 py-1 text-xs text-amber-200">{source === 'remote' ? `${games.length} juegos del catálogo` : `${games.length} juegos disponibles`}</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{games.map((game) => <CasinoDemoGameCard key={game.symbol} game={game} />)}</div></section>
}
