import { type GameState, type Player, playCard, respondTruco, respondEnvido, callTruco, callEnvido, goToMazo } from './engine'
import { cardPower, computeEnvido } from './cards'

const OPP: Player = 'opponent'

/**
 * Decides and applies the bot's next action. Returns the new state plus an
 * optional chat phrase the bot "says".
 */
export function botAct(state: GameState): { state: GameState; phrase?: string } {
  // Respond to a pending Truco call from the player.
  if (state.trucoPending && state.trucoPending.by !== OPP) {
    const strength = handStrength(state.hands[OPP])
    const accept = strength >= 0.42 + state.trucoLevel * 0.04
    if (accept && strength > 0.7 && state.trucoLevel < 3) {
      // Raise instead of just accepting.
      return { state: callTruco(respondToAcceptThenRaise(state), OPP), phrase: '¡Te subo la apuesta!' }
    }
    return {
      state: respondTruco(state, OPP, accept),
      phrase: accept ? 'Quiero, dale.' : 'No quiero, paso.',
    }
  }

  // Respond to a pending Envido call from the player.
  if (state.envidoPending && state.envidoPending.by !== OPP) {
    const env = computeEnvido(state.hands[OPP])
    const accept = env >= 26
    return {
      state: respondEnvido(state, OPP, accept),
      phrase: accept ? '¡Son buenas!' : 'No quiero.',
    }
  }

  if (state.phase !== 'playing' || state.turn !== OPP) {
    return { state }
  }

  // Optionally call Envido at the very start of the round.
  if (state.currentTrick === 0 && !state.envidoResolved && state.trucoLevel === 0 && state.played.length === 0) {
    const env = computeEnvido(state.hands[OPP])
    if (env >= 30 && Math.random() < 0.85) {
      return { state: callEnvido(state, OPP, 'real-envido'), phrase: '¡Real Envido!' }
    }
    if (env >= 27 && Math.random() < 0.7) {
      return { state: callEnvido(state, OPP, 'envido'), phrase: '¡Envido!' }
    }
  }

  // Optionally call Truco when holding strong cards.
  const strength = handStrength(state.hands[OPP])
  if (state.trucoLevel === 0 && !state.trucoPending && strength > 0.66 && Math.random() < 0.6) {
    return { state: callTruco(state, OPP), phrase: '¡Truco!' }
  }

  // Very weak hand on later tricks -> consider going to the mazo.
  if (state.currentTrick >= 1 && strength < 0.18 && state.trucoLevel >= 2) {
    return { state: goToMazo(state, OPP), phrase: 'Me voy al mazo...' }
  }

  // Play a card.
  return { state: chooseCard(state) }
}

function respondToAcceptThenRaise(state: GameState): GameState {
  return respondTruco(state, OPP, true)
}

/** 0..1 estimate of how strong the bot's remaining hand is. */
function handStrength(hand: { rank: number; suit: string }[]): number {
  if (hand.length === 0) return 0
  // @ts-expect-error structural compatibility with TrucoCard
  const total = hand.reduce((sum, c) => sum + cardPower(c), 0)
  const max = hand.length * 14
  return total / max
}

function chooseCard(state: GameState): GameState {
  const hand = state.hands[OPP]
  if (hand.length === 0) return state

  const playerCardThisTrick = state.played.find(
    (p) => p.trick === state.currentTrick && p.by === 'player',
  )

  let chosenId: string

  if (playerCardThisTrick) {
    // Responding: try to win with the lowest card that beats the player.
    const beating = hand
      .filter((c) => cardPower(c) > cardPower(playerCardThisTrick.card))
      .sort((a, b) => cardPower(a) - cardPower(b))
    if (beating.length > 0) {
      chosenId = beating[0].id
    } else {
      // Can't win: throw the weakest.
      chosenId = [...hand].sort((a, b) => cardPower(a) - cardPower(b))[0].id
    }
  } else {
    // Leading. On first trick lead with a mid/strong card; later lead strongest.
    const sorted = [...hand].sort((a, b) => cardPower(b) - cardPower(a))
    chosenId = state.currentTrick === 0 ? sorted[Math.min(1, sorted.length - 1)].id : sorted[0].id
  }

  return playCard(state, OPP, chosenId)
}
