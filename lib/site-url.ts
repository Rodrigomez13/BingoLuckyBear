const PRODUCTION_SITE_URL = 'https://www.luckybingbear.com'

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function getSiteUrl(origin?: string | null) {
  if (origin) return trimTrailingSlash(origin)

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL)
  }

  return PRODUCTION_SITE_URL
}

export function normalizeInternalPath(next = '/mi-cuenta/jugador') {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/mi-cuenta/jugador'
  return next
}

export function getAuthCallbackUrl(next = '/mi-cuenta/jugador', origin?: string | null) {
  const normalizedNext = normalizeInternalPath(next)
  return `${getSiteUrl(origin)}/auth/callback?next=${encodeURIComponent(normalizedNext)}`
}
