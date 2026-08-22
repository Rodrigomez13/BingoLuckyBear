import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { syncRaffleLifecycle } from '@/lib/raffle-lifecycle'

export const dynamic = 'force-dynamic'

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET

  if (!secret) {
    return false
  }

  const authHeader = request.headers.get('authorization')
  const querySecret = request.nextUrl.searchParams.get('secret')

  return authHeader === `Bearer ${secret}` || querySecret === secret
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const supabase = await createServiceClient()
    const { data: raffles, error } = await supabase
      .from('raffles')
      .select('*, payment_account:payment_accounts(*)')
      .eq('is_active', true)
      .in('draw_status', ['idle', 'running'])

    if (error) {
      throw error
    }

    const results = []

    for (const raffle of raffles ?? []) {
      const synced = await syncRaffleLifecycle(supabase, raffle)
      results.push({
        id: synced.id,
        name: synced.name,
        status: synced.draw_status,
        drawn_numbers: synced.drawn_numbers?.length ?? 0,
        is_active: synced.is_active,
      })
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      raffles: results,
    })
  } catch (error) {
    console.error('Cron raffle sync error:', error)
    return NextResponse.json({ error: 'No se pudieron sincronizar los sorteos' }, { status: 500 })
  }
}
