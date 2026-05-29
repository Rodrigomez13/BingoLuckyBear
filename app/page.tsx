import { SiteHeader } from '@/components/site-header'
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
      .select('name, prize, additional_prizes, amount, draw_date, draw_status, bundle_offers')
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
      <SiteHeader firstPrize={firstPrize} />

      {/* Main Content */}
      <div className="pt-16">
        <HeroSection
          raffle={
            activeRaffle
              ? {
                  name: activeRaffle.name,
                  prize: activeRaffle.prize ?? null,
                  additional_prizes: activeRaffle.additional_prizes ?? null,
                  amount: activeRaffle.amount ?? null,
                  draw_date: activeRaffle.draw_date ?? null,
                  draw_status: activeRaffle.draw_status ?? null,
                  bundle_offers: activeRaffle.bundle_offers ?? null,
                }
              : null
          }
        />
        <HowItWorks />
        <TrustSection />
        <SponsorShowcase />
        <Footer />
      </div>
    </main>
  )
}
