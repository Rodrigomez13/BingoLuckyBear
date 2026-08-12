import { SiteHeader } from '@/components/truco/site-header'
import { Hero } from '@/components/truco/hero'
import { WhyPlay } from '@/components/truco/why-play'
import { HowToPlay } from '@/components/truco/how-to-play'
import { PlayAnywhere } from '@/components/truco/play-anywhere'
import { SiteFooter } from '@/components/truco/site-footer'

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <WhyPlay />
        <HowToPlay />
        <PlayAnywhere />
      </main>
      <SiteFooter />
    </div>
  )
}
