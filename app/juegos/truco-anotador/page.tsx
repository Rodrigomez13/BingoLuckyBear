import type { Metadata } from 'next'
import { GameHeaderCompact, GameShell, GameViewport } from '@/components/games/game-shell'

export const metadata: Metadata = {
  title: 'Anotador de Truco | LuckyBingoBear',
  description: 'Mesa visual y anotador de Truco argentino dentro de LuckyBingoBear.',
}

export default function TrucoScorekeeperPage() {
  return (
    <GameShell>
      <GameHeaderCompact
        gameName="Anotador de Truco"
        exitHref="/juegos"
      />
      <GameViewport
        aspectRatio="16 / 10"
        mobileAspectRatio="9 / 16"
        maxHeight="calc(100svh - clamp(6.5rem, 12svh, 8.75rem))"
        frameClassName="bg-black/70"
      >
        <iframe
          title="Anotador de Truco"
          src="/games/truco-anotador/index.html?embed=1&v=20260711-lbb"
          className="h-full min-h-0 w-full border-0"
          allow="autoplay; fullscreen"
        />
      </GameViewport>
    </GameShell>
  )
}
