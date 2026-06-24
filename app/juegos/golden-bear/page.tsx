import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
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
    <main className="fixed inset-0 z-[100] bg-black">
      <iframe
        title="Golden Bear Lucky Ways"
        src="/games/golden-bear/index.html"
        className="h-full w-full border-0"
        allow="autoplay; fullscreen"
      />
    </main>
  )
}
