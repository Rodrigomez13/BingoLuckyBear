import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ensurePlayerAccount } from '@/lib/wallet/server'
import { playGoldenBearRound } from '../../../../../new_games/js/round.mjs'

export const runtime = 'nodejs'

const VALID_STAKES = new Set([25, 50, 100, 200, 500, 1000])
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Iniciá sesión para jugar.' }, { status: 401 })

    const body = await request.json()
    const stake = Math.trunc(Number(body.stake))
    const roundId = String(body.roundId ?? '').trim()
    if (!VALID_STAKES.has(stake) || !UUID_PATTERN.test(roundId)) {
      return NextResponse.json({ error: 'Datos de ronda inválidos.' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()
    await ensurePlayerAccount(serviceClient, user)

    const seed = randomBytes(4).readUInt32LE(0)
    const outcome = playGoldenBearRound({ seed, stake })
    const { data, error } = await serviceClient.rpc('lbb_settle_golden_bear_round', {
      p_round_id: roundId,
      p_user_id: user.id,
      p_stake: stake,
      p_payout: outcome.payout,
      p_seed: seed,
      p_outcome: outcome,
    })

    if (error) {
      const status = /saldo insuficiente/i.test(error.message) ? 409 : 500
      return NextResponse.json({ error: error.message }, { status })
    }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Golden Bear spin error:', error)
    return NextResponse.json({ error: 'No se pudo resolver la ronda.' }, { status: 500 })
  }
}
