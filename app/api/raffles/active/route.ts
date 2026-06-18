import { NextResponse } from 'next/server'
import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { getCurrentPrizeTarget, getPrizeAmounts, getPrizeAwards } from '@/lib/bingo'

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ raffle: null })
  }

  try {
    const supabase = await createServiceClient()

    const { data: raffle, error } = await supabase
      .from('raffles')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !raffle) {
      return NextResponse.json({ raffle: null })
    }

    const [{ count }, { data: cards }] = await Promise.all([
      supabase
      .from('bingo_cards')
      .select('id', { count: 'exact', head: true })
        .eq('raffle_id', raffle.id),
      supabase
        .from('bingo_cards')
        .select('id, card_number, full_name, bingo_numbers')
        .eq('raffle_id', raffle.id),
    ])

    const drawnNumbers = Array.isArray(raffle.drawn_numbers) ? raffle.drawn_numbers : []
    const prizeAmounts = getPrizeAmounts(raffle.prize, raffle.additional_prizes)
    const prizeAwards = getPrizeAwards(cards ?? [], drawnNumbers, prizeAmounts)
    const currentPrizeTarget = getCurrentPrizeTarget(cards ?? [], drawnNumbers, prizeAmounts)

    return NextResponse.json({ raffle, participantCount: count ?? 0, prizeAwards, currentPrizeTarget })
  } catch (error) {
    console.error('Error fetching active raffle:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
