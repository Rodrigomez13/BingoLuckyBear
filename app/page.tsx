import { HeroSection } from '@/components/home/hero-section'
import { HowItWorks } from '@/components/home/how-it-works'
import { Footer } from '@/components/home/footer'
import { SponsorShowcase } from '@/components/home/sponsor-showcase'
import { TrustSection } from '@/components/home/trust-section'
import { BrandMarquee } from '@/components/home/brand-marquee'
import { SiteHeader } from '@/components/site-header'
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
      <SiteHeader jackpotPrize={jackpotPrize} activePath="home" />

      {/* Main Content */}
      <div className="relative z-10 pt-[84px]">
        <HeroSection
          raffleName={activeRaffle?.name}
          firstPrize={jackpotPrize}
          hasActiveRaffle={hasActiveRaffle}
          nextDrawDate={nextDrawDate}
        />
        <BrandMarquee />
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
