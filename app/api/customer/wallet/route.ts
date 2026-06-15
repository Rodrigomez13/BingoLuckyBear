import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ensurePlayerAccount } from '@/lib/wallet/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ user: null, wallet: null, transactions: [], stats: null, trucoHistory: [] })

  const serviceClient = await createServiceClient()
  await ensurePlayerAccount(serviceClient, user)

  const [{ data: wallet, error: walletError }, { data: transactions }, { data: stats }, { data: history }] = await Promise.all([
    serviceClient
      .from('lbb_wallets')
      .select('general_balance, updated_at')
      .eq('user_id', user.id)
      .single(),
    serviceClient
      .from('lbb_wallet_transactions')
      .select('id, wallet_kind, transaction_type, amount, balance_after, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(12),
    serviceClient
      .from('truco_player_stats')
      .select('matches_played, matches_won, matches_lost, points_for, points_against, ranking_points, bonus_points_won, bonus_points_spent, last_match_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    serviceClient
      .from('truco_match_history')
      .select('id, room_code, winner_user_id, target_score, player_score, opponent_score, entry_fee_points, prize_points, ranked, finished_at')
      .or(`player_user_id.eq.${user.id},opponent_user_id.eq.${user.id}`)
      .order('finished_at', { ascending: false })
      .limit(10),
  ])

  if (walletError) return NextResponse.json({ error: walletError.message }, { status: 500 })

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    wallet: wallet ? { ...wallet, total_balance: Number(wallet.general_balance ?? 0) } : null,
    transactions: transactions ?? [],
    stats,
    trucoHistory: history ?? [],
  })
}
