import {
  MAX_CASCADES,
  MAX_MULTIPLIER,
  MAX_ROWS,
  MAX_STICKY_WILDS,
  MAX_WIN_MULTIPLIER,
  MIN_ROWS,
  PAYOUT_SCALE,
  REELS,
  RETRIGGER_SPINS,
  SYMBOLS,
} from './config.mjs'
import { createGameMath, mulberry32 } from './math.mjs'

const math = createGameMath(SYMBOLS, {
  reels: REELS,
  minRows: MIN_ROWS,
  maxRows: MAX_ROWS,
  payoutScale: PAYOUT_SCALE,
})

const serializeGrid = grid => grid.map(reel => reel.map(symbol => symbol.key))

function collectStickyWilds(grid, sticky, rng) {
  const candidates = []
  grid.forEach((reel, reelIndex) => reel.forEach((symbol, rowIndex) => {
    const cell = `${reelIndex}-${rowIndex}`
    if (symbol.wild && !sticky.has(cell)) candidates.push(cell)
  }))
  for (let index = candidates.length - 1; index > 0; index--) {
    const target = Math.floor(rng() * (index + 1))
    ;[candidates[index], candidates[target]] = [candidates[target], candidates[index]]
  }
  const available = Math.max(0, MAX_STICKY_WILDS - sticky.size)
  candidates.slice(0, Math.min(2, available)).forEach(cell => sticky.add(cell))
}

function playSpin({ rng, stake, free, rowCounts, sticky, multiplier }) {
  let grid = math.makeGrid(rng, rowCounts)
  if (free) grid = math.applyStickyWilds(grid, sticky)
  const initialScatters = math.scatterCount(grid)
  if (free) collectStickyWilds(grid, sticky, rng)

  const spin = {
    free,
    initialGrid: serializeGrid(grid),
    rowCounts: grid.map(reel => reel.length),
    scatters: initialScatters,
    cascades: [],
    totalWin: 0,
    awardedFreeSpins: 0,
    stickyWilds: [],
    finalMultiplier: multiplier,
    freeSpinsRemaining: 0,
  }

  let result = math.evaluate(grid, stake, multiplier)
  while (result.win > 0 && spin.cascades.length < MAX_CASCADES) {
    const removable = new Set([...result.cells].filter(cell => !sticky.has(cell)))
    const collapsed = math.collapseGrid(grid, removable, rng, free ? sticky : new Set())
    grid = math.applyStickyWilds(collapsed.grid, free ? sticky : new Set())
    const nextMultiplier = Math.min(MAX_MULTIPLIER, multiplier + 1)
    spin.totalWin += result.win
    spin.cascades.push({
      cells: [...result.cells],
      win: result.win,
      details: result.details,
      multiplier,
      nextMultiplier,
      nextGrid: serializeGrid(grid),
      offsets: [...collapsed.offsets.entries()],
    })
    multiplier = nextMultiplier
    if (free) collectStickyWilds(grid, sticky, rng)
    result = math.evaluate(grid, stake, multiplier)
  }

  spin.finalMultiplier = multiplier
  spin.stickyWilds = [...sticky]
  spin.finalGrid = serializeGrid(grid)
  spin.awardedFreeSpins = initialScatters >= 3
    ? free
      ? RETRIGGER_SPINS + Math.max(0, initialScatters - 3) * 2
      : initialScatters >= 5 ? 12 : initialScatters === 4 ? 10 : 8
    : 0
  return spin
}

export function playGoldenBearRound({ seed, stake }) {
  const rng = mulberry32(seed)
  const sticky = new Set()
  const spins = []
  const base = playSpin({ rng, stake, free: false, rowCounts: null, sticky, multiplier: 1 })
  spins.push(base)

  let freeSpins = base.awardedFreeSpins
  let multiplier = Math.max(2, base.finalMultiplier)
  const bonusRows = base.finalGrid.map(reel => reel.length)
  let safety = 0

  while (freeSpins > 0 && safety++ < 250) {
    freeSpins--
    const freeSpin = playSpin({ rng, stake, free: true, rowCounts: bonusRows, sticky, multiplier })
    freeSpins += freeSpin.awardedFreeSpins
    freeSpin.freeSpinsRemaining = freeSpins
    spins.push(freeSpin)
    multiplier = freeSpin.finalMultiplier
  }

  const uncappedPayout = spins.reduce((total, spin) => total + spin.totalWin, 0)
  return {
    seed,
    stake,
    spins,
    payout: Math.min(uncappedPayout, stake * MAX_WIN_MULTIPLIER),
    capped: uncappedPayout > stake * MAX_WIN_MULTIPLIER,
  }
}
