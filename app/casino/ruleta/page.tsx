import { redirect } from 'next/navigation'
import { RouletteGame } from '@/components/casino/roulette-game'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ensurePlayerAccount, getWalletSnapshot } from '@/lib/wallet/server'

export default async function CasinoRoulettePage() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/auth/login?next=/casino/ruleta')
  const serviceClient = await createServiceClient()
  await ensurePlayerAccount(serviceClient, user)
  const wallet = await getWalletSnapshot(serviceClient, user.id)
  return <main className="min-h-screen bg-zinc-950 px-4 py-8 sm:px-8"><RouletteGame initialBalance={Number(wallet.general_balance)} /></main>
}
