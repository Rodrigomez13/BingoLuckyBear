export type CasinoDemoGame = {
  symbol: string
  name: string
  engine: string
  kind: 'slot' | 'table' | 'crash' | 'other'
  thumbnail?: string
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

// Artwork located from provider and game-catalog pages. It is proxied by LBB so
// the lobby does not depend on each third-party domain at render time.
export const CASINO_DEMO_THUMBNAIL_SOURCES: Record<string, string> = {
  skywind_8_tigers_gold_megaways: 'https://cdn.sanity.io/images/usfaerfs/production/f5a5a748fbb0edfd440bae6a4b2c8a7b37484545-428x550.jpg',
  skywind_alive_megaways: 'https://cdn.sanity.io/images/usfaerfs/production/866b85f44db431595e730bea5ec9cbd1f7f4b166-428x550.jpg',
  skywind_big_buffalo_megaways: 'https://skywindgroup.com/cdn/0eea952d0c2ffd4d92e42d6e45923fc85907ea6e.png',
  skywind_book_of_gems_megaways: 'https://cdn.sanity.io/images/usfaerfs/production/0d5a9883a4a30ce02ac386334a4ea2c854e783c1-1920x990.png',
  skywind_si_ling_megaways: 'https://www.gamingsoft.com/Content/v2/images/new-provider/the-dragon-dozer-game-from-skywind-Gaming-slots-games.jpeg',
  skywind_sticky_sevens_megaways: 'https://cdn.skywindgroup.com/cdn/sizes/17/e8/17e88deb16873987c24750d17138be61ab054979/image.webp',
  rubyplay_bull_fever: 'https://storage.googleapis.com/www.spinblitz.com/tiles/rp_49/source.png',
  rubyplay_dawn_of_the_incas: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1000&q=82',
  vegas_burning_diamonds: 'https://www.slotstemple.com/img/game_tiles/burning-diamonds.jpg',
  vegas_burning_hot_7: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1000&q=82',
  aristocrat_autumn_moon: 'https://i.ytimg.com/vi/YDEY30OkUDU/maxresdefault.jpg',
  aristocrat_dragons_riches: 'https://cdn.sanity.io/images/usfaerfs/production/93789a73637ce0f182d6cd0342bd09da78d9521f-1920x1080.jpg',
  amaticrouletteroyal: 'https://st.softgamings.com/uploads/roulette.png',
  amaticjokercardpoker: 'https://images.unsplash.com/photo-1741630722345-d098b383fedc?fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
  skywind_roulette: 'https://slotvockice.rs/wp-content/uploads/2020/09/Roulette-Royal-Amatic.jpg',
}

export function getCasinoDemoThumbnail(symbol: string) {
  return CASINO_DEMO_THUMBNAIL_SOURCES[symbol] ?? null
}

export function getCasinoDemoOrigin() {
  return process.env.CASINO_DEMO_ORIGIN?.replace(/\/$/, '') ?? null
}
