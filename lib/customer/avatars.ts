export const CUSTOMER_AVATARS = [
  { key: 'golden_bear', label: 'Oso dorado', emoji: '🐻', gradient: 'from-amber-300 to-yellow-600' },
  { key: 'lucky_clover', label: 'Trébol lucky', emoji: '🍀', gradient: 'from-emerald-300 to-green-700' },
  { key: 'bingo_ball', label: 'Bola bingo', emoji: '🎱', gradient: 'from-zinc-100 to-zinc-500' },
  { key: 'gold_coin', label: 'Moneda oro', emoji: '🪙', gradient: 'from-yellow-200 to-amber-600' },
  { key: 'card_star', label: 'Carta estrella', emoji: '🃏', gradient: 'from-sky-300 to-indigo-700' },
  { key: 'crown_bear', label: 'Corona', emoji: '👑', gradient: 'from-fuchsia-300 to-purple-700' },
] as const

export type CustomerAvatarKey = (typeof CUSTOMER_AVATARS)[number]['key']

export function isCustomerAvatarKey(value: unknown): value is CustomerAvatarKey {
  return CUSTOMER_AVATARS.some((avatar) => avatar.key === value)
}

export function getCustomerAvatar(key?: string | null) {
  return CUSTOMER_AVATARS.find((avatar) => avatar.key === key) ?? CUSTOMER_AVATARS[0]
}
