import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getUserAccess } from '@/lib/auth/roles'
import { getCustomerAvatar, getCustomerAvatarImageSrc } from '@/lib/customer/avatars'
import { ensurePlayerAccount } from '@/lib/wallet/server'

function isEmailVerified(user: { email_confirmed_at?: string | null; confirmed_at?: string | null }) {
  return Boolean(user.email_confirmed_at || user.confirmed_at)
}

function metadataString(user: { user_metadata?: Record<string, unknown> | null }, key: string) {
  const value = user.user_metadata?.[key]
  return typeof value === 'string' ? value : null
}

function isHttpImageUrl(value?: string | null) {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ authenticated: false, user: null, player: null, access: null, email_verified: false })
  }

  const emailVerified = isEmailVerified(user)
  if (!emailVerified) {
    return NextResponse.json({
      authenticated: false,
      verification_required: true,
      email_verified: false,
      user: { id: user.id, email: user.email },
      player: null,
      access: null,
    })
  }

  const serviceClient = await createServiceClient()
  await ensurePlayerAccount(serviceClient, user)

  const access = await getUserAccess(user)
  const [{ data: profile }, { data: wallet }] = await Promise.all([
    serviceClient
      .from('customer_profiles')
      .select('alias, avatar_key, full_name, dni, phone')
      .eq('id', user.id)
      .maybeSingle(),
    serviceClient
      .from('lbb_wallets')
      .select('general_balance')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const avatar = getCustomerAvatar(profile?.avatar_key)
  const alias = profile?.alias || profile?.full_name || user.email?.split('@')[0] || 'Jugador'
  const googleAvatarUrl = metadataString(user, 'picture') ?? metadataString(user, 'avatar_url')
  const shouldUseGoogleAvatar = isHttpImageUrl(googleAvatarUrl) && (!profile?.avatar_key || profile.avatar_key === 'golden_bear')
  const profileComplete = Boolean(profile?.alias && profile?.full_name && profile?.dni && profile?.phone)

  return NextResponse.json({
    authenticated: true,
    email_verified: true,
    user: {
      id: user.id,
      email: user.email,
      name: metadataString(user, 'name') ?? metadataString(user, 'full_name'),
    },
    player: {
      alias,
      avatar_key: avatar.key,
      avatar_label: avatar.label,
      avatar_image_src: shouldUseGoogleAvatar ? googleAvatarUrl : getCustomerAvatarImageSrc(avatar.key),
      google_avatar_url: isHttpImageUrl(googleAvatarUrl) ? googleAvatarUrl : null,
      profile_complete: profileComplete,
      full_name: profile?.full_name ?? null,
      dni: profile?.dni ?? null,
      phone: profile?.phone ?? null,
    },
    wallet: { total_balance: Number(wallet?.general_balance ?? 0) },
    access,
  })
}
