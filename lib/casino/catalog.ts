import { lbbRouletteAdapter } from '@/lib/casino/adapters/lbb-roulette'
import type { CasinoGameAdapter } from '@/lib/casino/contracts'

const ADAPTERS: readonly CasinoGameAdapter[] = [lbbRouletteAdapter]

export function getCasinoGameAdapter(gameId: string) {
  return ADAPTERS.find((adapter) => adapter.id === gameId) ?? null
}

export function getCasinoCatalog() {
  return ADAPTERS.map(({ id, provider, kind, displayName, allowedStakes }) => ({
    id,
    provider,
    kind,
    displayName,
    allowedStakes,
  }))
}
