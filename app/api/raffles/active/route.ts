import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
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

    const { count } = await supabase
      .from('bingo_cards')
      .select('id', { count: 'exact', head: true })
      .eq('raffle_id', raffle.id)

    return NextResponse.json({ raffle, participantCount: count ?? 0 })
  } catch (error) {
    console.error('Error fetching active raffle:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
