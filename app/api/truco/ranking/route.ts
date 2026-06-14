import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCustomerAvatar } from '@/lib/customer/avatars'

interface RankingRow {
  user_id: string
  matches_played: number
  matches_won: number
  matches_lost: number
  ranking_points: number
  bonus_points_won: number
  last_match_at: string | null
}

interface ProfileRow {
  id: string
  alias?: string | null
  avatar_key?: string | null
}

export async function GET() {
  const serviceClient = await createServiceClient()
  const { data, error } = await serviceClient
    .from('truco_player_stats')
    .select('user_id, matches_played, matches_won, matches_lost, ranking_points, bonus_points_won, last_match_at')
    .gt('matches_played', 0)
    .order('ranking_points', { ascending: false })
    .order('matches_won', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ ok: false, error: error.message, ranking: [] })

  const rows = (data ?? []) as RankingRow[]
  const userIds = rows.map((row) => row.user_id)
  const { data: profiles } = userIds.length
    ? await serviceClient.from('customer_profiles').select('id, alias, avatar_key').in('id', userIds)
    : { data: [] as ProfileRow[] }

  const profileById = new Map((profiles as ProfileRow[]).map((profile) => [profile.id, profile]))

  return NextResponse.json({
    ok: true,
    ranking: rows.map((row, index) => {
      const profile = profileById.get(row.user_id)
      const avatar = getCustomerAvatar(profile?.avatar_key)
      return {
        position: index + 1,
        alias: profile?.alias ?? `Jugador ${row.user_id.slice(0, 4)}`,
        avatar_key: avatar.key,
        avatar_emoji: avatar.emoji,
        matches_played: row.matches_played,
        matches_won: row.matches_won,
        matches_lost: row.matches_lost,
        ranking_points: row.ranking_points,
        bonus_points_won: row.bonus_points_won,
        last_match_at: row.last_match_at,
      }
    }),
  })
}
