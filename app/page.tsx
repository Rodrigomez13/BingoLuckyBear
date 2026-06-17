import { LobbyOperativoHome } from '@/components/home/lobby-operativo-home'
import { getCustomerAvatar, getCustomerAvatarImageSrc } from '@/lib/customer/avatars'
import { getPrizeAmounts, getPrizeSchedule } from '@/lib/bingo'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { summarizePublicRoom, type PublicRoomSummary, type StoredTrucoRoom } from '@/lib/truco/server-authority'
import { syncRaffleLifecycle } from '@/lib/raffle-lifecycle'

export const dynamic = 'force-dynamic'

async function getHomeRaffleContext() {
  try {
    const supabase = await createServiceClient()
    const { data: activeData } = await supabase
      .from('raffles')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: nextData } = await supabase
      .from('raffles')
      .select('*')
      .or('draw_status.is.null,draw_status.neq.finished')
      .not('draw_date', 'is', null)
      .gte('draw_date', new Date().toISOString())
      .order('draw_date', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!activeData) {
      return { activeRaffle: null, nextRaffle: nextData ?? null }
    }

    const raffle = await syncRaffleLifecycle(supabase, activeData)

    if (!raffle.is_active && raffle.draw_status === 'finished') {
      return { activeRaffle: null, nextRaffle: nextData ?? null }
    }

    return { activeRaffle: raffle, nextRaffle: nextData ?? null }
  } catch (error) {
    console.error('Error fetching active raffle promo:', error)
    return { activeRaffle: null, nextRaffle: null }
  }
}

async function getHomePlayerContext() {
  try {
    const authClient = await createClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) return null

    const serviceClient = await createServiceClient()
    const [{ data: profile }, { data: wallet }] = await Promise.all([
      serviceClient
        .from('customer_profiles')
        .select('alias, avatar_key, avatar_image_src')
        .eq('id', user.id)
        .maybeSingle(),
      serviceClient
        .from('lbb_wallets')
        .select('general_balance')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    const alias = profile?.alias || user.email?.split('@')[0] || 'Jugador'
    const avatar = getCustomerAvatar(profile?.avatar_key)

    return {
      alias,
      email: user.email,
      balance: Number(wallet?.general_balance ?? 0),
      avatarSrc: profile?.avatar_image_src || getCustomerAvatarImageSrc(avatar.key),
      level: 18,
      xp: 3250,
      nextLevelXp: 5000,
    }
  } catch (error) {
    console.error('Error fetching player context:', error)
    return null
  }
}

async function getHomeTrucoRooms(): Promise<PublicRoomSummary[]> {
  try {
    const serviceClient = await createServiceClient()
    const { data, error } = await serviceClient
      .from('truco_rooms')
      .select('*')
      .eq('visibility', 'public')
      .in('status', ['waiting', 'playing'])
      .order('updated_at', { ascending: false })
      .limit(4)

    if (error) throw error

    return ((data ?? []) as StoredTrucoRoom[]).map(summarizePublicRoom)
  } catch (error) {
    console.error('Error fetching home truco rooms:', error)
    return []
  }
}

export default async function HomePage() {
  const [{ activeRaffle, nextRaffle }, player, rooms] = await Promise.all([
    getHomeRaffleContext(),
    getHomePlayerContext(),
    getHomeTrucoRooms(),
  ])
  const prizeAmounts = getPrizeAmounts(activeRaffle?.prize, activeRaffle?.additional_prizes)
  const prizeSchedule = getPrizeSchedule(prizeAmounts)
  const jackpotPrize = prizeSchedule.find((target) => target.prizeNumber === 4)?.amount

  return (
    <LobbyOperativoHome
      activeRaffle={activeRaffle}
      nextRaffle={nextRaffle}
      jackpotPrize={jackpotPrize}
      rooms={rooms}
      player={player}
    />
  )
}
