import Link from 'next/link'
import { BearLogo } from '@/components/bear-logo'

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-amber-900 via-amber-800 to-orange-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <BearLogo size={50} />
            <div>
              <h3 className="font-bold text-xl" style={{ fontFamily: 'var(--font-fredoka)' }}>
                Lucky Bingo Bear
              </h3>
              <p className="text-amber-200 text-sm">
                La suerte esta de tu lado
              </p>
            </div>
          </div>
          
          <nav className="flex items-center gap-6">
            <Link href="/participar" className="text-amber-200 hover:text-white transition-colors">
              Participar
            </Link>
            <Link href="#como-funciona" className="text-amber-200 hover:text-white transition-colors">
              Como Funciona
            </Link>
            <Link href="/auth/login" className="text-amber-200 hover:text-white transition-colors">
              Admin
            </Link>
          </nav>
        </div>
        
        <div className="border-t border-amber-700/50 mt-8 pt-8 text-center">
          <p className="text-amber-300 text-sm">
            &copy; {new Date().getFullYear()} Lucky Bingo Bear. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
