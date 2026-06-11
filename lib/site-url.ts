const SITE_URL = 'https://www.luckybingbear.com'

export function getSiteUrl() {
  return SITE_URL
}

export function getAuthCallbackUrl(next = '/mi-cuenta') {
  const normalizedNext = next.startsWith('/') ? next : `/${next}`
  return `${SITE_URL}/auth/callback?next=${encodeURIComponent(normalizedNext)}`
}
