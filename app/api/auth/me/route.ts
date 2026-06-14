import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getUserAccess } from '@/lib/auth/roles'
import { getCustomerAvatar, getCustomerAvatarImageSrc } from '@/lib/customer/avatars'
import { ensurePlayerAccount } from '@/lib/wallet/server'

function isEmailVerified(user: { email_confirmed_at?: string | null; confirmed_at?: string | null }) {
  return Boolean(user.email_confirmed_at || user.confirmed_at)
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
  const { data: profile } = await serviceClient
    .from('customer_profiles')
    .select('alias, avatar_key, full_name')
    .eq('id', user.id)
    .maybeSingle()

  const avatar = getCustomerAvatar(profile?.avatar_key)
  const alias = profile?.alias || profile?.full_name || user.email?.split('@')[0] || 'Jugador'

  return NextResponse.json({
    authenticated: true,
    email_verified: true,
    user: { id: user.id, email: user.email },
    player: {
      alias,
      avatar_key: avatar.key,
      avatar_label: avatar.label,
      avatar_image_src: getCustomerAvatarImageSrc(avatar.key),
    },
    access,
  })
}
