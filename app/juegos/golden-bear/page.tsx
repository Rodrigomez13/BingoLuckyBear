import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Golden Bear Lucky Ways | Lucky Bingo Bear',
  description: 'Golden Bear Lucky Ways, una experiencia exclusiva de Lucky Bingo Bear.',
}

export default async function GoldenBearPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/juegos/golden-bear')

  return (
    <div className="min-h-screen overflow-hidden bg-[#050805] text-white">
      <SiteHeader activePath="golden-bear" kicker="Juegos LBB" compact />
      <main className="mx-auto flex min-h-screen w-full max-w-[1540px] flex-col px-1 pb-1 pt-[4.75rem] sm:px-4 sm:pt-24">
        <section className="relative flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-amber-300/20 bg-black/55 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <iframe
            title="Golden Bear Lucky Ways"
            src="/games/golden-bear/index.html?embed=1"
            className="h-[calc(100svh-5rem)] min-h-0 w-full border-0 sm:h-[calc(100svh-6.5rem)]"
            allow="autoplay; fullscreen"
          />
        </section>
      </main>
    </div>
  )
}
