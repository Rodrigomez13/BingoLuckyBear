const DEFAULT_SITE_URL = 'https://www.luckybingbear.com'

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '')
}

export function getAuthCallbackUrl(next = '/mi-cuenta') {
  const normalizedNext = next.startsWith('/') ? next : `/${next}`
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(normalizedNext)}`
}
