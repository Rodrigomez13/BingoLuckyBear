import { MAX_CASCADES, MAX_MULTIPLIER, MAX_ROWS, MAX_STICKY_WILDS, MIN_ROWS, PAYOUT_SCALE, REELS, RETRIGGER_SPINS, SYMBOLS } from '../new_games/js/config.mjs'
import { createGameMath, mulberry32 } from '../new_games/js/math.mjs'

const rounds = Math.max(1, Number.parseInt(process.argv[2] || '100000', 10))
const seed = Number.parseInt(process.argv[3] || '20260623', 10)
const stake = 100
const rng = mulberry32(seed)
const math = createGameMath(SYMBOLS, { reels: REELS, minRows: MIN_ROWS, maxRows: MAX_ROWS, payoutScale: PAYOUT_SCALE })

function collectWilds(grid, sticky) {
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

function playRound({ rowCounts = null, sticky = new Set(), multiplier = 1, free = false } = {}) {
  let grid = math.makeGrid(rng, rowCounts)
  if (free) {
    grid = math.applyStickyWilds(grid, sticky)
    collectWilds(grid, sticky)
  }
  const initialScatters = math.scatterCount(grid)

  let win = 0
  let cascades = 0
  let result = math.evaluate(grid, stake, multiplier)
  while (result.win > 0 && cascades < MAX_CASCADES) {
    win += result.win
    cascades++
    const removable = new Set([...result.cells].filter(cell => !sticky.has(cell)))
    const collapsed = math.collapseGrid(grid, removable, rng, free ? sticky : new Set())
    grid = math.applyStickyWilds(collapsed.grid, free ? sticky : new Set())
    multiplier = Math.min(MAX_MULTIPLIER, multiplier + 1)
    if (free) collectWilds(grid, sticky)
    result = math.evaluate(grid, stake, multiplier)
  }
  return { win, cascades, grid, scatters: initialScatters, multiplier }
}

let totalWin = 0
let paidHits = 0
let bonusEntries = 0
let retriggers = 0
let totalCascades = 0
let totalFreeSpins = 0

for (let round = 0; round < rounds; round++) {
  const base = playRound()
  totalWin += base.win
  totalCascades += base.cascades
  if (base.win > 0) paidHits++
  if (base.scatters < 3) continue

  bonusEntries++
  let freeSpins = base.scatters >= 5 ? 12 : base.scatters === 4 ? 10 : 8
  let multiplier = Math.max(2, base.multiplier)
  const rowCounts = base.grid.map(reel => reel.length)
  const sticky = new Set()
  let safety = 0

  while (freeSpins > 0 && safety++ < 250) {
    freeSpins--
    totalFreeSpins++
    const freeRound = playRound({ rowCounts, sticky, multiplier, free: true })
    totalWin += freeRound.win
    totalCascades += freeRound.cascades
    multiplier = freeRound.multiplier
    if (freeRound.scatters >= 3) {
      freeSpins += RETRIGGER_SPINS + Math.max(0, freeRound.scatters - 3) * 2
      retriggers++
    }
  }
}

const wagered = rounds * stake
const report = {
  rounds,
  seed,
  wagered,
  returned: totalWin,
  theoreticalReturnPercent: Number((totalWin / wagered * 100).toFixed(3)),
  paidHitRatePercent: Number((paidHits / rounds * 100).toFixed(3)),
  bonusEntryRatePercent: Number((bonusEntries / rounds * 100).toFixed(3)),
  averageCascadesPerPaidRound: Number((totalCascades / rounds).toFixed(4)),
  freeSpinsPlayed: totalFreeSpins,
  retriggers,
}

console.log(JSON.stringify(report, null, 2))
