import {
  type TrucoCard,
  cardPower,
  computeEnvido,
  dealHands,
} from './cards'

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
  scores: Record<Player, number>
  hands: Record<Player, TrucoCard[]>
  played: PlayedCard[]
  trickWinners: (Player | 'tie' | null)[]
  currentTrick: number
  turn: Player
  hand: Player // who is "mano" (deals advantage)
  log: LogEntry[]
  // Truco state
  trucoLevel: TrucoLevel
  trucoPending: { level: TrucoLevel; by: Player } | null
  trucoOwner: Player | null
  // Envido state
  envidoResolved: boolean
  envidoPending: { calls: EnvidoCall[]; by: Player } | null
  envidoValue: number
  // Round result modal
  lastResult: string | null
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

export function createGame(targetScore: 15 | 30): GameState {
  const state: GameState = {
    phase: 'idle',
    targetScore,
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
    lastResult: null,
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
    lastResult: null,
    log: [
      ...prev.log.slice(-30),
      { id: uid(), by: 'system', text: `Nueva mano. Reparte ${mano === 'player' ? 'vos' : 'el oso'}.` },
    ],
  }
}

function other(p: Player): Player {
  return p === 'player' ? 'opponent' : 'player'
}

function pushLog(state: GameState, by: Player | 'system', text: string): GameState {
  return { ...state, log: [...state.log.slice(-40), { id: uid(), by, text }] }
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
  const w = state.trickWinners
  const wins = (p: Player) => w.filter((x) => x === p).length
  const playerWins = wins('player')
  const oppWins = wins('opponent')

  // First decided?
  if (w[0] && w[0] !== 'tie') {
    if (playerWins >= 2) return 'player'
    if (oppWins >= 2) return 'opponent'
  }

  // Tie handling
  if (w[0] === 'tie' && w[1] && w[1] !== 'tie') return w[1]
  if (w[1] === 'tie' && w[0] && w[0] !== 'tie') return w[0]
  if (w[0] && w[0] !== 'tie' && w[1] === 'tie') return w[0]
  if (w[0] === 'tie' && w[1] === 'tie' && w[2] && w[2] !== 'tie') return w[2]
  if (w[0] === 'tie' && w[1] === 'tie' && w[2] === 'tie') return state.hand

  // All three played with no clear winner
  if (w[2]) {
    if (playerWins > oppWins) return 'player'
    if (oppWins > playerWins) return 'opponent'
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
  next = pushLog(next, by, `${by === 'player' ? 'Jugas' : 'Juega'} ${card.rank} de ${card.suit}`)

  const cardsInTrick = next.played.filter((p) => p.trick === next.currentTrick)
  if (cardsInTrick.length < 2) {
    // Pass turn to the other player to complete the trick.
    return { ...next, turn: other(by) }
  }

  // Trick complete.
  const winner = resolveTrick(next, next.currentTrick)
  const trickWinners = [...next.trickWinners]
  trickWinners[next.currentTrick] = winner
  next = { ...next, trickWinners }
  next = pushLog(
    next,
    'system',
    winner === 'tie' ? 'Parda (empate).' : `Gana la mano ${winner === 'player' ? 'vos' : 'el oso'}.`,
  )

  const rWinner = roundWinner(next)
  if (rWinner || next.currentTrick === 2) {
    return finishRound(next, rWinner ?? next.hand)
  }

  // Next trick: winner leads, tie -> mano leads.
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
  // Folding gives opponent the current truco points (min 1).
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

// ---------- Truco calls ----------

export function callTruco(state: GameState, by: Player): GameState {
  if (state.phase !== 'playing' || state.trucoPending || state.envidoPending) return state
  if (state.trucoLevel >= 3) return state
  if (state.trucoOwner === by) return state // can't raise your own pending call
  const newLevel = (state.trucoLevel + 1) as TrucoLevel
  let next = pushLog(state, by, nextTrucoLabel(state.trucoLevel))
  next = { ...next, trucoPending: { level: newLevel, by } }
  return next
}

export function respondTruco(state: GameState, by: Player, accept: boolean): GameState {
  if (!state.trucoPending || state.trucoPending.by === by) return state
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
  // Rejected: caller wins previous level points.
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
  // Envido only allowed during first trick before it's resolved, and once.
  if (state.phase !== 'playing' || state.envidoResolved || state.trucoLevel > 0 || state.trucoPending) return state
  if (state.currentTrick !== 0) return state
  if (state.envidoPending) {
    if (state.envidoPending.by === by) return state
    const calls = [...state.envidoPending.calls, call]
    return { ...pushLog(state, by, ENVIDO_LABELS[call]), envidoPending: { calls, by } }
  }
  return { ...pushLog(state, by, ENVIDO_LABELS[call]), envidoPending: { calls: [call], by } }
}

function envidoPoints(calls: EnvidoCall[], state: GameState): { want: number } {
  let want = 0
  for (const c of calls) {
    if (c === 'envido') want += 2
    else if (c === 'real-envido') want += 3
    else if (c === 'falta-envido') {
      // Falta: points to reach target for the leader.
      const leaderScore = Math.max(state.scores.player, state.scores.opponent)
      want = state.targetScore - leaderScore
    }
  }
  return { want: Math.max(1, want) }
}

export function respondEnvido(state: GameState, by: Player, accept: boolean): GameState {
  if (!state.envidoPending || state.envidoPending.by === by) return state
  const pending = state.envidoPending
  if (!accept) {
    // Rejecter gives 1 point (or accumulated minus last) to caller. Simplified: 1 point per prior call, min 1.
    const declinedValue = Math.max(1, pending.calls.length - 1 + 1)
    const winner = pending.by
    const scores = { ...state.scores, [winner]: state.scores[winner] + 1 }
    let next = pushLog(state, by, 'No quiero el envido')
    next = {
      ...next,
      scores,
      envidoPending: null,
      envidoResolved: true,
      envidoValue: declinedValue,
    }
    if (scores[winner] >= state.targetScore) {
      next = { ...next, phase: 'game-over', lastResult: `${winner === 'player' ? 'GANASTE LA PARTIDA' : 'EL OSO GANA LA PARTIDA'}` }
    }
    return next
  }
  // Accepted: compare envido values.
  const playerEnv = computeEnvido(state.hands.player.concat(state.played.filter((p) => p.by === 'player').map((p) => p.card)))
  const oppEnv = computeEnvido(state.hands.opponent.concat(state.played.filter((p) => p.by === 'opponent').map((p) => p.card)))
  const { want } = envidoPoints(pending.calls, state)
  // Mano wins ties.
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
  if (state.phase === 'game-over') return state
  const newMano = other(state.hand)
  return startRound(state, newMano)
}

export function resetGame(targetScore: 15 | 30): GameState {
  return createGame(targetScore)
}
