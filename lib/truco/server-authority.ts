import {
  type EnvidoCall,
  type GameState,
  type Player,
  callEnvido,
  callFlor,
  callTruco,
  createGame,
  goToMazo,
  nextRound,
  playCard,
  respondEnvido,
  respondTruco,
} from './engine'
import { generateRoomCode, normalizeRoomCode, type OnlineAction } from './shared'

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
  ranked?: boolean | null
  settled_at?: string | null
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
  ranked: boolean
  createdAt?: string
  updatedAt?: string
  canJoin: boolean
}

export function createInitialRoomState(target: 15 | 30): GameState {
  return createGame(target)
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
    ranked: Boolean(room.ranked),
    role,
  }
}

export function summarizePublicRoom(room: StoredTrucoRoom): PublicRoomSummary {
  return {
    roomCode: room.room_code,
    target: room.target_score,
    status: room.status,
    scores: room.state.scores,
    currentTrick: room.state.currentTrick,
    hand: room.state.hand,
    version: room.version,
    entryFeePoints: Number(room.entry_fee_points ?? 0),
    prizePoolPoints: Number(room.prize_pool_points ?? 0),
    ranked: Boolean(room.ranked),
    createdAt: room.created_at,
    updatedAt: room.updated_at,
    canJoin: room.status === 'waiting' && !room.guest_secret,
  }
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
    case 'next-round':
      return nextRound(state)
    case 'restart':
      return createGame(target)
    default:
      return state
  }
}

export function validateActionShape(action: unknown): action is OnlineAction {
  if (!action || typeof action !== 'object') return false
  const type = (action as { type?: unknown }).type
  if (typeof type !== 'string') return false

  if (type === 'play-card') return typeof (action as { cardId?: unknown }).cardId === 'string'
  if (type === 'call-envido') {
    const call = (action as { call?: unknown }).call
    return call === 'envido' || call === 'real-envido' || call === 'falta-envido'
  }
  if (type === 'call-flor') return true
  if (type === 'call-truco') return true
  if (type === 'respond') return typeof (action as { accept?: unknown }).accept === 'boolean'
  if (type === 'go-maze') return true
  if (type === 'next-round') return true
  if (type === 'restart') return true

  return false
}
