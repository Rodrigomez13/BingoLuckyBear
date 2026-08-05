import { NextResponse } from 'next/server'
import { CASINO_DEMO_FALLBACK, getCasinoDemoOrigin, type CasinoDemoGame } from '@/lib/casino/demo-catalog'

export const dynamic = 'force-dynamic'

export async function GET() {
  const origin = getCasinoDemoOrigin()
  if (!origin) return NextResponse.json({ games: CASINO_DEMO_FALLBACK, source: 'fallback', configured: false })
  try {
    const response = await fetch(`${origin}/api/games`, { cache: 'no-store', signal: AbortSignal.timeout(4000) })
    if (!response.ok) throw new Error(`Demo server ${response.status}`)
    const payload = await response.json() as { games?: CasinoDemoGame[] }
    const games = (payload.games ?? []).filter((game) => game.symbol && game.name)
    return NextResponse.json({ games, source: 'remote', configured: true })
  } catch {
    return NextResponse.json({ games: CASINO_DEMO_FALLBACK, source: 'fallback', configured: true })
  }
}
