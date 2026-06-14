'use client'

import { useMemo } from 'react'
import { Award, Flame, Lock, Sparkles, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  computeBadges,
  computeLevel,
  computeWinStreak,
  computeXp,
  type PlayerStatsInput,
  type TrucoMatchInput,
} from '@/lib/customer/gamification'

interface PlayerGamificationProps {
  userId: string | null
  stats: PlayerStatsInput | null | undefined
  matches: TrucoMatchInput[]
}

export function PlayerGamification({ userId, stats, matches }: PlayerGamificationProps) {
  const { level, badges, streak } = useMemo(() => {
    const safeStats = stats ?? {}
    const xp = computeXp(safeStats)
    const winStreak = computeWinStreak(matches, userId)
    return {
      level: computeLevel(xp),
      streak: winStreak,
      badges: computeBadges(safeStats, winStreak),
    }
  }, [stats, matches, userId])

  const unlockedCount = badges.filter((badge) => badge.unlocked).length

  return (
    <Card className="border-white/10 bg-zinc-950/85 text-zinc-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Sparkles className="h-5 w-5 text-amber-300" />
          Tu progreso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-300 font-mono text-lg font-black text-zinc-950">
                  {level.level}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-200">Nivel {level.level}</p>
                  <p className="font-bold text-white">{level.title}</p>
                </div>
              </div>
              <Star className="h-5 w-5 text-amber-300" />
            </div>
            <div className="mt-4">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/50">
                <div
                  className="h-full rounded-full bg-amber-300 transition-all"
                  style={{ width: `${level.progress}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-zinc-400">
                {level.xpIntoLevel}/{level.xpForLevel} XP para el nivel {level.level + 1}
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-[#04f77c]/20 bg-[#04f77c]/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-[#04f77c]">Racha de victorias</p>
              <Flame className={`h-5 w-5 ${streak > 0 ? 'animate-pulse text-[#04f77c]' : 'text-zinc-600'}`} />
            </div>
            <div className="mt-2">
              <p className="font-mono text-4xl font-black leading-none text-white">{streak}</p>
              <p className="mt-1 text-[11px] text-zinc-400">
                {streak === 0
                  ? 'Gana una partida para iniciar tu racha.'
                  : streak === 1
                    ? 'victoria seguida. Segui asi.'
                    : 'victorias seguidas. Imparable.'}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-bold text-white">
              <Award className="h-4 w-4 text-amber-300" />
              Insignias
            </p>
            <span className="text-xs font-semibold text-zinc-400">
              {unlockedCount}/{badges.length} desbloqueadas
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {badges.map((badge) => (
              <div
                key={badge.key}
                title={badge.description}
                className={`rounded-2xl border p-3 text-center transition ${
                  badge.unlocked
                    ? 'border-amber-300/30 bg-amber-300/10'
                    : 'border-white/10 bg-black/30 opacity-60'
                }`}
              >
                <span
                  className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl ${
                    badge.unlocked ? 'bg-amber-300 text-zinc-950' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {badge.unlocked ? <Award className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                </span>
                <p className="mt-2 text-[11px] font-bold leading-tight text-white">{badge.label}</p>
                <p className="mt-0.5 text-[10px] leading-tight text-zinc-400">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
