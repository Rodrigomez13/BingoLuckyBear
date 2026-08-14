export type Difficulty = 'facil' | 'normal' | 'dificil'

// Minimal AI: pick random playable card and simple responses
export function chooseCardAI(hand: any[]) {
  if (!hand || hand.length === 0) return null
  return hand[Math.floor(Math.random() * hand.length)].id
}

export function shouldAcceptTruco(difficulty: Difficulty) {
  return difficulty !== 'facil'
}
