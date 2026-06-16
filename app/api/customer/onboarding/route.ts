import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getCustomerAvatar, isCustomerAvatarKey } from '@/lib/customer/avatars'
import { isReasonablePhone, normalizePhoneNumber } from '@/lib/phone'
import { ensurePlayerAccount } from '@/lib/wallet/server'

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? '').trim().slice(0, maxLength)
}

function cleanAlias(value: unknown) {
  return String(value ?? '').trim().replace(/[^a-zA-Z0-9_\-.]/g, '').slice(0, 24)
}

function normalizeDni(value: unknown) {
  return cleanText(value, 20).replace(/[^\d]/g, '').slice(0, 11)
}

export async function PUT(request: NextRequest) {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const alias = cleanAlias(body.alias)
  const fullName = cleanText(body.full_name, 120)
  const dni = normalizeDni(body.dni)
  const phone = normalizePhoneNumber(cleanText(body.phone, 40))
  const avatarKey = isCustomerAvatarKey(body.avatar_key) ? body.avatar_key : getCustomerAvatar().key
  const useGooglePhoto = body.avatar_source === 'google'

  if (alias.length < 3) {
    return NextResponse.json({ error: 'El nickname debe tener al menos 3 caracteres' }, { status: 400 })
  }

  if (fullName.length < 3) {
    return NextResponse.json({ error: 'Ingresá tu nombre' }, { status: 400 })
  }

  if (dni.length < 7) {
    return NextResponse.json({ error: 'Ingresá un DNI válido' }, { status: 400 })
  }

  if (!phone || !isReasonablePhone(phone)) {
    return NextResponse.json({ error: 'Ingresá un teléfono válido' }, { status: 400 })
  }

  const serviceClient = await createServiceClient()
  await ensurePlayerAccount(serviceClient, user)

  const { data, error } = await serviceClient
    .from('customer_profiles')
    .upsert({
      id: user.id,
      email: user.email?.toLowerCase() ?? null,
      alias,
      avatar_key: useGooglePhoto ? getCustomerAvatar().key : avatarKey,
      full_name: fullName,
      dni,
      phone,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select('id, email, alias, avatar_key, full_name, dni, phone')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ profile: data })
}
