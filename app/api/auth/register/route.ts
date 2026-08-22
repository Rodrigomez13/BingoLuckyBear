import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'
import { getCustomerAvatar, isCustomerAvatarKey } from '@/lib/customer/avatars'
import { getAuthCallbackUrl, getSiteUrl } from '@/lib/site-url'

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
      return NextResponse.json({ ok: false, error: 'El alias debe tener al menos 3 caracteres' }, { status: 400 })
    }

    const origin = getSiteUrl(request.headers.get('origin'))
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: 'lbb-auth-session',
        },
      },
    )

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthCallbackUrl('/mi-cuenta/jugador', origin),
        data: {
          alias: alias || null,
          avatar_key: avatarKey,
        },
      },
    })

    if (error) {
      const message = error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('registered')
        ? 'Ese correo ya está registrado. Iniciá sesión con tu contraseña.'
        : error.message || 'No se pudo crear la cuenta.'
      return NextResponse.json({ ok: false, error: message }, { status: 400 })
    }

    if (data.session && data.user) {
      const serviceClient = await createServiceClient()
      await serviceClient.auth.admin.deleteUser(data.user.id)
      return NextResponse.json(
        {
          ok: false,
          error: 'Registro bloqueado: tenés que activar la confirmación de email en Supabase Auth antes de permitir nuevas cuentas.',
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      ok: true,
      requires_email_confirmation: true,
      user: data.user ? { id: data.user.id, email } : null,
      message: 'Cuenta creada. Revisá tu correo y confirmá el enlace antes de iniciar sesión.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado al crear la cuenta.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
