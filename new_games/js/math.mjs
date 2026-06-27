export function mulberry32(seed) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createGameMath(symbols, { reels = 6, minRows = 2, maxRows = 7, payoutScale = 0.012 } = {}) {
  const totalWeight = symbols.reduce((total, symbol) => total + symbol.weight, 0)
  const wild = symbols.find(symbol => symbol.wild)

  function weightedSymbol(rng = Math.random) {
    let roll = rng() * totalWeight
    for (const symbol of symbols) {
      roll -= symbol.weight
      if (roll <= 0) return symbol
    }
    return symbols[0]
  }

  function makeGrid(rng = Math.random, rowCounts = null) {
    return Array.from({ length: reels }, (_, reel) => {
      const rows = rowCounts?.[reel] ?? minRows + Math.floor(rng() * (maxRows - minRows + 1))
      return Array.from({ length: rows }, () => weightedSymbol(rng))
    })
  }

  function activeWays(grid) {
    return grid.reduce((ways, reel) => ways * reel.length, 1)
  }

  function evaluate(grid, stake, multiplier = 1) {
    let raw = 0
    const cells = new Set()
    const details = []
    for (const base of symbols.filter(symbol => symbol.pay)) {
      let reelCount = 0
      let ways = 1
      const involved = []
      for (let reelIndex = 0; reelIndex < grid.length; reelIndex++) {
        const hits = []
        grid[reelIndex].forEach((symbol, rowIndex) => {
          if (symbol.key === base.key || symbol.wild) hits.push(`${reelIndex}-${rowIndex}`)
        })
        if (!hits.length) break
        reelCount++
        ways *= hits.length
        involved.push(...hits)
      }
      if (reelCount >= 3) {
        const unit = base.pay[Math.min(6, reelCount)] ?? 0
        const value = stake * unit * ways * payoutScale * multiplier
        raw += value
        involved.forEach(cell => cells.add(cell))
        details.push({ symbol: base.name, reels: reelCount, ways, value })
      }
    }
    return { win: Math.round(raw), cells, details }
  }

  function scatterCount(grid) {
    return grid.flat().filter(symbol => symbol.bonus).length
  }

  function applyStickyWilds(grid, lockedCells) {
    if (!wild || !lockedCells?.size) return grid
    return grid.map((reel, reelIndex) => reel.map((symbol, rowIndex) => (
      lockedCells.has(`${reelIndex}-${rowIndex}`) ? wild : symbol
    )))
  }

  function collapseGrid(grid, winningCells, rng = Math.random, lockedCells = new Set()) {
    const offsets = new Map()
    const next = grid.map((reel, reelIndex) => {
      const result = Array(reel.length)
      const lockedRows = [...lockedCells]
        .map(key => key.split('-').map(Number))
        .filter(([lockedReel, row]) => lockedReel === reelIndex && row >= 0 && row < reel.length)
        .map(([, row]) => row)
        .sort((a, b) => a - b)

      for (const row of lockedRows) result[row] = reel[row]
      const boundaries = [-1, ...lockedRows, reel.length]
      for (let segment = 0; segment < boundaries.length - 1; segment++) {
        const start = boundaries[segment] + 1
        const end = boundaries[segment + 1] - 1
        if (end < start) continue
        const availableRows = Array.from({ length: end - start + 1 }, (_, index) => start + index)
        const survivors = availableRows
          .filter(row => !winningCells.has(`${reelIndex}-${row}`))
          .map(row => ({ symbol: reel[row], oldRow: row }))
        const missing = availableRows.length - survivors.length
        const targetRows = availableRows.slice(-survivors.length)
        const freshRows = availableRows.slice(0, missing)

        freshRows.forEach((row, index) => {
          result[row] = weightedSymbol(rng)
          offsets.set(`${reelIndex}-${row}`, Math.max(1, missing - index))
        })
        survivors.forEach((entry, index) => {
          const targetRow = targetRows[index]
          result[targetRow] = entry.symbol
          const fall = targetRow - entry.oldRow
          if (fall > 0) offsets.set(`${reelIndex}-${targetRow}`, fall)
        })
      }
      return result
    })
    return { grid: next, offsets }
  }

  return { weightedSymbol, makeGrid, activeWays, evaluate, scatterCount, applyStickyWilds, collapseGrid }
}
