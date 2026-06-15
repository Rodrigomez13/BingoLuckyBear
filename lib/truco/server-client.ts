import type { GameState, Player } from './engine'
import type { TrucoIdentity } from './identity'
import type { OnlineAction, OnlineRole } from './online'
import type { PublicRoomSummary, RoomVisibility } from './server-authority'
import type { TrucoRules } from './rules'

export interface AuthoritativeRoomView {
  roomCode: string
  target: 15 | 30
  status: 'waiting' | 'playing' | 'finished' | 'abandoned'
  visibility?: RoomVisibility
  state: GameState
  version: number
  entryFeePoints: number
  prizePoolPoints: number
  houseFeeRate: number
  houseFeePoints: number
  prizeAwardedPoints: number
  ranked: boolean
  rules: TrucoRules
  players: {
    player: TrucoIdentity
    opponent: TrucoIdentity | null
  }
  role: OnlineRole | null
}

export interface AuthoritativeResponse {
  ok: boolean
  room?: AuthoritativeRoomView
  secret?: string
  error?: string
}

export interface PublicRoomsResponse {
  ok: boolean
  rooms?: PublicRoomSummary[]
  error?: string
}

const jsonHeaders = { 'Content-Type': 'application/json' }

export function roomSecretKey(roomCode: string) {
  return `lbb-truco-room-secret-${roomCode.toUpperCase()}`
}

export function saveRoomSecret(roomCode: string, secret: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(roomSecretKey(roomCode), secret)
}

export function readRoomSecret(roomCode: string) {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(roomSecretKey(roomCode))
}

async function readApiResponse(response: Response): Promise<AuthoritativeResponse> {
  const payload = await response.json().catch(() => null)
  if (payload && typeof payload === 'object') return payload as AuthoritativeResponse
  return { ok: false, error: response.ok ? 'Respuesta inválida' : 'Error de servidor' }
}

async function readPublicRoomsResponse(response: Response): Promise<PublicRoomsResponse> {
  const payload = await response.json().catch(() => null)
  if (payload && typeof payload === 'object') return payload as PublicRoomsResponse
  return { ok: false, error: response.ok ? 'Respuesta inválida' : 'Error de servidor' }
}

export async function listPublicTrucoRooms() {
  const response = await fetch('/api/truco/rooms', { cache: 'no-store' })
  return readPublicRoomsResponse(response)
}

export async function createAuthoritativeRoom({
  target,
  roomCode,
  visibility = 'private',
  potPoints = 0,
  identity,
  rules,
}: {
  target: 15 | 30
  roomCode?: string
  visibility?: RoomVisibility
  potPoints?: number
  identity?: TrucoIdentity | null
  rules: TrucoRules
}) {
  const response = await fetch('/api/truco/rooms', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ target, roomCode, visibility, potPoints, identity, rules }),
  })
  return readApiResponse(response)
}

export async function joinAuthoritativeRoom(roomCode: string, secret?: string | null, identity?: TrucoIdentity | null) {
  const response = await fetch(`/api/truco/rooms/${roomCode}`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ secret, identity }),
  })
  return readApiResponse(response)
}

export async function fetchAuthoritativeRoom(roomCode: string, secret: string) {
  const response = await fetch(`/api/truco/rooms/${roomCode}?secret=${encodeURIComponent(secret)}`, {
    cache: 'no-store',
  })
  return readApiResponse(response)
}

export async function sendAuthoritativeAction({
  roomCode,
  actor,
  secret,
  action,
}: {
  roomCode: string
  actor: OnlineRole
  secret: string
  action: OnlineAction
}) {
  const response = await fetch(`/api/truco/rooms/${roomCode}/actions`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ actor, secret, action }),
  })
  return readApiResponse(response)
}

export async function leaveAuthoritativeRoom({
  roomCode,
  actor,
  secret,
}: {
  roomCode: string
  actor: OnlineRole
  secret: string
}) {
  const response = await fetch(`/api/truco/rooms/${roomCode}`, {
    method: 'DELETE',
    headers: jsonHeaders,
    body: JSON.stringify({ actor, secret }),
  })
  return readApiResponse(response)
}

export function formatPublicRoomScore(scores: Record<Player, number>) {
  return `${scores.player} - ${scores.opponent}`
}
