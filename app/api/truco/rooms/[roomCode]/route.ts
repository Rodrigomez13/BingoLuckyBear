import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeRoomCode } from '@/lib/truco/shared'
import { sanitizeRoom, type StoredTrucoRoom } from '@/lib/truco/server-authority'

type RouteContext = {
  params: Promise<{ roomCode: string }>
}

async function getRoomCode(context: RouteContext) {
  const params = await context.params
  return normalizeRoomCode(params.roomCode)
}

export async function GET(request: Request, context: RouteContext) {
  const roomCode = await getRoomCode(context)
  const secret = new URL(request.url).searchParams.get('secret')

  if (roomCode.length !== 5) {
    return NextResponse.json({ ok: false, error: 'Código de mesa inválido' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const { data, error } = await supabase.from('truco_rooms').select('*').eq('room_code', roomCode).single()

  if (error || !data) {
    return NextResponse.json({ ok: false, error: 'Mesa no encontrada' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, room: sanitizeRoom(data as StoredTrucoRoom, secret) })
}

export async function POST(request: Request, context: RouteContext) {
  const roomCode = await getRoomCode(context)

  if (roomCode.length !== 5) {
    return NextResponse.json({ ok: false, error: 'Código de mesa inválido' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const providedSecret = typeof body?.secret === 'string' ? body.secret : null
  const supabase = await createServiceClient()

  const { data: existing, error: fetchError } = await supabase.from('truco_rooms').select('*').eq('room_code', roomCode).single()

  if (fetchError || !existing) {
    return NextResponse.json({ ok: false, error: 'Mesa no encontrada' }, { status: 404 })
  }

  const room = existing as StoredTrucoRoom

  if (providedSecret && (providedSecret === room.host_secret || providedSecret === room.guest_secret)) {
    return NextResponse.json({ ok: true, room: sanitizeRoom(room, providedSecret), secret: providedSecret })
  }

  if (room.guest_secret) {
    return NextResponse.json({ ok: false, error: 'La mesa ya tiene dos jugadores' }, { status: 409 })
  }

  const guestSecret = randomUUID()
  const { data, error } = await supabase
    .from('truco_rooms')
    .update({ guest_secret: guestSecret, guest_connected_at: new Date().toISOString(), status: 'playing' })
    .eq('id', room.id)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'No se pudo unir a la mesa' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, room: sanitizeRoom(data as StoredTrucoRoom, guestSecret), secret: guestSecret })
}
