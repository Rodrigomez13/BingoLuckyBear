import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  createInitialRoomState,
  makeRoomCode,
  sanitizeRoom,
  summarizePublicRoom,
  type RoomVisibility,
  type StoredTrucoRoom,
} from '@/lib/truco/server-authority'

export async function GET() {
  try {
    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('truco_rooms')
      .select('*')
      .eq('visibility', 'public')
      .in('status', ['waiting', 'playing'])
      .order('updated_at', { ascending: false })
      .limit(24)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      rooms: (data ?? []).map((room) => summarizePublicRoom(room as StoredTrucoRoom)),
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Error inesperado' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const target: 15 | 30 = body?.target === 15 ? 15 : 30
    const visibility: RoomVisibility = body?.visibility === 'public' ? 'public' : 'private'
    const supabase = await createServiceClient()

    for (let attempt = 0; attempt < 5; attempt++) {
      const roomCode = makeRoomCode(attempt === 0 ? body?.roomCode : undefined)
      const hostSecret = randomUUID()
      const state = createInitialRoomState(target)

      const { data, error } = await supabase
        .from('truco_rooms')
        .insert({
          room_code: roomCode,
          target_score: target,
          status: 'waiting',
          visibility,
          state,
          host_secret: hostSecret,
          host_connected_at: new Date().toISOString(),
        })
        .select('*')
        .single()

      if (!error && data) {
        return NextResponse.json({
          ok: true,
          room: sanitizeRoom(data as StoredTrucoRoom, hostSecret),
          secret: hostSecret,
        })
      }

      if (!String(error?.message ?? '').toLowerCase().includes('duplicate')) {
        return NextResponse.json({ ok: false, error: error?.message ?? 'No se pudo crear la mesa' }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: false, error: 'No se pudo generar un código de mesa disponible' }, { status: 409 })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Error inesperado' }, { status: 500 })
  }
}
