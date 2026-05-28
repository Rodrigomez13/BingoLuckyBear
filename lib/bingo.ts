export const BINGO_TOTAL_BALLS = 90

export const BINGO_90_COLUMN_LABELS = ['1-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-90'] as const

export const BINGO_90_RANGES = [
  { min: 1, max: 9 },
  { min: 10, max: 19 },
  { min: 20, max: 29 },
  { min: 30, max: 39 },
  { min: 40, max: 49 },
  { min: 50, max: 59 },
  { min: 60, max: 69 },
  { min: 70, max: 79 },
  { min: 80, max: 90 },
] as const

const LEGACY_BINGO_HEADERS = ['B', 'I', 'N', 'G', 'O'] as const
const LEGACY_BINGO_RANGES = [
  { letter: 'B', min: 1, max: 15 },
  { letter: 'I', min: 16, max: 30 },
  { letter: 'N', min: 31, max: 45 },
  { letter: 'G', min: 46, max: 60 },
  { letter: 'O', min: 61, max: 75 },
] as const

export type BingoCell = number | null | 'FREE'
export type BingoPrizeNumber = 1 | 2 | 3

export interface BingoPrizeCard {
  id: string
  card_number: string
  full_name: string
  bingo_numbers?: number[][] | null
}

export interface BingoPrizeTarget {
  prizeNumber: BingoPrizeNumber
  rowIndex: number
  amount: string
}

export interface BingoPrizeAward extends BingoPrizeTarget {
  drawIndex: number
  drawnNumber: number
  winners: BingoPrizeCard[]
}

function isNumberGrid(cardNumbers: unknown): cardNumbers is number[][] {
  return Array.isArray(cardNumbers) && cardNumbers.every((row) => Array.isArray(row))
}

export function isBingo90Card(cardNumbers: unknown): cardNumbers is number[][] {
  return isNumberGrid(cardNumbers) && cardNumbers.length === 3 && cardNumbers.every((row) => row.length === 9)
}

function isLegacyBingo75Card(cardNumbers: unknown): cardNumbers is number[][] {
  return (
    isNumberGrid(cardNumbers) &&
    cardNumbers.length >= 5 &&
    cardNumbers.every((column) => column.length >= 5)
  )
}

export function isValidBingoCard(cardNumbers: unknown): cardNumbers is number[][] {
  return isBingo90Card(cardNumbers) || isLegacyBingo75Card(cardNumbers)
}

function randomSample<T>(items: T[], count: number) {
  const pool = [...items]
  const result: T[] = []

  for (let index = 0; index < count; index++) {
    const randomIndex = Math.floor(Math.random() * pool.length)
    result.push(pool[randomIndex])
    pool.splice(randomIndex, 1)
  }

  return result
}

export function generateBingoNumbers(): number[][] {
  const columnIndexes = Array.from({ length: BINGO_90_RANGES.length }, (_, index) => index)
  let rows: number[][] = []
  let columnCounts: number[] = []

  do {
    rows = Array.from({ length: 3 }, () => randomSample(columnIndexes, 5).sort((a, b) => a - b))
    columnCounts = columnIndexes.map((column) => rows.filter((row) => row.includes(column)).length)
  } while (columnCounts.some((count) => count === 0))

  const card = Array.from({ length: 3 }, () => Array.from({ length: BINGO_90_RANGES.length }, () => 0))

  BINGO_90_RANGES.forEach((range, columnIndex) => {
    const selectedRows = rows
      .map((row, rowIndex) => (row.includes(columnIndex) ? rowIndex : null))
      .filter((rowIndex): rowIndex is number => rowIndex !== null)
    const available = Array.from({ length: range.max - range.min + 1 }, (_, index) => range.min + index)
    const numbers = randomSample(available, selectedRows.length).sort((a, b) => a - b)

    selectedRows.forEach((rowIndex, index) => {
      card[rowIndex][columnIndex] = numbers[index]
    })
  })

  return card
}

function amountValue(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : 0
}

export function normalizePrizeAmounts(prizes: string[]) {
  return prizes
    .map((item) => item.trim())
    .filter(Boolean)
    .sort((a, b) => amountValue(b) - amountValue(a))
    .slice(0, 3)
}

export function formatMoneyAmount(value?: string | null, fallback = 'A confirmar') {
  const trimmed = value?.trim()

  if (!trimmed) {
    return fallback
  }

  if (!/\d/.test(trimmed)) {
    return trimmed
  }

  if (/[$€£¥]|ARS|USD/i.test(trimmed)) {
    return trimmed
  }

  return `$${trimmed}`
}

export function getPrizeAmounts(prize?: string | null, additionalPrizes?: string[] | null) {
  return normalizePrizeAmounts([prize ?? '', ...(additionalPrizes ?? [])]).map((amount) => formatMoneyAmount(amount))
}

