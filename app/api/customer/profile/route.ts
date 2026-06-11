import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isReasonablePhone, normalizePhoneNumber } from '@/lib/phone'

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? '').trim().slice(0, maxLength)
}

function normalizeProfilePayload(body: Record<string, unknown>, fallbackEmail?: string | null) {
  const fullName = cleanText(body.full_name, 120)
  const dni = cleanText(body.dni, 20)
  const address = cleanText(body.address, 180)
  const phone = normalizePhoneNumber(body.phone)
  const email = cleanText(body.email || fallbackEmail, 160).toLowerCase()
  const payoutAccountKind = cleanText(body.payout_account_kind, 20)
  const payoutAccount = cleanText(body.payout_account, 80)
  const payoutHolderName = cleanText(body.payout_holder_name, 120)

  if (email && !isValidEmail(email)) {
    throw new Error('Ingresa un correo electronico valido')
  }

  if (phone && !isReasonablePhone(phone)) {
    throw new Error('Ingresa un telefono valido')
  }

  if (payoutAccountKind && !['Alias', 'CBU', 'CVU'].includes(payoutAccountKind)) {
    throw new Error('Selecciona un tipo de cuenta valido')
  }

  return {
    full_name: fullName || null,
    dni: dni || null,
    address: address || null,
    phone: phone || null,
    email: email || null,
    payout_account_kind: payoutAccountKind || null,
    payout_account: payoutAccount || null,
    payout_holder_name: payoutHolderName || null,
    updated_at: new Date().toISOString(),
  }
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ user: null, profile: null })
  }

  const { data, error } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'No se pudo cargar el perfil' }, { status: 500 })
  }

  return NextResponse.json({ user: { id: user.id, email: user.email }, profile: data })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const profile = normalizeProfilePayload(body, user.email)

    const { data, error } = await supabase
      .from('customer_profiles')
      .upsert({ id: user.id, ...profile }, { onConflict: 'id' })
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ profile: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar el perfil'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
