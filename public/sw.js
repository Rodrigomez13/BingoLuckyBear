/* Lucky Bingo Bear - minimal service worker.
   Caches only static assets. Never caches API, auth, or live data. */

const STATIC_CACHE = 'lbb-static-v1'

// Same-origin static asset paths that are safe to cache-first.
const STATIC_DESTINATIONS = ['style', 'script', 'font', 'image']

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Only handle same-origin requests.
  if (url.origin !== self.location.origin) return

  // Never cache API, auth, Next data, or anything dynamic.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth') ||
    url.pathname.includes('/_next/data') ||
    url.search.includes('no-store')
  ) {
    return
  }

  // Cache-first for hashed static assets and images.
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    STATIC_DESTINATIONS.includes(request.destination)

  if (isStaticAsset) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        try {
          const response = await fetch(request)
          if (response.ok) {
            const cache = await caches.open(STATIC_CACHE)
            cache.put(request, response.clone())
          }
          return response
        } catch (error) {
          return cached || Response.error()
        }
      })(),
    )
  }
})
