import Link from 'next/link'
import { Radio, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BearLogo } from '@/components/bear-logo'
import { HeroSection } from '@/components/home/hero-section'
import { HowItWorks } from '@/components/home/how-it-works'
import { Footer } from '@/components/home/footer'
import { SponsorShowcase } from '@/components/home/sponsor-showcase'
import { TrustSection } from '@/components/home/trust-section'
import { createServiceClient } from '@/lib/supabase/server'
import { getPrizeAmounts } from '@/lib/bingo'

export const dynamic = 'force-dynamic'

async function getActiveRafflePromo() {
  try {
    const supabase = await createServiceClient()
    const { data } = await supabase
      .from('raffles')
      .select('name, prize, additional_prizes')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return data
  } catch (error) {
    console.error('Error fetching active raffle promo:', error)
    return null
  }
}

export default async function HomePage() {
  const activeRaffle = await getActiveRafflePromo()
  const firstPrize = getPrizeAmounts(activeRaffle?.prize, activeRaffle?.additional_prizes)[0]

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#08090d,#15111a_42%,#0d1720_78%,#09090b)] text-zinc-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-zinc-950/78 shadow-lg shadow-black/20 backdrop-blur-xl">
        <div className="mx-auto w-screen max-w-full px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex min-w-0 items-center gap-3">
              <BearLogo size={50} />
              <div className="hidden sm:block">
                <span className="font-bold text-xl text-white" style={{ fontFamily: 'var(--font-fredoka)' }}>
                  Lucky Bingo Bear
                </span>
                <p className="-mt-1 text-[11px] font-bold uppercase text-amber-200/80">Bingo digital en vivo</p>
              </div>
            </div>
            <nav className="flex shrink-0 items-center gap-3 text-sm sm:gap-4 sm:text-base">
              {firstPrize && (
                <span className="hidden items-center gap-2 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-black uppercase text-emerald-200 lg:inline-flex">
                  <Trophy className="h-4 w-4" />
                  {firstPrize}
                </span>
              )}
              <Link 
                href="/en-vivo" 
                className="hidden items-center gap-1 text-amber-200 hover:text-white font-bold transition-colors sm:inline-flex"
              >
                <Radio className="h-4 w-4" />
                En Vivo
              </Link>
              <Link 
                href="/ganadores" 
                className="hidden text-amber-200 hover:text-white font-medium transition-colors md:inline"
              >
                Ganadores
              </Link>
              <Button asChild variant="outline" className="hidden border-amber-400/40 bg-transparent text-amber-200 hover:bg-amber-400/10 sm:inline-flex">
                <Link href="/auth/login">Admin</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-16">
        <HeroSection />
        <HowItWorks />
        <TrustSection />
        <SponsorShowcase />
        <Footer />
      </div>
    </main>
  )
}
