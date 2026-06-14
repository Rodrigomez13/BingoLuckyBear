import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCustomerAvatar, isCustomerAvatarKey } from '@/lib/customer/avatars'
import { ensurePlayerAccount } from '@/lib/wallet/server'

function cleanEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase().slice(0, 160)
}

function cleanPassword(value: unknown) {
  return String(value ?? '')
}

function cleanAlias(value: unknown) {
  return String(value ?? '').trim().replace(/[^a-zA-Z0-9_\-.]/g, '').slice(0, 24)
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = cleanEmail(body.email)
    const password = cleanPassword(body.password)
    const alias = cleanAlias(body.alias)
    const avatarKey = isCustomerAvatarKey(body.avatar_key) ? body.avatar_key : getCustomerAvatar().key

    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: 'Ingresá un correo válido.' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 })
    }

    if (alias && alias.length < 3) {
      return NextResponse.json({ ok: false, error: 'El alias debe tener al menos 3 caracteres.' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()
    const { data, error } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        alias: alias || null,
        avatar_key: avatarKey,
      },
    })

    if (error || !data.user) {
      const message = error?.message?.toLowerCase().includes('already')
        ? 'Ese correo ya está registrado. Iniciá sesión con tu contraseña.'
        : error?.message || 'No se pudo crear la cuenta.'
      return NextResponse.json({ ok: false, error: message }, { status: 400 })
    }

    await ensurePlayerAccount(serviceClient, data.user)

    await serviceClient
      .from('customer_profiles')
      .update({
        email,
        alias: alias || null,
        avatar_key: avatarKey,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.user.id)

    return NextResponse.json({ ok: true, user: { id: data.user.id, email } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado al crear la cuenta.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
