import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { GameHeaderCompact, GameShell, GameViewport, OrientationHint } from '@/components/games/game-shell'
import { formatAccountBalance } from '@/lib/economy/format'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Golden Bear Lucky Ways | Lucky Bingo Bear',
  description: 'Golden Bear Lucky Ways, una experiencia exclusiva de Lucky Bingo Bear.',
}

export default async function GoldenBearPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/juegos/golden-bear')

  const serviceClient = await createServiceClient()
  const { data: wallet } = await serviceClient
    .from('lbb_wallets')
    .select('general_balance')
    .eq('user_id', user.id)
    .maybeSingle()
  const balanceLabel = wallet ? formatAccountBalance(Number(wallet.general_balance ?? 0)) : null

  return (
    <GameShell>
      <GameHeaderCompact
        gameName="Golden Bear Lucky Ways"
        balanceLabel={balanceLabel}
        exitHref="/juegos"
      />
      <OrientationHint />
      <GameViewport
        aspectRatio="16 / 9"
        maxHeight="calc(100svh - clamp(6rem, 11svh, 8.25rem))"
        frameClassName="bg-black/70"
      >
        <iframe
          title="Golden Bear Lucky Ways"
          src="/games/golden-bear/index.html?embed=1&viewport=fluid&v=20260627-slot-fit"
          className="h-full min-h-0 w-full border-0"
          allow="autoplay; fullscreen"
        />
      </GameViewport>
    </GameShell>
  )
}
