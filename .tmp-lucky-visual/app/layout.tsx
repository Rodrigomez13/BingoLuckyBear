import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Oswald, Inter } from 'next/font/google'
import './globals.css'

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Lucky Bingo Bear — El mejor Truco online',
  description:
    'Jugá al Truco online en Lucky Bingo Bear. Mesas 1v1 y 2v2, apuestas seguras y la mejor experiencia de Truco en Argentina.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#12291b',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${oswald.variable} ${inter.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
