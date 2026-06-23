export const SYMBOLS = [
  { key: 'BEAR', name: 'Oso rey LBB', type: 'bear', lbb: [0, 0], weight: 6, color: '#f3b735', pay: { 3: 3.5, 4: 9, 5: 25, 6: 80 } },
  { key: 'FOX', name: 'Zorro de la suerte', type: 'fox', atlas: 1, weight: 8, color: '#cf6d24', pay: { 3: 2.7, 4: 7, 5: 18, 6: 55 } },
  { key: 'EAGLE', name: 'Águila real', type: 'eagle', atlas: 2, weight: 9, color: '#5fa9ff', pay: { 3: 2.2, 4: 5.5, 5: 14, 6: 42 } },
  { key: 'HORSE', name: 'Caballo blanco', type: 'horse', atlas: 3, weight: 11, color: '#58dc86', pay: { 3: 1.7, 4: 4, 5: 10, 6: 28 } },
  { key: 'HONEY', name: 'Miel real', type: 'honey', atlas: 4, weight: 12, color: '#ffd45d', pay: { 3: 1.3, 4: 3.2, 5: 8, 6: 20 } },
  { key: 'A', name: 'A', type: 'letter', label: 'A', weight: 15, color: '#ff382f', pay: { 3: 0.8, 4: 1.8, 5: 4, 6: 10 } },
  { key: 'K', name: 'K', type: 'letter', label: 'K', weight: 16, color: '#2378ff', pay: { 3: 0.7, 4: 1.5, 5: 3.5, 6: 8 } },
  { key: 'Q', name: 'Q', type: 'letter', label: 'Q', weight: 17, color: '#39df61', pay: { 3: 0.6, 4: 1.2, 5: 3, 6: 7 } },
  { key: 'J', name: 'J', type: 'letter', label: 'J', weight: 18, color: '#ff991c', pay: { 3: 0.5, 4: 1, 5: 2.5, 6: 6 } },
  { key: 'WILD', name: 'WILD real', type: 'wild', lbb: [1, 1], weight: 4, color: '#ffe98b', wild: true },
  { key: 'BONUS', name: 'BONUS Bingo', type: 'bonus', lbb: [4, 0], lbbSet: 1, weight: 3, color: '#45f2a7', bonus: true },
]

export const REELS = 6
export const MIN_ROWS = 2
export const MAX_ROWS = 7
export const BETS = [25, 50, 100, 200, 500, 1000]
export const INITIAL_CREDITS = 10000
export const MAX_CASCADES = 8
export const RETRIGGER_SPINS = 5
export const STORAGE_KEY = 'lbb-golden-bear'

export const SOUND_FILES = {
  click: 'ui_click', spin: 'spin_start', blur: 'reel_blur', button: 'button_spin', turbo: 'turbo_toggle',
  reelStop: ['reel_stop_1', 'reel_stop_2', 'reel_stop_3', 'reel_stop_4', 'reel_stop_5', 'reel_stop_6'],
  explode: 'symbol_pop', drop: 'cascade_fall', land: 'cascade_land', cascade: 'line_pay', multiplier: 'multiplier_up',
  lose: 'lose', small: 'win_small', medium: 'win_medium', big: 'big_win', coins: 'coin_shower', bonus: 'bonus_trigger',
  free: 'free_spin_start', detail: 'pay_detail_open', history: 'history_tick', modal: 'modal_open',
}
