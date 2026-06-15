import {
  type TrucoCard,
  cardPower,
  computeEnvido,
  dealHands,
  envidoCardValue,
} from './cards'
import { DEFAULT_TRUCO_RULES, normalizeTrucoRules, type TrucoRules } from './rules'

export type Player = 'player' | 'opponent'
export type Phase = 'idle' | 'playing' | 'round-over' | 'game-over'

export type TrucoLevel = 0 | 1 | 2 | 3 // none, truco, retruco, vale4
export type EnvidoCall = 'envido' | 'real-envido' | 'falta-envido'

export interface PlayedCard {
  card: TrucoCard
  by: Player
  trick: number
}

export interface LogEntry {
  id: string
  by: Player | 'system'
  text: string
}

export interface GameState {
  phase: Phase
  targetScore: 15 | 30
  rules?: TrucoRules
  scores: Record<Player, number>
  hands: Record<Player, TrucoCard[]>
  played: PlayedCard[]
  trickWinners: (Player | 'tie' | null)[]
  currentTrick: number
  turn: Player
  hand: Player // who is "mano" (tie advantage)
  log: LogEntry[]
  // Truco state
  trucoLevel: TrucoLevel
  trucoPending: { level: TrucoLevel; by: Player } | null
  trucoOwner: Player | null
  // Envido state
  envidoResolved: boolean
  envidoPending: { calls: EnvidoCall[]; by: Player } | null
  envidoValue: number
  // Flor state
  florResolved: boolean
  // Round result modal
  lastResult: string | null
  // Epoch ms (server time) marking when the current decision window started.
  // Used by online tables to run the per-turn 30s countdown. Optional so local
  // (bot) games can ignore it.
  turnStartedAt?: number
}

// Per-turn time budget for online tables.
export const TURN_TIME_LIMIT_MS = 30_000

