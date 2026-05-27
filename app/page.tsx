import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BearLogo } from '@/components/bear-logo'
import { HeroSection } from '@/components/home/hero-section'
import { HowItWorks } from '@/components/home/how-it-works'
import { Features } from '@/components/home/features'
import { Footer } from '@/components/home/footer'
import { LiveDrawCard } from '@/components/live/live-draw-card'
import { SponsorShowcase } from '@/components/home/sponsor-showcase'
import { TrustSection } from '@/components/home/trust-section'

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_34rem),linear-gradient(135deg,#09090b,#18181b_45%,#111827)] text-zinc-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-amber-400/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <BearLogo size={50} />
              <span className="hidden font-bold text-xl text-white sm:inline" style={{ fontFamily: 'var(--font-fredoka)' }}>
                Lucky Bingo Bear
              </span>
            </div>
            <nav className="flex shrink-0 items-center gap-3 sm:gap-4">
              <Link 
                href="/participar" 
                className="text-amber-200 hover:text-white font-medium transition-colors"
              >
                Participar
              </Link>
              <Link 
                href="/en-vivo" 
                className="hidden text-amber-200 hover:text-white font-medium transition-colors sm:inline"
              >
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
        <LiveDrawCard />
        <SponsorShowcase />
        <TrustSection />
        <HowItWorks />
        <Features />
        <Footer />
      </div>
    </main>
  )
}
