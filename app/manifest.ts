import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lucky Bingo Bear',
    short_name: 'Lucky Bear',
    description: 'Sorteos de bingo en vivo, cartones digitales y Truco online. Jugá y ganá premios reales.',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b0b10',
    theme_color: '#0b0b10',
    lang: 'es',
    categories: ['games', 'entertainment'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Sorteo en vivo',
        short_name: 'En vivo',
        url: '/en-vivo?source=pwa',
      },
      {
        name: 'Comprar cartones',
        short_name: 'Participar',
        url: '/participar?source=pwa',
      },
      {
        name: 'Truco online',
        short_name: 'Truco',
        url: '/truco?source=pwa',
      },
    ],
  }
}
