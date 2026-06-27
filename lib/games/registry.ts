export type PlatformGameId = 'bingo' | 'truco' | 'golden_bear' | 'viborita' | 'future_games'

export type PlatformGameCategory = 'sorteos' | 'cartas' | 'slots' | 'arcade' | 'roadmap'
export type PlatformGameReleaseStage = 'live' | 'preview' | 'roadmap' | 'disabled'
export type PlatformGameWalletMode = 'general_balance' | 'progress_only' | 'none'

export type PlatformGame = {
  id: PlatformGameId
  slug: string
  name: string
  shortName: string
  subtitle: string
  description: string
  href: string
  adminHref?: string
  cta: string
  statusLabel: string
  logo: string
  visualAsset: string
  category: PlatformGameCategory
  releaseStage: PlatformGameReleaseStage
  walletMode: PlatformGameWalletMode
  featured: boolean
  sortOrder: number
  accent: string
  sound: string
  roadmapNote?: string
}

export const PLATFORM_GAMES: PlatformGame[] = [
  {
    id: 'bingo',
    slug: 'bingo',
    name: 'Bingo LBB',
    shortName: 'Bingo',
    subtitle: 'Sorteos y cartones',
    description: 'Cartones digitales, sorteos programados y premios conectados al saldo general LBB.',
    href: '/participar',
    adminHref: '/admin',
    cta: 'Comprar cartón',
    statusLabel: 'Disponible',
    logo: 'B',
    visualAsset: LBB_GAME_THUMBNAILS.bingo,
    category: 'sorteos',
    releaseStage: 'live',
    walletMode: 'general_balance',
    featured: true,
    sortOrder: 10,
    accent: 'from-emerald-400/18 via-amber-300/10 to-black/30',
    sound: 'bingo.purchase',
  },
  {
    id: 'truco',
    slug: 'truco',
    name: 'Truco',
    shortName: 'Truco',
    subtitle: 'Mesas online',
    description: 'Partidas contra el oso, salas públicas, ranking competitivo y apuestas laterales.',
    href: '/truco',
    adminHref: '/admin/games',
    cta: 'Ver mesas',
    statusLabel: 'Mesas activas',
    logo: 'T',
    visualAsset: LBB_GAME_THUMBNAILS.truco,
    category: 'cartas',
    releaseStage: 'live',
    walletMode: 'general_balance',
    featured: true,
    sortOrder: 20,
    accent: 'from-sky-400/18 via-emerald-300/12 to-black/30',
    sound: 'truco.play',
  },
  {
    id: 'golden_bear',
    slug: 'golden-bear',
    name: 'Golden Bear',
    shortName: 'Golden Bear',
    subtitle: 'Slot LBB Original',
    description: 'Giros, cascadas, bonus y premios acreditados desde una ronda validada por servidor.',
    href: '/juegos/golden-bear',
    adminHref: '/admin/games/golden-bear',
    cta: 'Entrar al slot',
    statusLabel: 'LBB Original',
    logo: 'GB',
    visualAsset: LBB_GAME_THUMBNAILS.goldenBear,
    category: 'slots',
    releaseStage: 'preview',
    walletMode: 'general_balance',
    featured: true,
    sortOrder: 30,
    accent: 'from-amber-300/26 via-orange-500/16 to-black/30',
    sound: 'slot.spin',
  },
  {
    id: 'viborita',
    slug: 'viborita',
    name: 'Viborita LBB',
    shortName: 'Viborita',
    subtitle: 'Arcade LBB',
    description: 'Juego propio de reflejos, preparado para desafíos, niveles, ranking y misiones.',
    href: '/juegos/viborita',
    adminHref: '/admin/games',
    cta: 'Jugar',
    statusLabel: 'Nuevo',
    logo: 'S',
    visualAsset: LBB_GAME_THUMBNAILS.viborita,
    category: 'arcade',
    releaseStage: 'preview',
    walletMode: 'progress_only',
    featured: false,
    sortOrder: 40,
    accent: 'from-lime-400/18 via-emerald-300/10 to-black/30',
    sound: 'ui.click',
  },
  {
    id: 'future_games',
    slug: 'proximos-juegos',
    name: 'Próximos juegos',
    shortName: 'Roadmap',
    subtitle: 'Nuevas experiencias',
    description: 'Base preparada para sumar ruleta, cartas, torneos, jackpots y misiones cruzadas.',
    href: '/juegos',
    adminHref: '/admin/games',
    cta: 'Ver plataforma',
    statusLabel: 'En preparación',
    logo: 'LBB',
    visualAsset: LBB_GAME_THUMBNAILS.empty,
    category: 'roadmap',
    releaseStage: 'roadmap',
    walletMode: 'none',
    featured: false,
    sortOrder: 50,
    accent: 'from-fuchsia-400/16 via-violet-400/10 to-black/30',
    sound: 'ui.click',
    roadmapNote: 'Activar desde el registro de juegos cuando el motor y la economía estén listos.',
  },
]

export const ACTIVE_PLATFORM_GAMES = PLATFORM_GAMES
  .filter((game) => game.releaseStage !== 'roadmap')
  .sort((left, right) => left.sortOrder - right.sortOrder)

export const LOBBY_PLATFORM_GAMES = [...PLATFORM_GAMES]
  .sort((left, right) => left.sortOrder - right.sortOrder)

export function getPlatformGame(id: PlatformGameId) {
  return PLATFORM_GAMES.find((game) => game.id === id) ?? null
}

export function walletModeLabel(mode: PlatformGameWalletMode) {
  if (mode === 'general_balance') return 'Saldo LBB'
  if (mode === 'progress_only') return 'Progreso LBB'
  return 'Sin economía'
}
import { LBB_GAME_THUMBNAILS } from '@/lib/brand/assets'
