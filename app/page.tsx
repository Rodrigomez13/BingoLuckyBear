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
import { getPrizeAmounts, getPrizeSchedule } from '@/lib/bingo'
import { syncRaffleLifecycle } from '@/lib/raffle-lifecycle'

export const dynamic = 'force-dynamic'

async function getActiveRafflePromo() {
  try {
    const supabase = await createServiceClient()
    const { data } = await supabase
      .from('raffles')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data) {
      return null
    }

    const raffle = await syncRaffleLifecycle(supabase, data)

    if (!raffle.is_active && raffle.draw_status === 'finished') {
      return null
    }

    return raffle
  } catch (error) {
    console.error('Error fetching active raffle promo:', error)
    return null
  }
}

export default async function HomePage() {
  const activeRaffle = await getActiveRafflePromo()
  const prizeAmounts = getPrizeAmounts(activeRaffle?.prize, activeRaffle?.additional_prizes)
  const prizeSchedule = getPrizeSchedule(prizeAmounts)
  const jackpotPrize = prizeSchedule.find((target) => target.prizeNumber === 4)?.amount

  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-slate-50">
      <div className="lbb-ambient" />
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#101010]/92 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[60px] items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <BearLogo size={46} />
              <div className="hidden sm:block">
                <span className="font-mono text-lg font-bold tracking-normal text-white">
                  Lucky Bingo Bear
                </span>
                <p className="-mt-0.5 text-[10px] font-medium uppercase tracking-wide text-[#04f77c]">Bingo digital en vivo</p>
              </div>
            </div>
            <nav className="flex shrink-0 items-center gap-3 text-sm sm:gap-4">
              {jackpotPrize && (
                <span className="hidden h-8 items-center gap-2 rounded border border-[#04f77c]/45 bg-[#04f77c] px-3 text-xs font-bold uppercase tracking-wide text-zinc-950 lg:inline-flex">
                  <Trophy className="h-4 w-4" />
                  {jackpotPrize}
                </span>
              )}
              <Link 
                href="/en-vivo" 
                className="hidden items-center gap-1 text-slate-200 transition-colors duration-200 hover:text-[#04f77c] sm:inline-flex"
              >
                <Radio className="h-4 w-4" />
                En Vivo
              </Link>
              <Link 
                href="/ganadores" 
                className="hidden text-slate-200 transition-colors duration-200 hover:text-[#04f77c] md:inline"
              >
                Ganadores
              </Link>
              <Button asChild variant="outline" className="hidden h-8 rounded border-[#04f77c]/35 bg-transparent px-3 text-sm font-bold text-[#04f77c] hover:bg-[#04f77c] hover:text-zinc-950 sm:inline-flex">
                <Link href="/auth/login">Admin</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 pt-[60px]">
        <HeroSection raffleName={activeRaffle?.name} firstPrize={jackpotPrize} />
        <HowItWorks />
        <SponsorShowcase
          activeAmount={activeRaffle?.amount ?? null}
          drawDate={activeRaffle?.draw_date ?? null}
          prizeSchedule={prizeSchedule}
        />
        <TrustSection />
        <Footer />
      </div>
    </main>
  )
}
