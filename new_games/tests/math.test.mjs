import test from 'node:test'
import assert from 'node:assert/strict'

import { createGameMath, mulberry32 } from '../js/math.mjs'

const A = { key: 'A', name: 'A', weight: 1, pay: { 3: 1, 4: 2, 5: 3, 6: 4 } }
const B = { key: 'B', name: 'B', weight: 1, pay: { 3: 0.5, 4: 1, 5: 2, 6: 3 } }
const W = { key: 'WILD', name: 'WILD', weight: 1, wild: true }

test('la semilla genera secuencias reproducibles', () => {
  const first = mulberry32(20260623)
  const second = mulberry32(20260623)
  assert.deepEqual(Array.from({ length: 12 }, first), Array.from({ length: 12 }, second))
})

test('los premios Megaways se evalúan desde el primer carrete y WILD sustituye', () => {
  const math = createGameMath([A, B, W], { reels: 6, minRows: 1, maxRows: 1, payoutScale: 0.06 })
  const grid = [[A, W], [A], [W, A], [A], [B], [A]]
  const result = math.evaluate(grid, 100, 1)
  const aPay = result.details.find(detail => detail.symbol === 'A')
  assert.equal(aPay.reels, 4)
  assert.equal(aPay.ways, 4)
  assert.equal(aPay.value, 48)
  assert.equal(result.cells.has('2-1'), true)
})

test('la cascada conserva el orden y reemplaza únicamente las posiciones ganadoras', () => {
  const math = createGameMath([A, B], { reels: 1, minRows: 4, maxRows: 4 })
  const original = [[B, A, B, A]]
  const result = math.collapseGrid(original, new Set(['0-1', '0-3']), () => 0)
  assert.deepEqual(result.grid[0].map(symbol => symbol.key), ['A', 'A', 'B', 'B'])
  assert.equal(result.offsets.get('0-2'), 2)
  assert.equal(result.offsets.get('0-3'), 1)
})

test('un WILD fijo divide la columna sin moverse durante la cascada', () => {
  const math = createGameMath([A, B, W], { reels: 1, minRows: 5, maxRows: 5 })
  const original = [[B, W, B, A, B]]
  const result = math.collapseGrid(original, new Set(['0-4']), () => 0, new Set(['0-1']))
  assert.deepEqual(result.grid[0].map(symbol => symbol.key), ['B', 'WILD', 'A', 'B', 'A'])
  assert.equal(result.grid[0][1], W)
})

test('los WILD persistentes se aplican solo a las celdas bloqueadas', () => {
  const math = createGameMath([A, B, W], { reels: 2, minRows: 2, maxRows: 2 })
  const result = math.applyStickyWilds([[A, B], [B, A]], new Set(['0-1', '1-0']))
  assert.deepEqual(result.map(reel => reel.map(symbol => symbol.key)), [['A', 'WILD'], ['WILD', 'A']])
})
