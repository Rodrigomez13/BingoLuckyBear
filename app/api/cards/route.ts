import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

// Generate unique bingo numbers following standard bingo rules
// B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
function generateBingoNumbers(): number[][] {
  const ranges = [
    { min: 1, max: 15 },   // B
    { min: 16, max: 30 },  // I
    { min: 31, max: 45 },  // N
    { min: 46, max: 60 },  // G
    { min: 61, max: 75 },  // O
  ]

  const card: number[][] = []

  for (let col = 0; col < 5; col++) {
    const { min, max } = ranges[col]
    const available = Array.from({ length: max - min + 1 }, (_, i) => min + i)
    const column: number[] = []

    // Pick 5 unique numbers for each column (or 4 for N column with free space)
    const count = col === 2 ? 4 : 5 // N column has free space in center
    
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * available.length)
      column.push(available[randomIndex])
      available.splice(randomIndex, 1)
    }

    // Sort numbers in column
    column.sort((a, b) => a - b)

    // For N column, insert 0 (free space) in the middle
    if (col === 2) {
      column.splice(2, 0, 0) // 0 represents FREE space
    }

    card.push(column)
  }

  return card
}

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

    // Generate bingo card numbers
    const bingo_numbers = generateBingoNumbers()

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
        bingo_numbers,
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
      card_id: card.id,
      bingo_numbers: card.bingo_numbers
    })
  } catch (error) {
    console.error('Error creating card:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
