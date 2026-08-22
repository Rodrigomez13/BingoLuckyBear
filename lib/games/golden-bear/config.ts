export const GOLDEN_BEAR_DEFAULT_SETTINGS = {
  enabled: true,
  bonusBuyEnabled: true,
  bonusBuyPrice: 100,
  bonusBuySpins: 6,
  bonusBuyLabel: 'Comprar Bonus',
  bonusBuyDescription: 'Activá giros gratis del Oso Dorado por un valor fijo.',
  validStakes: [25, 50, 100, 200, 500, 1000],
}

export type GoldenBearSettings = typeof GOLDEN_BEAR_DEFAULT_SETTINGS

type MaybeSettingsRow = {
  enabled?: boolean | null
  bonus_buy_enabled?: boolean | null
  bonus_buy_price?: number | string | null
  bonus_buy_spins?: number | string | null
  bonus_buy_label?: string | null
  bonus_buy_description?: string | null
  valid_stakes?: unknown
}

export function normalizeGoldenBearSettings(row?: MaybeSettingsRow | null): GoldenBearSettings {
  const validStakes = Array.isArray(row?.valid_stakes)
    ? row?.valid_stakes.map((value) => Math.trunc(Number(value))).filter((value) => Number.isFinite(value) && value > 0)
    : GOLDEN_BEAR_DEFAULT_SETTINGS.validStakes

  return {
    enabled: row?.enabled ?? GOLDEN_BEAR_DEFAULT_SETTINGS.enabled,
    bonusBuyEnabled: row?.bonus_buy_enabled ?? GOLDEN_BEAR_DEFAULT_SETTINGS.bonusBuyEnabled,
    bonusBuyPrice: Math.max(1, Math.trunc(Number(row?.bonus_buy_price ?? GOLDEN_BEAR_DEFAULT_SETTINGS.bonusBuyPrice))),
    bonusBuySpins: Math.max(1, Math.min(50, Math.trunc(Number(row?.bonus_buy_spins ?? GOLDEN_BEAR_DEFAULT_SETTINGS.bonusBuySpins)))),
    bonusBuyLabel: String(row?.bonus_buy_label || GOLDEN_BEAR_DEFAULT_SETTINGS.bonusBuyLabel),
    bonusBuyDescription: String(row?.bonus_buy_description || GOLDEN_BEAR_DEFAULT_SETTINGS.bonusBuyDescription),
    validStakes: validStakes.length ? validStakes : GOLDEN_BEAR_DEFAULT_SETTINGS.validStakes,
  }
}