export function getPrizeSchedule(prizeAmounts: string[]): BingoPrizeTarget[] {
  const amounts = normalizePrizeAmounts(prizeAmounts)

  return [3, 2, 1].map((prizeNumber) => ({
    prizeNumber: prizeNumber as BingoPrizeNumber,
    rowIndex: prizeNumber - 1,
    amount: amounts[prizeNumber - 1] ?? '',
  }))
}

export function getPrizeLabel(prizeNumber: BingoPrizeNumber) {
  return `Premio ${prizeNumber}`
}

export function getBingoRows(cardNumbers: number[][] | null | undefined): BingoCell[][] {
  const rows: BingoCell[][] = []

  if (isBingo90Card(cardNumbers)) {
    return cardNumbers.map((row) => row.map((cell) => (cell > 0 ? cell : null)))
  }

  if (!isLegacyBingo75Card(cardNumbers)) {
    return rows
  }

  for (let row = 0; row < 5; row++) {
    const rowData: BingoCell[] = []

    for (let col = 0; col < 5; col++) {
      const num = cardNumbers[col]?.[row]
      rowData.push(num === 0 ? 'FREE' : num)
    }

    rows.push(rowData)
  }

  return rows
}

export function getBingoColumnLabels(cardNumbers: number[][] | null | undefined) {
  return isBingo90Card(cardNumbers) ? BINGO_90_COLUMN_LABELS : LEGACY_BINGO_HEADERS
}

export function isMarked(cell: BingoCell | undefined, drawnNumbers: number[]) {
  return cell === 'FREE' || (typeof cell === 'number' && drawnNumbers.includes(cell))
}

export function getBingoRowNumbers(cardNumbers: number[][] | null | undefined, rowIndex: number) {
  if (!isBingo90Card(cardNumbers)) {
    return []
  }

  return cardNumbers[rowIndex]?.filter((number) => number > 0) ?? []
}

export function isBingoRowComplete(cardNumbers: number[][] | null | undefined, rowIndex: number, drawnNumbers: number[]) {
  const rowNumbers = getBingoRowNumbers(cardNumbers, rowIndex)

  return rowNumbers.length === 5 && rowNumbers.every((number) => drawnNumbers.includes(number))
}

export function getPrizeAwards(cards: BingoPrizeCard[], drawnNumbers: number[], prizeAmounts: string[]) {
  const awards: BingoPrizeAward[] = []
  const schedule = getPrizeSchedule(prizeAmounts)
  let searchStartIndex = 0

  for (const target of schedule) {
    for (let drawIndex = searchStartIndex; drawIndex < drawnNumbers.length; drawIndex++) {
      const currentDrawnNumbers = drawnNumbers.slice(0, drawIndex + 1)
      const winners = cards.filter((card) => isBingoRowComplete(card.bingo_numbers, target.rowIndex, currentDrawnNumbers))

      if (winners.length > 0) {
        awards.push({
          ...target,
          drawIndex,
          drawnNumber: drawnNumbers[drawIndex],
          winners,
        })
        searchStartIndex = drawIndex
        break
      }
    }
  }

  return awards
}

export function getCurrentPrizeTarget(cards: BingoPrizeCard[], drawnNumbers: number[], prizeAmounts: string[]) {
  const awards = getPrizeAwards(cards, drawnNumbers, prizeAmounts)
  const awardedPrizeNumbers = new Set(awards.map((award) => award.prizeNumber))

  return getPrizeSchedule(prizeAmounts).find((target) => !awardedPrizeNumbers.has(target.prizeNumber)) ?? null
}

export function getWinningLines(cardNumbers: number[][] | null | undefined, drawnNumbers: number[]) {
  const rows = getBingoRows(cardNumbers)
  const lines: string[] = []

  if (isBingo90Card(cardNumbers)) {
    rows.forEach((row, index) => {
      const numbers = row.filter((cell): cell is number => typeof cell === 'number')

      if (numbers.length === 5 && numbers.every((number) => drawnNumbers.includes(number))) {
        lines.push(`${getPrizeLabel((index + 1) as BingoPrizeNumber)} - fila ${index + 1}`)
      }
    })

    return lines
  }

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
      lines.push(`Columna ${LEGACY_BINGO_HEADERS[col]}`)
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
  return Array.from({ length: BINGO_TOTAL_BALLS }, (_, index) => index + 1).filter((number) => !drawn.has(number))
}

export function drawNextNumber(drawnNumbers: number[]) {
  const available = getAvailableNumbers(drawnNumbers)

  if (available.length === 0) {
    return null
  }

  return available[Math.floor(Math.random() * available.length)]
}

export function getBingoLetter(number: number) {
  return LEGACY_BINGO_RANGES.find((range) => number >= range.min && number <= range.max)?.letter ?? ''
}

export function formatDrawnNumber(number: number | null | undefined) {
  return number ? String(number) : '--'
}

export function getCountdownRemainingSeconds(startedAt: string | null, countdownSeconds: number | null) {
  if (!startedAt || !countdownSeconds) {
    return 0
  }

  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  return Math.max(0, countdownSeconds - elapsed)
}
