import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ card: null, cards: [] })
  }

  try {
    const sessionToken = request.nextUrl.searchParams.get('session_token')
    const raffleId = request.nextUrl.searchParams.get('raffle_id')

    if (!sessionToken || !raffleId) {
      return NextResponse.json(
        { error: 'Parametros faltantes' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    const { data: cards, error } = await supabase
      .from('bingo_cards')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('raffle_id', raffleId)
      .order('created_at', { ascending: true })

    if (error || !cards?.length) {
      return NextResponse.json({ card: null, cards: [] })
    }

    return NextResponse.json({ card: cards[0], cards })
  } catch (error) {
    console.error('Error fetching card:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
