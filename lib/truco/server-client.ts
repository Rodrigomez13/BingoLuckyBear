import type { GameState } from './engine'
import type { OnlineAction, OnlineRole } from './online'

export interface AuthoritativeRoomView {
  roomCode: string
  target: 15 | 30
  status: 'waiting' | 'playing' | 'finished' | 'abandoned'
  state: GameState
  version: number
  role: OnlineRole | null
}

export interface AuthoritativeResponse {
  ok: boolean
  room?: AuthoritativeRoomView
  secret?: string
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

export async function createAuthoritativeRoom(target: 15 | 30, roomCode?: string) {
  const response = await fetch('/api/truco/rooms', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ target, roomCode }),
  })
  return readApiResponse(response)
}

export async function joinAuthoritativeRoom(roomCode: string, secret?: string | null) {
  const response = await fetch(`/api/truco/rooms/${roomCode}`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ secret }),
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
