export type CasinoDemoGame = {
  symbol: string
  name: string
  engine: string
  kind: 'slot' | 'table' | 'crash' | 'other'
}

// Visible immediately; a running Maldivas demo server expands this list using /api/games.
export const CASINO_DEMO_FALLBACK: CasinoDemoGame[] = [
  ['skywind_8_tigers_gold_megaways', '8 Tigers Gold Megaways', 'skywind', 'slot'],
  ['skywind_alive_megaways', 'Alive Megaways', 'skywind', 'slot'],
  ['skywind_big_buffalo_megaways', 'Big Buffalo Megaways', 'skywind', 'slot'],
  ['skywind_book_of_gems_megaways', 'Book Of Gems Megaways', 'skywind', 'slot'],
  ['skywind_si_ling_megaways', 'Si Ling Megaways', 'skywind', 'slot'],
  ['skywind_sticky_sevens_megaways', 'Sticky Sevens Megaways', 'skywind', 'slot'],
  ['rubyplay_bull_fever', 'Bull Fever', 'xgames-rubyplay', 'slot'],
  ['rubyplay_dawn_of_the_incas', 'Dawn Of The Incas', 'xgames-rubyplay', 'slot'],
  ['vegas_burning_diamonds', 'Burning Diamonds', 'xgames-vegas', 'slot'],
  ['vegas_burning_hot_7', 'Burning Hot 7', 'xgames-vegas', 'slot'],
  ['aristocrat_autumn_moon', 'Autumn Moon', 'xgames-aristocrat', 'slot'],
  ['aristocrat_dragons_riches', 'Dragons Riches', 'xgames-aristocrat', 'slot'],
  ['amaticrouletteroyal', 'Roulette Royal', 'amatic-slg', 'table'],
  ['amaticjokercardpoker', 'Joker Card Poker', 'amatic-slg', 'table'],
  ['skywind_roulette', 'Roulette', 'skywind', 'table'],
].map(([symbol, name, engine, kind]) => ({ symbol, name, engine, kind: kind as CasinoDemoGame['kind'] }))

export function getCasinoDemoOrigin() {
  return process.env.CASINO_DEMO_ORIGIN?.replace(/\/$/, '') ?? null
}
