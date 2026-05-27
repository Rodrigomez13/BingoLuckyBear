import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BearLogo } from '@/components/bear-logo'
import { BingoMachineVisual } from './bingo-machine-visual'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating bingo balls */}
        <div className="absolute top-32 left-[10%] animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
          <BingoBall number={7} color="bg-red-500" />
        </div>
        <div className="absolute top-48 right-[15%] animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}>
          <BingoBall number={21} color="bg-amber-500" />
        </div>
        <div className="absolute bottom-32 left-[20%] animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}>
          <BingoBall number={45} color="bg-green-500" />
        </div>
        <div className="absolute bottom-48 right-[10%] animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3.2s' }}>
          <BingoBall number={63} color="bg-blue-500" />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="text-center space-y-8">
          {/* Main Logo */}
          <div className="flex justify-center animate-pulse" style={{ animationDuration: '2s' }}>
            <div className="relative">
              <BearLogo size={160} className="relative drop-shadow-2xl" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 
              className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400"
              style={{ fontFamily: 'var(--font-fredoka)' }}
            >
              Lucky Bingo Bear
            </h1>
            <p className="text-xl md:text-2xl text-zinc-200 max-w-2xl mx-auto leading-relaxed">
              Participa en nuestros emocionantes sorteos de bingo y gana{' '}
              <span className="font-bold text-amber-300">increibles premios</span>
            </p>
          </div>

          <BingoMachineVisual />

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              asChild 
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-lg px-8 py-6 shadow-lg shadow-amber-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-amber-500/40"
            >
              <Link href="/participar">
                Solicitar Mi Carton
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="border-2 border-amber-400/50 bg-transparent text-amber-100 hover:bg-amber-400/10 font-semibold text-lg px-8 py-6"
            >
              <Link href="#como-funciona">
                Como Funciona
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto pt-12">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-amber-300" style={{ fontFamily: 'var(--font-fredoka)' }}>
                100+
              </div>
              <div className="text-sm text-zinc-400">Participantes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-300" style={{ fontFamily: 'var(--font-fredoka)' }}>
                50+
              </div>
              <div className="text-sm text-zinc-400">Sorteos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-amber-300" style={{ fontFamily: 'var(--font-fredoka)' }}>
                25+
              </div>
              <div className="text-sm text-zinc-400">Ganadores</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function BingoBall({ number, color }: { number: number; color: string }) {
  return (
    <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center shadow-lg`}>
      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
        <span className="font-bold text-gray-800 text-sm">{number}</span>
      </div>
    </div>
  )
}
