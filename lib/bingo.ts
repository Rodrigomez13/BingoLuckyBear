export const BINGO_HEADERS = ['B', 'I', 'N', 'G', 'O'] as const

export const BINGO_RANGES = [
  { letter: 'B', min: 1, max: 15 },
  { letter: 'I', min: 16, max: 30 },
  { letter: 'N', min: 31, max: 45 },
  { letter: 'G', min: 46, max: 60 },
  { letter: 'O', min: 61, max: 75 },
] as const

export function isValidBingoCard(cardNumbers: unknown): cardNumbers is number[][] {
  return (
    Array.isArray(cardNumbers) &&
    cardNumbers.length >= 5 &&
    cardNumbers.every((column) => Array.isArray(column) && column.length >= 5)
  )
}

export function getBingoRows(cardNumbers: number[][] | null | undefined) {
  const rows: (number | 'FREE')[][] = []

  if (!isValidBingoCard(cardNumbers)) {
    return rows
  }

  for (let row = 0; row < 5; row++) {
    const rowData: (number | 'FREE')[] = []

    for (let col = 0; col < 5; col++) {
      const num = cardNumbers[col]?.[row]
      rowData.push(num === 0 ? 'FREE' : num)
    }

    rows.push(rowData)
  }

  return rows
}

export function isMarked(cell: number | 'FREE' | undefined, drawnNumbers: number[]) {
  return cell === 'FREE' || (typeof cell === 'number' && drawnNumbers.includes(cell))
}

export function getWinningLines(cardNumbers: number[][] | null | undefined, drawnNumbers: number[]) {
  const rows = getBingoRows(cardNumbers)
  const lines: string[] = []

  if (rows.length !== 5) {
    return lines
  }

  rows.forEach((row, index) => {
    if (row.every((cell) => isMarked(cell, drawnNumbers))) {
      lines.push(`Linea horizontal ${index + 1}`)
    }
  })

  for (let col = 0; col < 5; col++) {
    const column = rows.map((row) => row[col])
    if (column.every((cell) => isMarked(cell, drawnNumbers))) {
      lines.push(`Columna ${BINGO_HEADERS[col]}`)
    }
  }

  const diagonalA = rows.map((row, index) => row[index])
  if (diagonalA.every((cell) => isMarked(cell, drawnNumbers))) {
    lines.push('Diagonal principal')
  }

  const diagonalB = rows.map((row, index) => row[4 - index])
  if (diagonalB.every((cell) => isMarked(cell, drawnNumbers))) {
    lines.push('Diagonal secundaria')
  }

  return lines
}

export function hasWinningLine(cardNumbers: number[][] | null | undefined, drawnNumbers: number[]) {
  return getWinningLines(cardNumbers, drawnNumbers).length > 0
}

export function getAvailableNumbers(drawnNumbers: number[]) {
  const drawn = new Set(drawnNumbers)
  return Array.from({ length: 75 }, (_, index) => index + 1).filter((number) => !drawn.has(number))
}

export function drawNextNumber(drawnNumbers: number[]) {
  const available = getAvailableNumbers(drawnNumbers)

  if (available.length === 0) {
    return null
  }

  return available[Math.floor(Math.random() * available.length)]
}

export function getBingoLetter(number: number) {
  return BINGO_RANGES.find((range) => number >= range.min && number <= range.max)?.letter ?? ''
}

export function getCountdownRemainingSeconds(startedAt: string | null, countdownSeconds: number | null) {
  if (!startedAt || !countdownSeconds) {
    return 0
  }

  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  return Math.max(0, countdownSeconds - elapsed)
}
