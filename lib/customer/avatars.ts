export const CUSTOMER_AVATARS = [
  { key: 'golden_bear', label: 'Rey dorado', motif: 'scepter', colors: ['#051828', '#0f3b2e'], accent: '#f6c23e' },
  { key: 'lucky_truco', label: 'Jugador Truco', motif: 'cards', colors: ['#082516', '#164a2f'], accent: '#e5b85b' },
  { key: 'blue_swordsman', label: 'Espadachin azul', motif: 'sword', colors: ['#061a35', '#0d4f76'], accent: '#d7a844' },
  { key: 'coin_gentleman', label: 'Caballero oro', motif: 'coin', colors: ['#09230c', '#2b6a1d'], accent: '#ffd55a' },
  { key: 'bingo_caller', label: 'Binguero', motif: 'bingo', colors: ['#251138', '#4f1d65'], accent: '#e8bb41' },
  { key: 'club_guard', label: 'Guardian basto', motif: 'club', colors: ['#0a2b19', '#315c1f'], accent: '#d99b37' },
  { key: 'crown_bear', label: 'Campeon corona', motif: 'crown', colors: ['#310911', '#8a1b1b'], accent: '#ffcf58' },
  { key: 'bingo_champion', label: 'Campeon bingo', motif: 'board', colors: ['#25133e', '#5b2d72'], accent: '#f0c14f' },
  { key: 'gold_coin', label: 'Maestro monedas', motif: 'coin-stack', colors: ['#071c37', '#0e4774'], accent: '#ffd15c' },
  { key: 'newsboy_sword', label: 'Espada clasico', motif: 'sword', colors: ['#0b2917', '#405b24'], accent: '#d9a642' },
  { key: 'top_hat_trophy', label: 'Trofeo gala', motif: 'trophy', colors: ['#330c0d', '#5e1b20'], accent: '#f4bd44' },
  { key: 'hoodie_token', label: 'Token LBB', motif: 'token', colors: ['#05213a', '#0d4362'], accent: '#f0c24c' },
  { key: 'card_master', label: 'Maestro cartas', motif: 'cards', colors: ['#061d2d', '#114a66'], accent: '#e9b855' },
  { key: 'royal_scepter', label: 'Rey escarlata', motif: 'scepter', colors: ['#3a0808', '#8b1e18'], accent: '#f6c247' },
  { key: 'dice_keeper', label: 'Cubilete', motif: 'dice', colors: ['#25113b', '#5b2b66'], accent: '#e0ab43' },
  { key: 'captain_coin', label: 'Capitan LBB', motif: 'token', colors: ['#061c3b', '#0f4c86'], accent: '#ffd35f' },
  { key: 'ace_trophy', label: 'As de copa', motif: 'trophy-card', colors: ['#051f33', '#164a5f'], accent: '#f2bb4b' },
  { key: 'card_smile', label: 'Cartas suerte', motif: 'cards', colors: ['#06182d', '#0f355e'], accent: '#e6b450' },
  { key: 'royal_blue', label: 'Realeza azul', motif: 'crown', colors: ['#061f39', '#164a87'], accent: '#f1c24d' },
  { key: 'lottery_guard', label: 'Bolillero oro', motif: 'bingo', colors: ['#0c301d', '#1d6840'], accent: '#f6c24e' },
  { key: 'ace_club', label: 'As de basto', motif: 'club-card', colors: ['#0c2d1e', '#235a35'], accent: '#e0a746' },
  { key: 'stack_champion', label: 'Fichas premium', motif: 'chips', colors: ['#311041', '#61318a'], accent: '#e8bc4b' },
  { key: 'lbb_hoodie', label: 'Hoodie LBB', motif: 'token', colors: ['#061b35', '#183d78'], accent: '#f2bd4b' },
  { key: 'sword_card', label: 'As espada', motif: 'sword-card', colors: ['#340b0b', '#831717'], accent: '#efb64c' },
  { key: 'baton_keeper', label: 'Basto dorado', motif: 'club', colors: ['#061a33', '#164a73'], accent: '#db9f35' },
  { key: 'green_blade', label: 'Hoja de espada', motif: 'sword', colors: ['#052816', '#116637'], accent: '#efbf4f' },
  { key: 'gala_cup', label: 'Copa gala', motif: 'trophy-card', colors: ['#330b0e', '#6d1d1f'], accent: '#e9b54c' },
  { key: 'coin_table', label: 'Mesa monedas', motif: 'coin-stack', colors: ['#0b2a1c', '#3e6824'], accent: '#f2c656' },
  { key: 'armor_club', label: 'Armadura suerte', motif: 'club-card', colors: ['#082348', '#174e85'], accent: '#e3ae42' },
  { key: 'two_coins', label: 'Doble moneda', motif: 'coin', colors: ['#301343', '#642f83'], accent: '#eec04f' },

  // Legacy keys kept so existing customer_profiles rows still render safely.
  { key: 'lucky_clover', label: 'Truco verde', motif: 'club', colors: ['#0a2b19', '#315c1f'], accent: '#d99b37' },
  { key: 'bingo_ball', label: 'Bolillero', motif: 'bingo', colors: ['#251138', '#4f1d65'], accent: '#e8bb41' },
  { key: 'card_star', label: 'Cartas estrella', motif: 'cards', colors: ['#061d2d', '#114a66'], accent: '#e9b855' },
] as const

export type CustomerAvatarKey = (typeof CUSTOMER_AVATARS)[number]['key']
export type CustomerAvatar = (typeof CUSTOMER_AVATARS)[number]

export function isCustomerAvatarKey(value: unknown): value is CustomerAvatarKey {
  return CUSTOMER_AVATARS.some((avatar) => avatar.key === value)
}

export function getCustomerAvatar(key?: string | null) {
  return CUSTOMER_AVATARS.find((avatar) => avatar.key === key) ?? CUSTOMER_AVATARS[0]
}

export function getCustomerAvatarImageSrc(key?: string | null) {
  return `/api/avatar/${getCustomerAvatar(key).key}`
}
