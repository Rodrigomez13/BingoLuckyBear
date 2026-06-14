'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Trophy } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface RankingItem {
  position: number
  alias: string
  avatar_key: string
  avatar_label: string
  avatar_image_src: string
  matches_played: number
  matches_won: number
  matches_lost: number
  ranking_points: number
  bonus_points_won: number
}

export default function TrucoRankingPage() {
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/truco/ranking', { cache: 'no-store' })
        const data = await response.json()
        if (!data.ok) throw new Error(data.error ?? 'No se pudo cargar el ranking')
        setRanking(data.ranking ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el ranking')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-zinc-100">
      <div className="lbb-ambient" />
      <SiteHeader activePath="truco" kicker="Ranking Truco" compact />

      <section className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-[104px] sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge className="mb-4 rounded-full bg-amber-300 text-zinc-950 hover:bg-amber-300">
              <Trophy className="mr-1 h-3.5 w-3.5" /> Ranking
            </Badge>
            <h1 className="font-mono text-4xl font-black text-white sm:text-6xl">Ranking de Truco</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
              Tabla pública basada en partidas rankeadas finalizadas.
            </p>
          </div>
          <Button asChild className="rounded-full bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200">
            <Link href="/truco">Jugar Truco</Link>
          </Button>
        </div>

        <Card className="border-white/10 bg-zinc-950/85 text-zinc-100">
          <CardHeader>
            <CardTitle className="text-white">Top jugadores</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-amber-200">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando ranking...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div>
            ) : ranking.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-8 text-center text-sm text-zinc-400">
                Todavía no hay partidas rankeadas finalizadas.
              </div>
            ) : (
              <div className="space-y-2">
                {ranking.map((item) => (
                  <div key={`${item.position}-${item.alias}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-8 text-center font-mono text-lg font-black text-amber-300">#{item.position}</span>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-amber-300/25 bg-amber-300/15">
                        <img src={item.avatar_image_src} alt={item.avatar_label} className="h-full w-full object-cover" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">{item.alias}</p>
                        <p className="text-xs text-zinc-500">{item.matches_won}G / {item.matches_lost}P · {item.matches_played} jugadas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xl font-black text-emerald-300">{item.ranking_points}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
