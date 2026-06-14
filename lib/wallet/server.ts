import type { SupabaseClient, User } from '@supabase/supabase-js'
import { getCustomerAvatar, isCustomerAvatarKey } from '@/lib/customer/avatars'
import type { GameState, Player } from '@/lib/truco/engine'

export type WalletKind = 'bonus_points' | 'cash_credits'
export type WalletTransactionType =
  | 'signup_bonus'
  | 'admin_credit'
  | 'admin_debit'
  | 'deposit_pending'
  | 'deposit_approved'
  | 'deposit_rejected'
  | 'truco_entry_fee'
  | 'truco_prize'
  | 'bingo_purchase'
  | 'refund'
  | 'withdrawal_pending'
  | 'withdrawal_approved'
  | 'withdrawal_rejected'
  | 'adjustment'

export interface WalletSnapshot {
  user_id: string
  bonus_points_balance: number
  cash_credits_balance: number
}

function cleanAlias(value?: string | null, fallback?: string | null) {
  const raw = String(value || '').trim().replace(/[^a-zA-Z0-9_\-.]/g, '').slice(0, 24)
  if (raw.length >= 3) return raw
  const base = (fallback || 'Jugador').split('@')[0]?.replace(/[^a-zA-Z0-9_\-.]/g, '').slice(0, 16)
  return base || `jugador_${Math.floor(Math.random() * 9999)}`
}

