export interface PlayerStatsInput {
  matches_played?: number | null
  matches_won?: number | null
  matches_lost?: number | null
  ranking_points?: number | null
  bonus_points_won?: number | null
  bonus_points_spent?: number | null
}

export interface TrucoMatchInput {
  winner_user_id: string | null
  finished_at: string
}

export interface PlayerLevel {
  level: number
  title: string
  xp: number
  xpIntoLevel: number
  xpForLevel: number
  progress: number
}

export interface PlayerBadge {
  key: string
  label: string
  description: string
  unlocked: boolean
}

const LEVEL_TITLES = [
  'Novato',
  'Aprendiz',
  'Jugador',
  'Competidor',
  'Veterano',
  'Estratega',
  'Maestro',
  'Leyenda',
]

// XP grows linearly per level: level n requires 100 * n XP to advance.
export function computeLevel(xp: number): PlayerLevel {
  let level = 1
  let remaining = Math.max(0, Math.floor(xp))
  let xpForLevel = 100

  while (remaining >= xpForLevel) {
    remaining -= xpForLevel
    level += 1
    xpForLevel = 100 * level
  }

  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]
  const progress = xpForLevel === 0 ? 0 : Math.min(100, Math.round((remaining / xpForLevel) * 100))

  return {
    level,
    title,
    xp: Math.max(0, Math.floor(xp)),
    xpIntoLevel: remaining,
    xpForLevel,
    progress,
  }
}

export function computeXp(stats: PlayerStatsInput): number {
  const played = stats.matches_played ?? 0
  const won = stats.matches_won ?? 0
  const bonusWon = stats.bonus_points_won ?? 0
  return played * 10 + won * 25 + Math.floor(bonusWon / 5)
}

// Counts consecutive wins starting from the most recent finished match.
export function computeWinStreak(matches: TrucoMatchInput[], userId: string | null): number {
  if (!userId) return 0
  const sorted = [...matches].sort(
    (a, b) => new Date(b.finished_at).getTime() - new Date(a.finished_at).getTime(),
  )
  let streak = 0
  for (const match of sorted) {
    if (match.winner_user_id === userId) {
      streak += 1
    } else {
      break
    }
  }
  return streak
}

export function computeBadges(stats: PlayerStatsInput, streak: number): PlayerBadge[] {
  const played = stats.matches_played ?? 0
  const won = stats.matches_won ?? 0
  const ranking = stats.ranking_points ?? 1000

  return [
    {
      key: 'first_match',
      label: 'Primer mano',
      description: 'Jugaste tu primera partida de Truco.',
      unlocked: played >= 1,
    },
    {
      key: 'first_win',
      label: 'Primera victoria',
      description: 'Ganaste tu primera partida.',
      unlocked: won >= 1,
    },
    {
      key: 'regular',
      label: 'Habitue',
      description: 'Jugaste 10 partidas o mas.',
      unlocked: played >= 10,
    },
    {
      key: 'streak3',
      label: 'En racha',
      description: 'Ganaste 3 partidas seguidas.',
      unlocked: streak >= 3,
    },
    {
      key: 'winner10',
      label: 'Ganador serial',
      description: 'Acumulaste 10 victorias.',
      unlocked: won >= 10,
    },
    {
      key: 'ranked_pro',
      label: 'Top ranking',
      description: 'Superaste los 1100 puntos de ranking.',
      unlocked: ranking >= 1100,
    },
  ]
}
