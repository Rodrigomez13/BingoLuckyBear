import type { CasinoGameAdapter } from '@/lib/casino/contracts'

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])
const ALLOWED_STAKES = [25, 50, 100, 200, 500, 1000] as const

/**
 * Minimal table-game adapter used to prove the external-casino integration
 * seam. Its outcome is generated server-side; it never trusts the browser.
 */
export const lbbRouletteAdapter: CasinoGameAdapter = {
  id: 'lbb-roulette-poc',
  provider: 'lbb-native',
  kind: 'roulette',
  displayName: 'Ruleta Lucky Bear',
  allowedStakes: ALLOWED_STAKES,
  maxPayoutMultiplier: 2,
  resolveRound({ bet, seed }) {
    const number = seed % 37
    const color = number === 0 ? 'green' : RED_NUMBERS.has(number) ? 'red' : 'black'
    const won = bet.selection === color
    const payout = won ? bet.stake * 2 : 0

    return {
      result: `${number} ${color}`,
      payout,
      metadata: { number, color, selection: bet.selection, won, engine: 'lbb-native-roulette-v1' },
    }
  },
}
