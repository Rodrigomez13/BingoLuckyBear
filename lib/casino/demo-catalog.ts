export type CasinoDemoGame = {
  symbol: string
  name: string
  engine: string
  kind: 'slot' | 'table' | 'crash' | 'other'
}

// Visible immediately; a running Maldivas demo server expands this list using /api/games.
export const CASINO_DEMO_FALLBACK: CasinoDemoGame[] = [
  ['vs20sugarrush', 'Sugar Rush', 'vs-cluster-tumble', 'slot'],
  ['vs25wolfgold', 'Wolf Gold', 'vs-lines', 'slot'],
  ['vs20olympgate', 'Gates of Olympus', 'vs-cluster-tumble', 'slot'],
  ['vs20fruitsw', 'Sweet Bonanza', 'vs-cluster-tumble', 'slot'],
  ['vs243lions', '5 Lions', 'vs-lines', 'slot'],
  ['vs10bbbonanza', 'Big Bass Bonanza', 'vs-lines', 'slot'],
  ['vswaysbufking', 'Buffalo King Megaways', 'vs-ways', 'slot'],
  ['vswaysrhino', 'Great Rhino Megaways', 'vs-ways', 'slot'],
  ['vs25scarabqueen', 'John Hunter Scarab Queen', 'vs-lines', 'slot'],
  ['vswaysmadame', 'Madame Destiny Megaways', 'vs-ways', 'slot'],
  ['vs20starlight', 'Starlight Princess', 'vs-cluster-tumble', 'slot'],
  ['vs20sbxmas', 'Sweet Bonanza Xmas', 'vs-cluster-tumble', 'slot'],
  ['vs20doghouse', 'The Dog House', 'vs-lines', 'slot'],
  ['vs25chilli', 'Chilli Heat', 'vs-lines', 'slot'],
  ['vs20rhino', 'Great Rhino', 'vs-lines', 'slot'],
  ['vs5joker', "Joker's Jewels", 'vs-lines', 'slot'],
  ['amaticrouletteroyal', 'Roulette Royal', 'amatic-slg', 'table'],
  ['amaticjokercardpoker', 'Joker Card Poker', 'amatic-slg', 'table'],
  ['vsspribeaviator', 'Aviator', 'spribe-rng', 'crash'],
].map(([symbol, name, engine, kind]) => ({ symbol, name, engine, kind: kind as CasinoDemoGame['kind'] }))

export function getCasinoDemoOrigin() {
  return process.env.CASINO_DEMO_ORIGIN?.replace(/\/$/, '') ?? null
}
