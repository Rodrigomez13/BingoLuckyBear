import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentPrizeTarget, getPrizeAmounts, getPrizeAwards } from '@/lib/bingo'
import { getPurchaseAvailability, syncRaffleLifecycle } from '@/lib/raffle-lifecycle'

export async function GET() {
  try {
    const supabase = await createServiceClient()

    const { data: raffle, error } = await supabase
      .from('raffles')
      .select('*, payment_account:payment_accounts(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !raffle) {
      return NextResponse.json({ raffle: null })
    }

    const syncedRaffle = await syncRaffleLifecycle(supabase, raffle)

    if (!syncedRaffle.is_active && syncedRaffle.draw_status === 'finished') {
      return NextResponse.json({ raffle: null, justClosedRaffle: syncedRaffle })
    }

    const [{ count: registeredCount }, { count: approvedCount }, { data: cards }] = await Promise.all([
      supabase
        .from('bingo_cards')
        .select('id', { count: 'exact', head: true })
        .eq('raffle_id', syncedRaffle.id),
      supabase
        .from('bingo_cards')
        .select('id', { count: 'exact', head: true })
        .eq('raffle_id', syncedRaffle.id)
        .eq('payment_status', 'approved'),
      supabase
        .from('bingo_cards')
        .select('id, card_number, full_name, bingo_numbers, payment_status')
        .eq('raffle_id', syncedRaffle.id)
        .eq('payment_status', 'approved'),
    ])

    const drawnNumbers = Array.isArray(syncedRaffle.drawn_numbers) ? syncedRaffle.drawn_numbers : []
    const prizeAmounts = getPrizeAmounts(syncedRaffle.prize, syncedRaffle.additional_prizes)
    const approvedCards = cards ?? []
    const prizeAwards = getPrizeAwards(approvedCards, drawnNumbers, prizeAmounts)
    const currentPrizeTarget = getCurrentPrizeTarget(approvedCards, drawnNumbers, prizeAmounts)
    const purchaseAvailability = getPurchaseAvailability(syncedRaffle)

    return NextResponse.json({
      raffle: syncedRaffle,
      participantCount: approvedCount ?? 0,
      registeredCount: registeredCount ?? 0,
      prizeAwards,
      currentPrizeTarget,
      salesClosed: !purchaseAvailability.canPurchase,
      salesClosedReason: purchaseAvailability.reason,
    })
  } catch (error) {
    console.error('Error fetching active raffle:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
