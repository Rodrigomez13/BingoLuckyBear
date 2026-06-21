import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { FloatingWhatsApp } from '@/components/floating-whatsapp'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { InstallPrompt } from '@/components/install-prompt'
import './fonts.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lucky Bingo Bear - Sorteos de Bingo',
  description: 'Participa en nuestros emocionantes sorteos de bingo. Solicita tu carton y gana increibles premios!',
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
        url: '/logo-solo.svg',
        type: 'image/svg+xml',
      },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/logo-solo.svg',
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
    <html lang="es" className="bg-background">
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
