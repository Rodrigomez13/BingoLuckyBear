import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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

    const { data: card, error } = await supabase
      .from('bingo_cards')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('raffle_id', raffleId)
      .single()

    if (error || !card) {
      return NextResponse.json({ card: null })
    }

    return NextResponse.json({ card })
  } catch (error) {
    console.error('Error fetching card:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
