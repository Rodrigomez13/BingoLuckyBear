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

type AuthUserLike = Pick<User, 'id' | 'email'> & {
  user_metadata?: Record<string, unknown> | null
}

function cleanAlias(value?: string | null, fallback?: string | null) {
  const raw = String(value || '').trim().replace(/[^a-zA-Z0-9_\-.]/g, '').slice(0, 24)
  if (raw.length >= 3) return raw
  const base = (fallback || 'Jugador').split('@')[0]?.replace(/[^a-zA-Z0-9_\-.]/g, '').slice(0, 16)
  return base || `jugador_${Math.floor(Math.random() * 9999)}`
}

function metadataString(user: AuthUserLike, key: string) {
  const value = user.user_metadata?.[key]
  return typeof value === 'string' ? value : null
}

export async function ensurePlayerAccount(serviceClient: SupabaseClient, user: AuthUserLike) {
  const email = user.email?.toLowerCase() ?? null

  const { data: existingProfile, error: profileReadError } = await serviceClient
    .from('customer_profiles')
    .select('id, email, alias, avatar_key')
    .eq('id', user.id)
    .maybeSingle()

  if (profileReadError) throw profileReadError

  const alias = cleanAlias(existingProfile?.alias ?? metadataString(user, 'alias'), email)
  const rawAvatarKey = existingProfile?.avatar_key ?? metadataString(user, 'avatar_key')
  const avatarKey = isCustomerAvatarKey(rawAvatarKey) ? rawAvatarKey : getCustomerAvatar().key

  const { error: profileUpsertError } = await serviceClient
    .from('customer_profiles')
    .upsert({
      id: user.id,
      email: existingProfile?.email ?? email,
      alias,
      avatar_key: avatarKey,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

  if (profileUpsertError) throw profileUpsertError

  const { data: existingWallet, error: walletReadError } = await serviceClient
    .from('lbb_wallets')
    .select('user_id, bonus_points_balance, cash_credits_balance')
    .eq('user_id', user.id)
    .maybeSingle()

  if (walletReadError) throw walletReadError

  if (!existingWallet) {
    const { data: insertedWallet, error: walletInsertError } = await serviceClient
      .from('lbb_wallets')
      .insert({
        user_id: user.id,
        bonus_points_balance: 500,
        cash_credits_balance: 0,
      })
      .select('user_id')
      .maybeSingle()

    if (walletInsertError && walletInsertError.code !== '23505') throw walletInsertError

    if (insertedWallet) {
      const { error: signupTransactionError } = await serviceClient.from('lbb_wallet_transactions').insert({
        user_id: user.id,
        wallet_kind: 'bonus_points',
        transaction_type: 'signup_bonus',
        amount: 500,
        balance_after: 500,
        description: 'Bono inicial Lucky Bingo Bear',
      })

      if (signupTransactionError) throw signupTransactionError
    }
  }

  const { error: statsUpsertError } = await serviceClient
    .from('truco_player_stats')
    .upsert({ user_id: user.id }, { onConflict: 'user_id' })

  if (statsUpsertError) throw statsUpsertError
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
  const { data, error } = await serviceClient.rpc('lbb_apply_wallet_transaction', {
    p_user_id: input.userId,
    p_wallet_kind: input.walletKind,
    p_transaction_type: input.type,
    p_amount: input.amount,
    p_related_type: input.relatedType ?? null,
    p_related_id: input.relatedId ?? null,
    p_description: input.description ?? null,
    p_metadata: input.metadata ?? {},
  })

  if (error) throw error
  return Number(data)
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
    state: GameState
    settled_at?: string | null
  },
) {
  if (room.settled_at || room.state.phase !== 'game-over') return

  const winnerRole = winnerRoleFromState(room.state)
  if (!winnerRole) return

  const { error } = await serviceClient.rpc('lbb_settle_truco_room', {
    p_room_id: room.id,
    p_winner_role: winnerRole,
  })

  if (error) throw error
}
