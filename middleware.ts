import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase()

  if (host === 'luckybingbear.com') {
    const url = request.nextUrl.clone()
    url.hostname = 'www.luckybingbear.com'
    url.protocol = 'https'
    return NextResponse.redirect(url, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo-solo.svg).*)'],
}
