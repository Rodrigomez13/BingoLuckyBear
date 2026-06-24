import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ensurePlayerAccount } from '@/lib/wallet/server'
import { normalizeGoldenBearSettings } from '@/lib/games/golden-bear/config'
import { playGoldenBearRound } from '../../../../../new_games/js/round.mjs'

export const runtime = 'nodejs'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Iniciá sesión para jugar.' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const roundId = String(body.roundId ?? '').trim()
    if (!UUID_PATTERN.test(roundId)) return NextResponse.json({ error: 'Datos de bonus inválidos.' }, { status: 400 })

    const serviceClient = await createServiceClient()
    await ensurePlayerAccount(serviceClient, user)

    const { data: settingsRow } = await serviceClient
      .from('golden_bear_settings')
      .select('enabled, bonus_buy_enabled, bonus_buy_price, bonus_buy_spins, bonus_buy_label, bonus_buy_description, valid_stakes')
      .eq('id', 'default')
      .maybeSingle()
    const settings = normalizeGoldenBearSettings(settingsRow)

    if (!settings.enabled || !settings.bonusBuyEnabled) {
      return NextResponse.json({ error: 'La compra de bonus está deshabilitada.' }, { status: 403 })
    }

    const stake = settings.bonusBuyPrice
    const spinsToAward = settings.bonusBuySpins
    const seed = randomBytes(4).readUInt32LE(0)
    const base = playGoldenBearRound({ seed, stake })
    const spins = Array.isArray(base.spins) ? [...base.spins] : []

    if (spins[0]) {
      spins[0] = {
        ...spins[0],
        scatters: Math.max(3, Number(spins[0].scatters ?? 3)),
        awardedFreeSpins: spinsToAward,
      }
    }

    let payout = Number(base.payout ?? 0)
    for (let index = 0; index < spinsToAward; index++) {
      const freeRound = playGoldenBearRound({ seed: (seed + index + 1) >>> 0, stake })
      const freeSpin = Array.isArray(freeRound.spins) ? freeRound.spins[0] : null
      if (freeSpin) {
        spins.push({
          ...freeSpin,
          free: true,
          freeSpinsRemaining: Math.max(0, spinsToAward - index - 1),
        })
      }
      payout += Number(freeRound.payout ?? 0)
    }

    const outcome = {
      ...base,
      type: 'bonus_buy',
      bonusBuy: true,
      bonusBuyPrice: stake,
      awardedFreeSpins: spinsToAward,
      spins,
      payout,
    }

    const { data, error } = await serviceClient.rpc('lbb_settle_golden_bear_round', {
      p_round_id: roundId,
      p_user_id: user.id,
      p_stake: stake,
      p_payout: payout,
      p_seed: seed,
      p_outcome: outcome,
    })

    if (error) {
      const status = /saldo insuficiente/i.test(error.message) ? 409 : 500
      return NextResponse.json({ error: error.message }, { status })
    }

    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Golden Bear bonus buy error:', error)
    return NextResponse.json({ error: 'No se pudo comprar el bonus.' }, { status: 500 })
  }
}
