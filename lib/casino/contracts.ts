/**
 * Provider-neutral contracts for casino games.
 *
 * External providers must only produce a validated outcome. LBB owns identity,
 * balance changes, idempotency and the transaction ledger.
 */
export type CasinoGameKind = 'roulette' | 'slot' | 'table' | 'crash'

export type CasinoBet = {
  stake: number
  selection: string
}

export type CasinoOutcome = {
  result: string
  payout: number
  metadata: Record<string, unknown>
}

export type CasinoGameAdapter = {
  id: string
  provider: string
  kind: CasinoGameKind
  displayName: string
  allowedStakes: readonly number[]
  maxPayoutMultiplier: number
  resolveRound(input: { bet: CasinoBet; seed: number }): CasinoOutcome
}

export type CasinoSettlement = {
  roundId: string
  balanceBefore: number
  balanceAfter: number
  stake: number
  payout: number
  outcome: CasinoOutcome
}
