import type { EnvidoCall, GameState, Player } from './engine'

export type OnlineRole = Player

export type OnlineAction =
  | { type: 'play-card'; cardId: string }
  | { type: 'call-envido'; call: EnvidoCall }
  | { type: 'call-flor' }
  | { type: 'call-truco' }
  | { type: 'respond'; accept: boolean }
  | { type: 'go-maze' }
  | { type: 'next-round' }
  | { type: 'restart' }

export type OnlineMessage =
  | { type: 'join'; role: OnlineRole; clientId: string }
  | { type: 'state'; state: GameState; target: 15 | 30; clientId: string }
  | { type: 'action'; actor: OnlineRole; action: OnlineAction; clientId: string }
  | { type: 'presence'; text: string; clientId: string }

export function normalizeRoomCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)
}

export function generateRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

export function trucoRoomChannelName(code: string) {
  return `truco-room-${normalizeRoomCode(code)}`
}
