export type Suit = 'espada' | 'basto' | 'oro' | 'copa'
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12

export interface TrucoCard {
  id: string
  rank: Rank
  suit: Suit
}

export const SUIT_LABELS: Record<Suit, string> = {
  espada: 'Espadas',
  basto: 'Bastos',
  oro: 'Oros',
  copa: 'Copas',
}

const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]
const SUITS: Suit[] = ['espada', 'basto', 'oro', 'copa']

export const CARD_SPRITE_SRC = LBB_TRUCO_DECK.sprite
export const CARD_SPRITE_COLUMNS = 10
export const CARD_SPRITE_ROWS = 5

const SPRITE_RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]
const SPRITE_SUITS: Suit[] = ['oro', 'copa', 'espada', 'basto']

/**
 * Truco card power: higher number beats lower number.
 * Special cards (matadores) get unique high values; the rest follow the
 * standard ranking 3 > 2 > 1(false) > 12 > 11 > 10 > 7(false) > 6 > 5 > 4.
 */
export function cardPower(card: TrucoCard): number {
  const key = `${card.rank}-${card.suit}`
  const matadores: Record<string, number> = {
    '1-espada': 14, // ancho de espadas
    '1-basto': 13, // ancho de bastos
    '7-espada': 12, // siete de espadas
    '7-oro': 11, // siete de oro
  }
  if (matadores[key] !== undefined) return matadores[key]

  const generic: Partial<Record<Rank, number>> = {
    3: 10,
    2: 9,
    1: 8, // anchos falsos (copa / oro)
    12: 7,
    11: 6,
    10: 5,
    7: 4, // sietes falsos (copa / basto)
    6: 3,
    5: 2,
    4: 1,
  }
  return generic[card.rank] ?? 0
}

/** Value of a card for the Envido count. */
export function envidoCardValue(rank: Rank): number {
  if (rank >= 10) return 0
  return rank
}

/** Computes the Envido score for a 3-card hand. */
export function computeEnvido(hand: TrucoCard[]): number {
  let best = 0
  // Pairs of same suit.
  for (let i = 0; i < hand.length; i++) {
    for (let j = i + 1; j < hand.length; j++) {
      if (hand[i].suit === hand[j].suit) {
        const score = 20 + envidoCardValue(hand[i].rank) + envidoCardValue(hand[j].rank)
        if (score > best) best = score
      }
    }
  }
  if (best > 0) return best
  // No pair: highest single card value.
  for (const card of hand) {
    const value = envidoCardValue(card.rank)
    if (value > best) best = value
  }
  return best
}

export function buildDeck(): TrucoCard[] {
  const deck: TrucoCard[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${rank}-${suit}`, rank, suit })
    }
  }
  return deck
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function dealHands(): { player: TrucoCard[]; opponent: TrucoCard[] } {
  const deck = shuffle(buildDeck())
  return {
    player: deck.slice(0, 3),
    opponent: deck.slice(3, 6),
  }
}

/** Image path for the legacy custom Lucky Bingo Bear PNG card asset. */
export function cardImagePath(card: TrucoCard): string {
  return `/truco/cards/${card.rank}-${card.suit}.png`
}

export function cardBackImagePath(): string {
  return LBB_CARD_BACK
}

export function cardSpritePosition(card?: TrucoCard): string {
  if (!card) return '0% 100%'

  const col = SPRITE_RANKS.indexOf(card.rank)
  const row = SPRITE_SUITS.indexOf(card.suit)

  if (col < 0 || row < 0) return '0% 100%'

  const x = (col / (CARD_SPRITE_COLUMNS - 1)) * 100
  const y = (row / (CARD_SPRITE_ROWS - 1)) * 100

  return `${x}% ${y}%`
}
import { LBB_CARD_BACK, LBB_TRUCO_DECK } from '@/lib/brand/assets'