// Returns the player currently "on the clock": whoever must respond to a
// pending call, otherwise whoever has the turn.
export function getActivePlayer(state: GameState): Player {
  if (state.envidoPending) return other(state.envidoPending.by)
  if (state.trucoPending) return other(state.trucoPending.by)
  return state.turn
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export function trucoPoints(level: TrucoLevel): number {
  return [1, 2, 3, 4][level]
}

function nextTrucoLabel(level: TrucoLevel): string {
  return ['Truco', 'Truco', 'Retruco', 'Vale Cuatro'][level] ?? 'Vale Cuatro'
}

export function createGame(targetScore: 15 | 30, rules: TrucoRules = DEFAULT_TRUCO_RULES): GameState {
  const state: GameState = {
    phase: 'idle',
    targetScore,
    rules: normalizeTrucoRules(rules),
    scores: { player: 0, opponent: 0 },
    hands: { player: [], opponent: [] },
    played: [],
    trickWinners: [null, null, null],
    currentTrick: 0,
    turn: 'player',
    hand: 'player',
    log: [],
    trucoLevel: 0,
    trucoPending: null,
    trucoOwner: null,
    envidoResolved: false,
    envidoPending: null,
    envidoValue: 0,
    florResolved: false,
    lastResult: null,
    turnStartedAt: Date.now(),
  }
  return startRound(state, 'player')
}

export function startRound(prev: GameState, mano: Player): GameState {
  const { player, opponent } = dealHands()
  return {
    ...prev,
    phase: 'playing',
    hands: { player, opponent },
    played: [],
    trickWinners: [null, null, null],
    currentTrick: 0,
    turn: mano,
    hand: mano,
    trucoLevel: 0,
    trucoPending: null,
    trucoOwner: null,
    envidoResolved: false,
    envidoPending: null,
    envidoValue: 0,
    florResolved: false,
    lastResult: null,
    turnStartedAt: Date.now(),
    log: [
      ...prev.log.slice(-30),
      { id: uid(), by: 'system', text: `Nueva mano. Es mano ${mano === 'player' ? 'vos' : 'el oso'}.` },
    ],
  }
}

function other(p: Player): Player {
  return p === 'player' ? 'opponent' : 'player'
}

function pushLog(state: GameState, by: Player | 'system', text: string): GameState {
  return { ...state, log: [...state.log.slice(-40), { id: uid(), by, text }] }
}

function cardsForPlayer(state: GameState, player: Player): TrucoCard[] {
  return state.hands[player].concat(state.played.filter((p) => p.by === player).map((p) => p.card))
}

export function hasFlor(cards: TrucoCard[]): boolean {
  if (cards.length < 3) return false
  return cards.slice(0, 3).every((card) => card.suit === cards[0].suit)
}

export function computeFlor(cards: TrucoCard[]): number {
  if (!hasFlor(cards)) return 0
  return 20 + cards.slice(0, 3).reduce((sum, card) => sum + envidoCardValue(card.rank), 0)
}

export function canCallFlor(state: GameState, by: Player): boolean {
  if (!normalizeTrucoRules(state.rules).florEnabled) return false
  if (state.phase !== 'playing' || state.florResolved || state.currentTrick !== 0) return false
  if (state.played.some((played) => played.by === by)) return false
  return hasFlor(cardsForPlayer(state, by))
}

function firstTrickComplete(state: GameState): boolean {
  return state.played.filter((played) => played.trick === 0).length >= 2
}

export function canCallEnvido(state: GameState, by: Player): boolean {
  if (state.phase !== 'playing' || state.envidoResolved || state.envidoPending || state.currentTrick !== 0) return false
  if (state.trucoLevel > 0) return false
  if (state.trucoPending && state.trucoPending.by === by) return false
  if (state.trucoPending && state.trucoPending.by !== by) return !firstTrickComplete(state)
  return !state.played.some((played) => played.by === by)
}

/** Returns winner of a completed trick, or null if not complete. */
function resolveTrick(state: GameState, trick: number): Player | 'tie' | null {
  const cards = state.played.filter((p) => p.trick === trick)
  if (cards.length < 2) return null
  const [a, b] = cards
  const pa = cardPower(a.card)
  const pb = cardPower(b.card)
  if (pa === pb) return 'tie'
  return pa > pb ? a.by : b.by
}

/** Determines round winner based on tricks won. Returns null if undecided. */
function roundWinner(state: GameState): Player | null {
  const [first, second, third] = state.trickWinners

  if (first && first !== 'tie') {
    if (second === null) return null
    if (second === 'tie' || second === first) return first
    if (third === null) return null
    if (third === 'tie') return first
    return third
  }

  if (first === 'tie') {
    if (second === null) return null
    if (second !== 'tie') return second
    if (third === null) return null
    if (third !== 'tie') return third
    return state.hand
  }

  return null
}

export function playCard(state: GameState, by: Player, cardId: string): GameState {
  if (state.phase !== 'playing' || state.turn !== by || state.trucoPending || state.envidoPending) {
    return state
  }
  const hand = state.hands[by]
  const card = hand.find((c) => c.id === cardId)
  if (!card) return state

  let next: GameState = {
    ...state,
    hands: { ...state.hands, [by]: hand.filter((c) => c.id !== cardId) },
    played: [...state.played, { card, by, trick: state.currentTrick }],
  }
  next = pushLog(next, by, `${by === 'player' ? 'Jugás' : 'Juega'} ${card.rank} de ${card.suit}`)

  const cardsInTrick = next.played.filter((p) => p.trick === next.currentTrick)
  if (cardsInTrick.length < 2) {
    return { ...next, turn: other(by) }
  }

  const winner = resolveTrick(next, next.currentTrick)
  const trickWinners = [...next.trickWinners]
  trickWinners[next.currentTrick] = winner
  next = { ...next, trickWinners }
  next = pushLog(
    next,
    'system',
    winner === 'tie' ? 'Parda.' : `Gana la baza ${winner === 'player' ? 'vos' : 'el oso'}.`,
  )

  const rWinner = roundWinner(next)
  if (rWinner || next.currentTrick === 2) {
    return finishRound(next, rWinner ?? next.hand)
  }

  const leader = winner === 'tie' ? next.hand : (winner as Player)
  return { ...next, currentTrick: next.currentTrick + 1, turn: leader }
}

function finishRound(state: GameState, winner: Player): GameState {
  const points = trucoPoints(state.trucoLevel)
  const scores = { ...state.scores, [winner]: state.scores[winner] + points }
  const result = `${winner === 'player' ? 'Ganaste' : 'Gano el oso'} la mano (+${points} ${points === 1 ? 'punto' : 'puntos'})`
  let next: GameState = {
    ...state,
    scores,
    phase: 'round-over',
    lastResult: result,
  }
  next = pushLog(next, 'system', result)

  if (scores[winner] >= state.targetScore) {
    next = { ...next, phase: 'game-over', lastResult: `${winner === 'player' ? 'GANASTE LA PARTIDA' : 'EL OSO GANA LA PARTIDA'}` }
  }
  return next
}

/** Player or bot goes to the mazo (folds the hand). */
export function goToMazo(state: GameState, by: Player): GameState {
  if (state.phase !== 'playing') return state
  const winner = other(by)
  const points = Math.max(1, trucoPoints(state.trucoLevel))
  const scores = { ...state.scores, [winner]: state.scores[winner] + points }
  let next: GameState = {
    ...state,
    scores,
    phase: 'round-over',
    lastResult: `${by === 'player' ? 'Te fuiste' : 'El oso se fue'} al mazo. ${winner === 'player' ? 'Ganaste' : 'Gano el oso'} +${points}`,
  }
  next = pushLog(next, by, `${by === 'player' ? 'Te vas' : 'Se va'} al mazo`)
  if (scores[winner] >= state.targetScore) {
    next = { ...next, phase: 'game-over', lastResult: `${winner === 'player' ? 'GANASTE LA PARTIDA' : 'EL OSO GANA LA PARTIDA'}` }
  }
  return next
}

// ---------- Flor calls ----------

export function callFlor(state: GameState, by: Player): GameState {
  if (!canCallFlor(state, by)) return state

  const playerFlor = computeFlor(cardsForPlayer(state, 'player'))
  const opponentFlor = computeFlor(cardsForPlayer(state, 'opponent'))
  const opponent = other(by)
  const opponentHasFlor = opponent === 'player' ? playerFlor > 0 : opponentFlor > 0

  let winner: Player = by
  if (opponentHasFlor) {
    if (playerFlor === opponentFlor) winner = state.hand
    else winner = playerFlor > opponentFlor ? 'player' : 'opponent'
  }

  const points = 3
  const scores = { ...state.scores, [winner]: state.scores[winner] + points }
  let next = pushLog(state, by, 'Flor')
  const detail = opponentHasFlor
    ? `Flor: vos ${playerFlor} - oso ${opponentFlor}. ${winner === 'player' ? 'Ganaste' : 'Gano el oso'} +${points}`
    : `${by === 'player' ? 'Tenés' : 'El oso tiene'} Flor. ${winner === 'player' ? 'Ganaste' : 'Gano el oso'} +${points}`
  next = pushLog(next, 'system', detail)
  next = {
    ...next,
    scores,
    florResolved: true,
    envidoResolved: true,
    envidoPending: null,
  }

  if (scores[winner] >= state.targetScore) {
    next = { ...next, phase: 'game-over', lastResult: `${winner === 'player' ? 'GANASTE LA PARTIDA' : 'EL OSO GANA LA PARTIDA'}` }
  }
  return next
}

// ---------- Truco calls ----------

export function callTruco(state: GameState, by: Player): GameState {
  if (state.phase !== 'playing' || state.trucoPending || state.envidoPending) return state
  if (state.trucoLevel >= 3) return state
  if (state.trucoOwner === by) return state
  const newLevel = (state.trucoLevel + 1) as TrucoLevel
  let next = pushLog(state, by, nextTrucoLabel(state.trucoLevel))
  next = { ...next, trucoPending: { level: newLevel, by } }
  return next
}

export function respondTruco(state: GameState, by: Player, accept: boolean): GameState {
  if (!state.trucoPending || state.trucoPending.by === by || state.envidoPending) return state
  const pending = state.trucoPending
  if (accept) {
    let next = pushLog(state, by, 'Quiero')
    next = {
      ...next,
      trucoLevel: pending.level,
      trucoOwner: pending.by,
      trucoPending: null,
    }
    return next
  }
  const winner = pending.by
  const points = Math.max(1, trucoPoints((pending.level - 1) as TrucoLevel))
  const scores = { ...state.scores, [winner]: state.scores[winner] + points }
  let next = pushLog(state, by, 'No quiero')
  next = {
    ...next,
    scores,
    trucoPending: null,
    phase: 'round-over',
    lastResult: `${winner === 'player' ? 'Ganaste' : 'Gano el oso'} +${points} (no quiso el Truco)`,
  }
  if (scores[winner] >= state.targetScore) {
    next = { ...next, phase: 'game-over', lastResult: `${winner === 'player' ? 'GANASTE LA PARTIDA' : 'EL OSO GANA LA PARTIDA'}` }
  }
  return next
}

// ---------- Envido calls ----------

const ENVIDO_LABELS: Record<EnvidoCall, string> = {
  envido: 'Envido',
  'real-envido': 'Real Envido',
  'falta-envido': 'Falta Envido',
}

export function callEnvido(state: GameState, by: Player, call: EnvidoCall): GameState {
  if (!canCallEnvido(state, by) && !state.envidoPending) return state
  if (state.envidoPending) {
    if (state.envidoPending.by === by) return state
    const calls = [...state.envidoPending.calls, call]
    return { ...pushLog(state, by, ENVIDO_LABELS[call]), envidoPending: { calls, by } }
  }
  return { ...pushLog(state, by, ENVIDO_LABELS[call]), envidoPending: { calls: [call], by } }
}

function envidoPoints(calls: EnvidoCall[], state: GameState): { want: number; declined: number } {
  let want = 0
  for (const c of calls) {
    if (c === 'envido') want += 2
    else if (c === 'real-envido') want += 3
    else if (c === 'falta-envido') {
      const leaderScore = Math.max(state.scores.player, state.scores.opponent)
      want = state.targetScore - leaderScore
    }
  }

  const last = calls[calls.length - 1]
  let declined = 1
  if (calls.length > 1) {
    declined = 0
    for (const c of calls.slice(0, -1)) {
      if (c === 'envido') declined += 2
      else if (c === 'real-envido') declined += 3
      else if (c === 'falta-envido') declined += 1
    }
  } else if (last === 'real-envido' || last === 'falta-envido') {
    declined = 1
  }

  return { want: Math.max(1, want), declined: Math.max(1, declined) }
}

export function respondEnvido(state: GameState, by: Player, accept: boolean): GameState {
  if (!state.envidoPending || state.envidoPending.by === by) return state
  const pending = state.envidoPending
  const { want, declined } = envidoPoints(pending.calls, state)

  if (!accept) {
    const winner = pending.by
    const scores = { ...state.scores, [winner]: state.scores[winner] + declined }
    let next = pushLog(state, by, 'No quiero el envido')
    next = {
      ...next,
      scores,
      envidoPending: null,
      envidoResolved: true,
      envidoValue: declined,
    }
    if (scores[winner] >= state.targetScore) {
      next = { ...next, phase: 'game-over', lastResult: `${winner === 'player' ? 'GANASTE LA PARTIDA' : 'EL OSO GANA LA PARTIDA'}` }
    }
    return next
  }

  const playerEnv = computeEnvido(cardsForPlayer(state, 'player'))
  const oppEnv = computeEnvido(cardsForPlayer(state, 'opponent'))
  let winner: Player
  if (playerEnv === oppEnv) winner = state.hand
  else winner = playerEnv > oppEnv ? 'player' : 'opponent'

  const scores = { ...state.scores, [winner]: state.scores[winner] + want }
  let next = pushLog(state, by, 'Quiero')
  next = pushLog(next, 'system', `Envido: vos ${playerEnv} - oso ${oppEnv}. ${winner === 'player' ? 'Ganaste' : 'Gano el oso'} +${want}`)
  next = {
    ...next,
    scores,
    envidoPending: null,
    envidoResolved: true,
    envidoValue: want,
  }
  if (scores[winner] >= state.targetScore) {
    next = { ...next, phase: 'game-over', lastResult: `${winner === 'player' ? 'GANASTE LA PARTIDA' : 'EL OSO GANA LA PARTIDA'}` }
  }
  return next
}

export function nextRound(state: GameState): GameState {
  // Only advance from a finished round. This makes the call idempotent so the
  // automatic advance (which can fire from both clients in online mode) never
  // re-deals an in-progress hand.
  if (state.phase !== 'round-over') return state
  const newMano = other(state.hand)
  return startRound(state, newMano)
}

export function resetGame(targetScore: 15 | 30, rules: TrucoRules = DEFAULT_TRUCO_RULES): GameState {
  return createGame(targetScore, rules)
}
