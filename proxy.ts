import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase()

  if (host === 'luckybingbear.com') {
    const url = request.nextUrl.clone()
    url.hostname = 'www.luckybingbear.com'
    url.protocol = 'https'
    return NextResponse.redirect(url, 308)
  }

  const pathname = request.nextUrl.pathname
  const excludedGamePaths = [
    '/juegos',
    '/participar',
    '/casino',
    '/en-vivo',
    '/ganadores',
    '/mi-cuenta',
  ]

  if (excludedGamePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    const url = request.nextUrl.clone()
    url.pathname = '/truco/perfil'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
