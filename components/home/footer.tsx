import Link from 'next/link'
import { BearLogo } from '@/components/bear-logo'

export function Footer() {
  return (
    <footer className="overflow-hidden border-t border-white/10 bg-[#0b0b10] py-12 text-white">
      <div className="border-b border-white/10 pb-8">
        <div className="lbb-big-marquee flex w-max whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, index) => (
            <span
              key={index}
              className="px-4 font-mono text-5xl font-black uppercase leading-none tracking-normal text-white/[0.045] sm:text-7xl lg:text-8xl"
            >
              Tu suerte empieza aca - Lucky Bingo Bear - Bingo digital en vivo -
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <BearLogo size={44} />
            <div>
              <h3 className="font-mono text-lg font-bold tracking-normal">
                Lucky Bingo Bear
              </h3>
              <p className="text-sm text-slate-400">
                La suerte esta de tu lado
              </p>
            </div>
          </div>
          
          <nav className="flex flex-wrap items-center justify-center gap-5 text-sm sm:gap-6">
            <Link href="#como-funciona" className="text-slate-400 transition-colors hover:text-white">
              Como Funciona
            </Link>
            <Link href="/en-vivo" className="text-slate-400 transition-colors hover:text-white">
              En Vivo
            </Link>
            <Link href="/ganadores" className="text-slate-400 transition-colors hover:text-white">
              Ganadores
            </Link>
          </nav>
        </div>
        
        <div className="mt-8 border-t border-white/10 pt-8 text-center">
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} Lucky Bingo Bear. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
