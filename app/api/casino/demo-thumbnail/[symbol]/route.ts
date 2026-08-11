import { NextResponse } from 'next/server'
import { getCasinoDemoThumbnail } from '@/lib/casino/demo-catalog'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  if (!/^[a-zA-Z0-9_-]+$/.test(symbol)) return new NextResponse(null, { status: 400 })

  const thumbnail = getCasinoDemoThumbnail(symbol)
  if (!thumbnail) return new NextResponse(null, { status: 404 })

  try {
    const imageResponse = await fetch(thumbnail, { signal: AbortSignal.timeout(5000) })
    if (!imageResponse.ok || !imageResponse.body) throw new Error('Thumbnail unavailable')

    return new NextResponse(imageResponse.body, {
      headers: {
        'Content-Type': imageResponse.headers.get('content-type') ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}
