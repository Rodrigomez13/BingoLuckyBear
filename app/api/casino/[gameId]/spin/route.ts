import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getCasinoGameAdapter } from '@/lib/casino/catalog'
import type { CasinoSettlement } from '@/lib/casino/contracts'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ensurePlayerAccount } from '@/lib/wallet/server'

export const runtime = 'nodejs'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId } = await params
    const adapter = getCasinoGameAdapter(gameId)
    if (!adapter) return NextResponse.json({ error: 'Juego de casino no disponible.' }, { status: 404 })

    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Iniciá sesión para jugar.' }, { status: 401 })

    const body = await request.json()
    const stake = Math.trunc(Number(body.stake))
    const selection = String(body.selection ?? '').trim().toLowerCase()
    const roundId = String(body.roundId ?? '').trim()
    if (!adapter.allowedStakes.includes(stake) || !['red', 'black'].includes(selection) || !UUID_PATTERN.test(roundId)) {
      return NextResponse.json({ error: 'Datos de ronda inválidos.' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()
    await ensurePlayerAccount(serviceClient, user)
    const seed = randomBytes(4).readUInt32LE(0)
    const outcome = adapter.resolveRound({ bet: { stake, selection }, seed })
    if (outcome.payout < 0 || outcome.payout > stake * adapter.maxPayoutMultiplier) {
      throw new Error('El adaptador produjo un premio inválido.')
    }

    const { data, error } = await serviceClient.rpc('lbb_settle_casino_round', {
      p_round_id: roundId,
      p_user_id: user.id,
      p_game_id: adapter.id,
      p_stake: stake,
      p_payout: outcome.payout,
      p_seed: seed,
      p_outcome: { result: outcome.result, ...outcome.metadata },
    })
    if (error) {
      const status = /saldo insuficiente/i.test(error.message) ? 409 : 500
      return NextResponse.json({ error: error.message }, { status })
    }
    return NextResponse.json({ ...(data as CasinoSettlement), outcome }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Casino round error:', error)
    return NextResponse.json({ error: 'No se pudo resolver la ronda.' }, { status: 500 })
  }
}
