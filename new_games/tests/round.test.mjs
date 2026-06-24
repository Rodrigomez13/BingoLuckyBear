import test from 'node:test'
import assert from 'node:assert/strict'
import { MAX_WIN_MULTIPLIER } from '../js/config.mjs'
import { playGoldenBearRound } from '../js/round.mjs'

test('una misma semilla resuelve exactamente la misma ronda', () => {
  const first = playGoldenBearRound({ seed: 24681012, stake: 100 })
  const second = playGoldenBearRound({ seed: 24681012, stake: 100 })
  assert.deepEqual(first, second)
})

test('el premio coincide con las cascadas y respeta el máximo', () => {
  const round = playGoldenBearRound({ seed: 1357911, stake: 200 })
  const cascades = round.spins.flatMap(spin => spin.cascades)
  const rawPayout = cascades.reduce((total, cascade) => total + cascade.win, 0)
  assert.equal(round.payout, Math.min(rawPayout, round.stake * MAX_WIN_MULTIPLIER))
  assert.ok(round.spins.every(spin => spin.initialGrid.length === 6))
})
