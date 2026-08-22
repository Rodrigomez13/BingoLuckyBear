'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { CasinoDemoGame } from '@/lib/casino/demo-catalog'

export function CasinoDemoCatalog() {
  const [games, setGames] = useState<CasinoDemoGame[]>([])
  const [source, setSource] = useState<'remote' | 'fallback' | null>(null)

  useEffect(() => {
    fetch('/api/casino/demo-catalog').then((response) => response.json()).then((data) => {
      setGames(data.games ?? [])
      setSource(data.source ?? 'fallback')
    }).catch(() => setSource('fallback'))
  }, [])

  return <section className="mt-10"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-black">Demos de casino</h2><p className="mt-1 text-sm text-zinc-400">Los demos no usan saldo LBB ni acreditan premios.</p></div><span className="rounded-full border border-amber-300/25 px-3 py-1 text-xs text-amber-200">{source === 'remote' ? `${games.length} juegos detectados` : 'Catálogo inicial'}</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{games.map((game) => <Link key={game.symbol} href={`/casino/demo/${encodeURIComponent(game.symbol)}`} className="rounded-2xl border border-white/10 bg-zinc-900 p-5 transition hover:border-amber-300/60 hover:bg-zinc-800"><p className="text-xs font-semibold uppercase tracking-wider text-amber-300">{game.kind} · {game.engine}</p><h3 className="mt-2 text-lg font-bold">{game.name}</h3><p className="mt-4 text-sm text-zinc-400">Abrir demo</p></Link>)}</div></section>
}
