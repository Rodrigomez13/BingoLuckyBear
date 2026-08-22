import {
  type EnvidoCall,
  type GameState,
  type Player,
  callEnvido,
  callFlor,
  callTruco,
  createGame,
  getActivePlayer,
  goToMazo,
  nextRound,
  playCard,
  respondEnvido,
  respondTruco,
} from './engine'
import { generateRoomCode, normalizeRoomCode, type OnlineAction } from './shared'
import { normalizeTrucoRules, type TrucoRules } from './rules'

export type RoomVisibility = 'private' | 'public'

export interface StoredTrucoRoom {
  id: string
  room_code: string
  target_score: 15 | 30
  status: 'waiting' | 'playing' | 'finished' | 'abandoned'
  visibility?: RoomVisibility
  state: GameState
  version: number
  host_secret: string
  guest_secret: string | null
  host_user_id?: string | null
  guest_user_id?: string | null
  entry_fee_points?: number | null
  prize_pool_points?: number | null
  house_fee_rate?: number | null
  house_fee_points?: number | null
  prize_awarded_points?: number | null
  ranked?: boolean | null
  settled_at?: string | null
  host_name?: string | null
  host_avatar_key?: string | null
  guest_name?: string | null
  guest_avatar_key?: string | null
  abandoned_by?: Player | null
  refunded_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface PublicRoomSummary {
  roomCode: string
  target: 15 | 30
  status: 'waiting' | 'playing' | 'finished' | 'abandoned'
  scores: Record<Player, number>
  currentTrick: number
  hand: Player
  version: number
  entryFeePoints: number
  prizePoolPoints: number
  houseFeeRate: number
  houseFeePoints: number
  prizeAwardedPoints: number
  ranked: boolean
  rules: TrucoRules
  host: {
    name: string
    avatarKey: string
  }
  guest: {
    name: string
    avatarKey: string
  } | null
  bettingOpen: boolean
  sideBetMaxPoints: number
  sideBetCount?: number
  mySideBet?: {
    id: string
    predictedWinnerRole: Player
    amountPoints: number
    potentialPayoutPoints: number
    status: 'pending' | 'won' | 'lost' | 'cancelled'
  } | null
  createdAt?: string
  updatedAt?: string
  canJoin: boolean
}

export function createInitialRoomState(target: 15 | 30, rules: TrucoRules): GameState {
  return createGame(target, rules)
}

export function makeRoomCode(candidate?: string) {
  const normalized = normalizeRoomCode(candidate ?? '')
  return normalized.length === 5 ? normalized : generateRoomCode()
}

export function sanitizeRoom(room: StoredTrucoRoom, secret?: string | null) {
  const role: Player | null = secret === room.host_secret ? 'player' : secret && secret === room.guest_secret ? 'opponent' : null
  return {
    roomCode: room.room_code,
    target: room.target_score,
    status: room.status,
    visibility: room.visibility ?? 'private',
    state: room.state,
    version: room.version,
    entryFeePoints: Number(room.entry_fee_points ?? 0),
    prizePoolPoints: Number(room.prize_pool_points ?? 0),
    houseFeeRate: Number(room.house_fee_rate ?? 0),
    houseFeePoints: Number(room.house_fee_points ?? 0),
    prizeAwardedPoints: Number(room.prize_awarded_points ?? 0),
    ranked: Boolean(room.ranked),
    rules: normalizeTrucoRules(room.state.rules),
    players: {
      player: {
        name: room.host_name?.trim() || 'Jugador',
        avatarKey: room.host_avatar_key || 'golden_bear',
      },
      opponent: room.guest_name
        ? {
            name: room.guest_name,
            avatarKey: room.guest_avatar_key || 'golden_bear',
          }
        : null,
    },
    role,
  }
}

export function summarizePublicRoom(room: StoredTrucoRoom): PublicRoomSummary {
  const prizePool = Number(room.prize_pool_points ?? 0)
  const bettingOpen = isSideBetWindowOpen(room)
  return {
    roomCode: room.room_code,
    target: room.target_score,
    status: room.status,
    scores: room.state.scores,
    currentTrick: room.state.currentTrick,
    hand: room.state.hand,
    version: room.version,
    entryFeePoints: Number(room.entry_fee_points ?? 0),
    prizePoolPoints: prizePool,
    houseFeeRate: Number(room.house_fee_rate ?? 0),
    houseFeePoints: Number(room.house_fee_points ?? 0),
    prizeAwardedPoints: Number(room.prize_awarded_points ?? 0),
    ranked: Boolean(room.ranked),
    rules: normalizeTrucoRules(room.state.rules),
    host: {
      name: room.host_name?.trim() || 'Jugador',
      avatarKey: room.host_avatar_key || 'golden_bear',
    },
    guest: room.guest_secret
      ? {
          name: room.guest_name?.trim() || 'Rival',
          avatarKey: room.guest_avatar_key || 'golden_bear',
        }
      : null,
    bettingOpen,
    sideBetMaxPoints: bettingOpen ? getSideBetMaxPoints(prizePool) : 0,
    createdAt: room.created_at,
    updatedAt: room.updated_at,
    canJoin: room.status === 'waiting' && !room.guest_secret,
  }
}

export function getSideBetMaxPoints(prizePoolPoints: number) {
  return Math.max(0, Math.floor(Number(prizePoolPoints || 0) * 0.25))
}

export function isSideBetWindowOpen(room: StoredTrucoRoom) {
  const state = room.state
  return room.status === 'playing'
    && (room.visibility ?? 'private') === 'public'
    && Number(room.prize_pool_points ?? 0) > 0
    && state.phase === 'playing'
    && Number(state.scores.player ?? 0) === 0
    && Number(state.scores.opponent ?? 0) === 0
    && Number(state.currentTrick ?? 0) === 0
    && (state.played?.length ?? 0) <= 2
}

export function isValidRoleSecret(room: StoredTrucoRoom, actor: Player, secret: string) {
  if (actor === 'player') return secret === room.host_secret
  return Boolean(room.guest_secret && secret === room.guest_secret)
}

export function applyAuthoritativeAction(state: GameState, actor: Player, action: OnlineAction, target: 15 | 30): GameState {
  switch (action.type) {
    case 'play-card':
      return playCard(state, actor, action.cardId)
    case 'call-flor':
      return callFlor(state, actor)
    case 'call-envido':
      return callEnvido(state, actor, action.call as EnvidoCall)
    case 'call-truco':
      return callTruco(state, actor)
    case 'respond':
      if (state.envidoPending && state.envidoPending.by !== actor) return respondEnvido(state, actor, action.accept)
      if (state.trucoPending && state.trucoPending.by !== actor) return respondTruco(state, actor, action.accept)
      return state
    case 'go-maze':
      return goToMazo(state, actor)
    case 'timeout':
      // The player whose clock ran out folds, regardless of who reported it.
      if (state.phase !== 'playing') return state
      return goToMazo(state, getActivePlayer(state))
    case 'next-round':
      return nextRound(state)
    case 'restart':
      return createGame(target, normalizeTrucoRules(state.rules))
    default:
      return state
  }
}

export function validateActionShape(action: unknown): action is OnlineAction {
  if (!action || typeof action !== 'object') return false
  const type = (action as { type?: unknown }).type
  if (typeof type !== 'string') return false

  if (type === 'play-card') {
    const cardId = (action as { cardId?: unknown }).cardId
    return typeof cardId === 'string' && cardId.length > 0 && cardId.length <= 80
  }
  if (type === 'call-envido') {
    const call = (action as { call?: unknown }).call
    return call === 'envido' || call === 'real-envido' || call === 'falta-envido'
  }
  if (type === 'call-flor') return true
  if (type === 'call-truco') return true
  if (type === 'respond') return typeof (action as { accept?: unknown }).accept === 'boolean'
  if (type === 'go-maze') return true
  if (type === 'timeout') return true
  if (type === 'next-round') return true
  if (type === 'restart') return false

  return false
}

export function forfeitGame(state: GameState, quitter: Player): GameState {
  if (state.phase === 'game-over') return state

  const winner = quitter === 'player' ? 'opponent' : 'player'
  const result = winner === 'player' ? 'GANASTE LA PARTIDA' : 'EL OSO GANA LA PARTIDA'

  return {
    ...state,
    phase: 'game-over',
    scores: {
      ...state.scores,
      [winner]: Math.max(state.targetScore, state.scores[winner]),
    },
    trucoPending: null,
    envidoPending: null,
    lastResult: result,
    log: [
      ...state.log.slice(-40),
      {
        id: `leave-${Date.now().toString(36)}`,
        by: 'system',
        text: `${quitter === 'player' ? 'El anfitrión' : 'El rival'} abandonó la partida.`,
      },
    ],
  }
}
