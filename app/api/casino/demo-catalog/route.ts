import { NextResponse } from 'next/server'
import { CASINO_DEMO_FALLBACK, getCasinoDemoOrigin, getCasinoDemoThumbnail, type CasinoDemoGame } from '@/lib/casino/demo-catalog'

export const dynamic = 'force-dynamic'

export async function GET() {
  const origin = getCasinoDemoOrigin()
  if (!origin) return NextResponse.json({ games: withThumbnails(CASINO_DEMO_FALLBACK), source: 'fallback', configured: false })
  try {
    const response = await fetch(`${origin}/api/games`, { cache: 'no-store', signal: AbortSignal.timeout(4000) })
    if (!response.ok) throw new Error(`Demo server ${response.status}`)
    const payload = await response.json() as Array<CasinoDemoGame & { status?: string; thumb?: unknown }> | { games?: Array<CasinoDemoGame & { status?: string; thumb?: unknown }> }
    const entries = Array.isArray(payload) ? payload : payload.games ?? []
    const games = entries
      .filter((game) => game.symbol && game.name && game.status === 'playable')
      .map((game) => ({
        symbol: game.symbol,
        name: game.name,
        engine: game.engine,
        kind: game.kind,
      }))
    return NextResponse.json({ games: withThumbnails(games), source: 'remote', configured: true })
  } catch {
    return NextResponse.json({ games: withThumbnails(CASINO_DEMO_FALLBACK), source: 'fallback', configured: true })
  }
}

function withThumbnails(games: CasinoDemoGame[]) {
  return games.flatMap((game) => {
    const thumbnail = getCasinoDemoThumbnail(game.symbol)
    if (!thumbnail) return []
    return [{
      ...game,
      thumbnail: `/api/casino/demo-thumbnail/${encodeURIComponent(game.symbol)}`,
    }]
  })
}
