import type { Metadata } from 'next'
import { Fredoka, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { FloatingWhatsApp } from '@/components/floating-whatsapp'
import './globals.css'

const fredoka = Fredoka({ subsets: ["latin"], variable: '--font-fredoka' });
const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Lucky Bingo Bear - Sorteos de Bingo',
  description: 'Participa en nuestros emocionantes sorteos de bingo. Solicita tu carton y gana increibles premios!',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/logo-solo.svg',
        type: 'image/svg+xml',
      },
    ],
    shortcut: '/logo-solo.svg',
    apple: '/logo-solo.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${fredoka.variable} ${inter.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        <FloatingWhatsApp />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
