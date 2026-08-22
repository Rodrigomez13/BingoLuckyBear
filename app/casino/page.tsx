import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCasinoCatalog } from '@/lib/casino/catalog'
import { CasinoDemoCatalog } from '@/components/casino/demo-catalog'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Casino | Lucky Bingo Bear' }

export default async function CasinoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/casino')
  const catalog = getCasinoCatalog()
  return <main className="min-h-screen bg-zinc-950 px-5 py-12 text-white"><div className="mx-auto max-w-5xl"><p className="font-semibold uppercase tracking-[0.25em] text-amber-300">Lucky Bingo Bear</p><h1 className="mt-2 text-4xl font-black">Casino</h1><p className="mt-3 max-w-2xl text-zinc-300">Demos externos aislados y juegos LBB conectados a tu cuenta.</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{catalog.map((game) => <Link key={game.id} href="/casino/ruleta" className="rounded-2xl border border-amber-300/25 bg-zinc-900 p-6 transition hover:border-amber-300"><p className="text-sm text-amber-300">{game.provider} · {game.kind}</p><h2 className="mt-1 text-2xl font-bold">{game.displayName}</h2><p className="mt-3 text-sm text-zinc-400">Juego LBB con liquidación atómica en la wallet.</p></Link>)}</div><CasinoDemoCatalog /></div></main>
}
