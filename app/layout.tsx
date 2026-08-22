import type { Metadata, Viewport } from 'next'
import { DM_Sans, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { FloatingWhatsApp } from '@/components/floating-whatsapp'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { InstallPrompt } from '@/components/install-prompt'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })

export const metadata: Metadata = {
  title: 'Lucky Bear — Truco Argentino Online',
  description: 'Jugá Truco online contra el oso, con amigos o en mesas públicas. Lucky Bear: Truco argentino 24/7.',
  generator: 'v0.app',
  applicationName: 'Lucky Bingo Bear',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Lucky Bingo Bear',
  },
  icons: {
    icon: [
      {
        url: '/truco/golden-bear-mascot.webp',
        type: 'image/svg+xml',
      },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/truco/golden-bear-mascot.webp',
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#0b0b10',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${dmSans.variable} ${spaceGrotesk.variable} bg-background`}>
      <body className="font-sans antialiased pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
        <FloatingWhatsApp />
        <MobileBottomNav />
        <InstallPrompt />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