export async function ensurePlayerAccount(serviceClient: SupabaseClient, user: Pick<User, 'id' | 'email'>) {
  const email = user.email?.toLowerCase() ?? null

  const { data: existingProfile } = await serviceClient
    .from('customer_profiles')
    .select('id, email, alias, avatar_key')
    .eq('id', user.id)
    .maybeSingle()

  const alias = cleanAlias(existingProfile?.alias, email)
  const avatarKey = isCustomerAvatarKey(existingProfile?.avatar_key) ? existingProfile.avatar_key : getCustomerAvatar().key

  await serviceClient
    .from('customer_profiles')
    .upsert({
      id: user.id,
      email: existingProfile?.email ?? email,
      alias,
      avatar_key: avatarKey,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

  const { data: existingWallet } = await serviceClient
    .from('lbb_wallets')
    .select('user_id, bonus_points_balance, cash_credits_balance')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existingWallet) {
    await serviceClient.from('lbb_wallets').insert({
      user_id: user.id,
      bonus_points_balance: 500,
      cash_credits_balance: 0,
    })

    await serviceClient.from('lbb_wallet_transactions').insert({
      user_id: user.id,
      wallet_kind: 'bonus_points',
      transaction_type: 'signup_bonus',
      amount: 500,
      balance_after: 500,
      description: 'Bono inicial Lucky Bingo Bear',
    })
  }

  await serviceClient
    .from('truco_player_stats')
    .upsert({ user_id: user.id }, { onConflict: 'user_id' })
}

export async function getWalletSnapshot(serviceClient: SupabaseClient, userId: string): Promise<WalletSnapshot> {
  const { data, error } = await serviceClient
    .from('lbb_wallets')
    .select('user_id, bonus_points_balance, cash_credits_balance')
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data as WalletSnapshot
}

export async function applyWalletTransaction(
  serviceClient: SupabaseClient,
  input: {
    userId: string
    walletKind: WalletKind
    type: WalletTransactionType
    amount: number
    relatedType?: string
    relatedId?: string
    description?: string
    metadata?: Record<string, unknown>
  },
) {
  const wallet = await getWalletSnapshot(serviceClient, input.userId)
  const balanceField = input.walletKind === 'bonus_points' ? 'bonus_points_balance' : 'cash_credits_balance'
  const currentBalance = Number(wallet[balanceField] ?? 0)
  const nextBalance = currentBalance + input.amount

  if (nextBalance < 0) {
    throw new Error('Saldo insuficiente')
  }

  const { error: updateError } = await serviceClient
    .from('lbb_wallets')
    .update({ [balanceField]: nextBalance })
    .eq('user_id', input.userId)

  if (updateError) throw updateError

  const { error: txError } = await serviceClient.from('lbb_wallet_transactions').insert({
    user_id: input.userId,
    wallet_kind: input.walletKind,
    transaction_type: input.type,
    amount: input.amount,
    balance_after: nextBalance,
    related_type: input.relatedType ?? null,
    related_id: input.relatedId ?? null,
    description: input.description ?? null,
    metadata: input.metadata ?? {},
  })

  if (txError) throw txError
  return nextBalance
}

export async function chargeTrucoEntryFee(serviceClient: SupabaseClient, roomId: string, userId: string, amount: number) {
  if (amount <= 0) return
  await applyWalletTransaction(serviceClient, {
    userId,
    walletKind: 'bonus_points',
    type: 'truco_entry_fee',
    amount: -Math.abs(amount),
    relatedType: 'truco_room',
    relatedId: roomId,
    description: `Entrada a mesa de Truco (${amount} LBB)`,
  })
}

function winnerRoleFromState(state: GameState): Player | null {
  const result = state.lastResult ?? ''
  if (result.includes('GANASTE')) return 'player'
  if (result.includes('EL OSO')) return 'opponent'
  return null
}

export async function settleTrucoRoomIfNeeded(
  serviceClient: SupabaseClient,
  room: {
    id: string
    room_code: string
    target_score: 15 | 30
    state: GameState
    host_user_id: string | null
    guest_user_id: string | null
    entry_fee_points: number
    prize_pool_points: number
    ranked: boolean
    settled_at: string | null
  },
) {
  if (room.settled_at || room.state.phase !== 'game-over') return
  if (!room.host_user_id || !room.guest_user_id) return

  const winnerRole = winnerRoleFromState(room.state)
  if (!winnerRole) return

  const winnerUserId = winnerRole === 'player' ? room.host_user_id : room.guest_user_id
  const loserUserId = winnerRole === 'player' ? room.guest_user_id : room.host_user_id
  const playerScore = room.state.scores.player
  const opponentScore = room.state.scores.opponent
  const prize = Number(room.prize_pool_points ?? 0)

  if (prize > 0) {
    await applyWalletTransaction(serviceClient, {
      userId: winnerUserId,
      walletKind: 'bonus_points',
      type: 'truco_prize',
      amount: prize,
      relatedType: 'truco_room',
      relatedId: room.id,
      description: `Premio por ganar Truco (${prize} LBB)`,
    })
  }

  await serviceClient.from('truco_match_history').insert({
    room_id: room.id,
    room_code: room.room_code,
    player_user_id: room.host_user_id,
    opponent_user_id: room.guest_user_id,
    winner_user_id: winnerUserId,
    loser_user_id: loserUserId,
    target_score: room.target_score,
    player_score: playerScore,
    opponent_score: opponentScore,
    entry_fee_points: Number(room.entry_fee_points ?? 0),
    prize_points: prize,
    ranked: room.ranked,
    metadata: { finalResult: room.state.lastResult },
  })

  await updateTrucoStats(serviceClient, winnerUserId, true, winnerUserId === room.host_user_id ? playerScore : opponentScore, winnerUserId === room.host_user_id ? opponentScore : playerScore, prize, room.entry_fee_points)
  await updateTrucoStats(serviceClient, loserUserId, false, loserUserId === room.host_user_id ? playerScore : opponentScore, loserUserId === room.host_user_id ? opponentScore : playerScore, 0, room.entry_fee_points)

  await serviceClient
    .from('truco_rooms')
    .update({ settled_at: new Date().toISOString() })
    .eq('id', room.id)
}

async function updateTrucoStats(
  serviceClient: SupabaseClient,
  userId: string,
  won: boolean,
  pointsFor: number,
  pointsAgainst: number,
  prizeWon: number,
  entryFee: number,
) {
  await serviceClient.from('truco_player_stats').upsert({ user_id: userId }, { onConflict: 'user_id' })
  const { data, error } = await serviceClient
    .from('truco_player_stats')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) throw error

  await serviceClient
    .from('truco_player_stats')
    .update({
      matches_played: Number(data.matches_played ?? 0) + 1,
      matches_won: Number(data.matches_won ?? 0) + (won ? 1 : 0),
      matches_lost: Number(data.matches_lost ?? 0) + (won ? 0 : 1),
      points_for: Number(data.points_for ?? 0) + pointsFor,
      points_against: Number(data.points_against ?? 0) + pointsAgainst,
      ranking_points: Number(data.ranking_points ?? 1000) + (won ? 15 : -10),
      bonus_points_won: Number(data.bonus_points_won ?? 0) + prizeWon,
      bonus_points_spent: Number(data.bonus_points_spent ?? 0) + Math.max(0, Number(entryFee ?? 0)),
      last_match_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
}
