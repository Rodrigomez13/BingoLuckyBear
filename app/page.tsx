import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BearLogo } from '@/components/bear-logo'
import { HeroSection } from '@/components/home/hero-section'
import { HowItWorks } from '@/components/home/how-it-works'
import { Features } from '@/components/home/features'
import { Footer } from '@/components/home/footer'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/50 to-yellow-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <BearLogo size={40} />
              <span className="font-bold text-xl text-amber-900" style={{ fontFamily: 'var(--font-fredoka)' }}>
                Lucky Bingo Bear
              </span>
            </div>
            <nav className="flex items-center gap-4">
              <Link 
                href="/participar" 
                className="text-amber-700 hover:text-amber-900 font-medium transition-colors"
              >
                Participar
              </Link>
              <Button asChild variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
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
        <Features />
        <Footer />
      </div>
    </main>
  )
}
