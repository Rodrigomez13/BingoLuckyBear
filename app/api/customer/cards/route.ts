import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ user: null, cards: [] })
  }

  const { data, error } = await supabase
    .from('bingo_cards')
    .select('id, card_number, full_name, created_at, payment_status, receipt_amount, payment_method, payment_reference, bingo_numbers, raffle:raffles(id, name, draw_date, draw_status, drawn_numbers, prize, additional_prizes)')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching customer cards:', error)
    return NextResponse.json({ error: 'No se pudieron cargar tus cartones' }, { status: 500 })
  }

  return NextResponse.json({ user: { id: user.id, email: user.email }, cards: data ?? [] })
}
