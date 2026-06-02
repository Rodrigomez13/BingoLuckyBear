import Link from 'next/link'
import { Radio, Trophy } from 'lucide-react'
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

async function getHomeRaffleContext() {
  try {
    const supabase = await createServiceClient()
    const { data: activeData } = await supabase
      .from('raffles')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: nextData } = await supabase
      .from('raffles')
      .select('*')
      .or('draw_status.is.null,draw_status.neq.finished')
      .not('draw_date', 'is', null)
      .gte('draw_date', new Date().toISOString())
      .order('draw_date', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!activeData) {
      return { activeRaffle: null, nextRaffle: nextData ?? null }
    }

    const raffle = await syncRaffleLifecycle(supabase, activeData)

    if (!raffle.is_active && raffle.draw_status === 'finished') {
      return { activeRaffle: null, nextRaffle: nextData ?? null }
    }

    return { activeRaffle: raffle, nextRaffle: nextData ?? null }
  } catch (error) {
    console.error('Error fetching active raffle promo:', error)
    return { activeRaffle: null, nextRaffle: null }
  }
}

export default async function HomePage() {
  const { activeRaffle, nextRaffle } = await getHomeRaffleContext()
  const hasActiveRaffle = Boolean(activeRaffle)
  const nextDrawDate = activeRaffle?.draw_date ?? nextRaffle?.draw_date ?? null
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
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 pt-[60px]">
        <HeroSection
          raffleName={activeRaffle?.name}
          firstPrize={jackpotPrize}
          hasActiveRaffle={hasActiveRaffle}
          nextDrawDate={nextDrawDate}
        />
        <HowItWorks />
        <SponsorShowcase
          activeAmount={activeRaffle?.amount ?? null}
          drawDate={nextDrawDate}
          prizeSchedule={prizeSchedule}
          hasActiveRaffle={hasActiveRaffle}
          nextRaffleName={nextRaffle?.name ?? null}
        />
        <TrustSection />
        <Footer />
      </div>
    </main>
  )
}
