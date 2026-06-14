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
  customer_profiles?: {
    alias?: string | null
    avatar_key?: string | null
  } | null
}

export async function GET() {
  const serviceClient = await createServiceClient()
  const { data, error } = await serviceClient
    .from('truco_player_stats')
    .select('user_id, matches_played, matches_won, matches_lost, ranking_points, bonus_points_won, last_match_at, customer_profiles(alias, avatar_key)')
    .gt('matches_played', 0)
    .order('ranking_points', { ascending: false })
    .order('matches_won', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ ok: false, error: error.message, ranking: [] })

  return NextResponse.json({
    ok: true,
    ranking: ((data ?? []) as RankingRow[]).map((row, index) => {
      const avatar = getCustomerAvatar(row.customer_profiles?.avatar_key)
      return {
        position: index + 1,
        alias: row.customer_profiles?.alias ?? `Jugador ${row.user_id.slice(0, 4)}`,
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
