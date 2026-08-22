import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getCustomerAvatar, isCustomerAvatarKey } from '@/lib/customer/avatars'
import { ensurePlayerAccount } from '@/lib/wallet/server'

function cleanAlias(value: unknown) {
  return String(value ?? '').trim().replace(/[^a-zA-Z0-9_\-.]/g, '').slice(0, 24)
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ user: null, player: null })

  const serviceClient = await createServiceClient()
  await ensurePlayerAccount(serviceClient, user)

  const { data, error } = await serviceClient
    .from('customer_profiles')
    .select('id, email, alias, avatar_key')
    .eq('id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    player: {
      alias: data?.alias ?? null,
      avatar_key: data?.avatar_key ?? getCustomerAvatar().key,
    },
  })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const alias = cleanAlias(body.alias)
  const avatarKey = isCustomerAvatarKey(body.avatar_key) ? body.avatar_key : getCustomerAvatar().key

  if (alias && alias.length < 3) {
    return NextResponse.json({ error: 'El alias debe tener al menos 3 caracteres' }, { status: 400 })
  }

  const serviceClient = await createServiceClient()
  await ensurePlayerAccount(serviceClient, user)

  const { data, error } = await serviceClient
    .from('customer_profiles')
    .update({ alias: alias || null, avatar_key: avatarKey, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select('alias, avatar_key')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ player: data })
}
