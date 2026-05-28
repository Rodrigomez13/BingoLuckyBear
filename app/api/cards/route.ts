import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateBingoNumbers } from '@/lib/bingo'
import { nanoid } from 'nanoid'

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function hasReasonableLength(value: string, min: number, max: number) {
  const length = value.trim().length
  return length >= min && length <= max
}

function normalizeQuantity(value: unknown) {
  const quantity = Number(value ?? 1)

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    return null
  }

  return quantity
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
      payment_method,
      payment_reference,
      quantity: requestedQuantity,
      session_token 
    } = body
    const quantity = normalizeQuantity(requestedQuantity)

    // Validate all required fields
    if (!raffle_id || !full_name || !dni || !address || !phone || !email || !payment_receipt_url || !session_token) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      )
    }

    if (!payment_method || !payment_reference) {
      return NextResponse.json(
        { error: 'Indica el metodo de pago y el numero de operacion del comprobante' },
        { status: 400 }
      )
    }

    if (!quantity) {
      return NextResponse.json(
        { error: 'La cantidad de cartones debe ser entre 1 y 10' },
        { status: 400 }
      )
    }

    if (
      !hasReasonableLength(full_name, 3, 120) ||
      !hasReasonableLength(address, 6, 180) ||
      !hasReasonableLength(phone, 6, 40) ||
      !hasReasonableLength(dni, 6, 20)
    ) {
      return NextResponse.json(
        { error: 'Revisa nombre, DNI, direccion y telefono. Hay datos incompletos o demasiado largos.' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Ingresa un correo electronico valido' }, { status: 400 })
    }

    if (!/^[a-zA-Z0-9 .:_-]{4,60}$/.test(payment_reference.trim())) {
      return NextResponse.json(
        { error: 'El numero de operacion debe tener entre 4 y 60 caracteres validos' },
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

    const seenCards = new Set<string>()
    const cardsToInsert = Array.from({ length: quantity }, () => {
      let bingo_numbers = generateBingoNumbers()
      let signature = JSON.stringify(bingo_numbers)

      while (seenCards.has(signature)) {
        bingo_numbers = generateBingoNumbers()
        signature = JSON.stringify(bingo_numbers)
      }

      seenCards.add(signature)

      return {
        card_number: `LBB-${nanoid(8).toUpperCase()}`,
        raffle_id,
        full_name: full_name.trim(),
        dni: dni.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        payment_receipt_url,
        payment_method,
        payment_reference: payment_reference.trim(),
        session_token,
        bingo_numbers,
      }
    })

    let { data: cards, error: insertError } = await supabase
      .from('bingo_cards')
      .insert(cardsToInsert)
      .select()

    if (insertError && /payment_(method|reference)/i.test(insertError.message)) {
      const fallbackPayload = cardsToInsert.map((card) => ({
        card_number: card.card_number,
        raffle_id: card.raffle_id,
        full_name: card.full_name,
        dni: card.dni,
        address: card.address,
        phone: card.phone,
        email: card.email,
        payment_receipt_url: card.payment_receipt_url,
        session_token: card.session_token,
        bingo_numbers: card.bingo_numbers,
      }))
      const fallback = await supabase
        .from('bingo_cards')
        .insert(fallbackPayload)
        .select()

      cards = fallback.data
      insertError = fallback.error
    }

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Error al crear el carton' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      quantity,
      cards: cards ?? [],
      card_number: cards?.[0]?.card_number,
      card_id: cards?.[0]?.id,
      bingo_numbers: cards?.[0]?.bingo_numbers
    })
  } catch (error) {
    console.error('Error creating card:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
