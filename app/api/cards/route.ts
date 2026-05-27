import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      raffle_id, 
      full_name, 
      dni, 
      address, 
      phone, 
      email, 
      payment_receipt_url,
      session_token 
    } = body

    // Validate all required fields
    if (!raffle_id || !full_name || !dni || !address || !phone || !email || !payment_receipt_url || !session_token) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      )
    }

    // Use service client to bypass RLS for inserting
    const supabase = await createServiceClient()

    // Check if raffle is active
    const { data: raffle, error: raffleError } = await supabase
      .from('raffles')
      .select('id, is_active')
      .eq('id', raffle_id)
      .eq('is_active', true)
      .single()

    if (raffleError || !raffle) {
      return NextResponse.json(
        { error: 'El sorteo no esta disponible' },
        { status: 400 }
      )
    }

    // Check if this session already has a card for this raffle
    const { data: existingCard } = await supabase
      .from('bingo_cards')
      .select('id, card_number')
      .eq('raffle_id', raffle_id)
      .eq('session_token', session_token)
      .single()

    if (existingCard) {
      return NextResponse.json(
        { error: 'Ya tienes un carton para este sorteo', card_number: existingCard.card_number },
        { status: 409 }
      )
    }

    // Generate unique card number
    const card_number = `LBB-${nanoid(8).toUpperCase()}`

    // Insert the card
    const { data: card, error: insertError } = await supabase
      .from('bingo_cards')
      .insert({
        card_number,
        raffle_id,
        full_name,
        dni,
        address,
        phone,
        email,
        payment_receipt_url,
        session_token,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Error al crear el carton' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      card_number: card.card_number,
      card_id: card.id 
    })
  } catch (error) {
    console.error('Error creating card:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
