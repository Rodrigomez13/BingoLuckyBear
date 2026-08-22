export interface GoldenBearCascade {
  cells: string[]
  win: number
  details: Array<{ symbol: string; reels: number; ways: number; value: number }>
  multiplier: number
  nextMultiplier: number
  nextGrid: string[][]
  offsets: Array<[string, number]>
}

export interface GoldenBearSpin {
  free: boolean
  initialGrid: string[][]
  finalGrid: string[][]
  rowCounts: number[]
  scatters: number
  cascades: GoldenBearCascade[]
  totalWin: number
  awardedFreeSpins: number
  stickyWilds: string[]
  finalMultiplier: number
  freeSpinsRemaining: number
}

export interface GoldenBearRound {
  seed: number
  stake: number
  spins: GoldenBearSpin[]
  payout: number
  capped: boolean
}

export function playGoldenBearRound(input: { seed: number; stake: number }): GoldenBearRound
