import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { GOLDEN_BEAR_DEFAULT_SETTINGS, normalizeGoldenBearSettings } from '@/lib/games/golden-bear/config'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const serviceClient = await createServiceClient()
    const { data, error } = await serviceClient
      .from('golden_bear_settings')
      .select('enabled, bonus_buy_enabled, bonus_buy_price, bonus_buy_spins, bonus_buy_label, bonus_buy_description, valid_stakes')
      .eq('id', 'default')
      .maybeSingle()

    if (error) {
      return NextResponse.json(GOLDEN_BEAR_DEFAULT_SETTINGS, { headers: { 'Cache-Control': 'no-store' } })
    }

    return NextResponse.json(normalizeGoldenBearSettings(data), { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json(GOLDEN_BEAR_DEFAULT_SETTINGS, { headers: { 'Cache-Control': 'no-store' } })
  }
}
