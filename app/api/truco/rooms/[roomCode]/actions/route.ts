import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeRoomCode, type OnlineRole } from '@/lib/truco/shared'
import {
  applyAuthoritativeAction,
  isValidRoleSecret,
  sanitizeRoom,
  validateActionShape,
  type StoredTrucoRoom,
} from '@/lib/truco/server-authority'
import { settleTrucoRoomIfNeeded } from '@/lib/wallet/server'

type RouteContext = {
  params: Promise<{ roomCode: string }>
}

async function getRoomCode(context: RouteContext) {
  const params = await context.params
  return normalizeRoomCode(params.roomCode)
}

export async function POST(request: Request, context: RouteContext) {
  const roomCode = await getRoomCode(context)

  if (roomCode.length !== 5) {
    return NextResponse.json({ ok: false, error: 'Código de mesa inválido' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const actor = body?.actor as OnlineRole
  const secret = typeof body?.secret === 'string' ? body.secret : ''
  const action = body?.action

  if (actor !== 'player' && actor !== 'opponent') {
    return NextResponse.json({ ok: false, error: 'Actor inválido' }, { status: 400 })
  }

  if (!secret) {
    return NextResponse.json({ ok: false, error: 'Falta token de jugador' }, { status: 401 })
  }

  if (!validateActionShape(action)) {
    return NextResponse.json({ ok: false, error: 'Acción inválida' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const { data: existing, error: fetchError } = await supabase.from('truco_rooms').select('*').eq('room_code', roomCode).single()

  if (fetchError || !existing) {
    return NextResponse.json({ ok: false, error: 'Mesa no encontrada' }, { status: 404 })
  }

  const room = existing as StoredTrucoRoom

  if (!isValidRoleSecret(room, actor, secret)) {
    return NextResponse.json({ ok: false, error: 'Acción no autorizada' }, { status: 403 })
  }

  if (room.status === 'waiting') {
    return NextResponse.json({ ok: false, error: 'La mesa todavía está esperando rival' }, { status: 409 })
  }

  if (room.status === 'finished' || room.status === 'abandoned') {
    return NextResponse.json({ ok: false, error: 'La mesa ya no está activa' }, { status: 409 })
  }

  const nextState = applyAuthoritativeAction(room.state, actor, action, room.target_score)
  const nextVersion = room.version + 1
  const nextStatus = nextState.phase === 'game-over' ? 'finished' : 'playing'

  const { data: updated, error: updateError } = await supabase
    .from('truco_rooms')
    .update({ state: nextState, version: nextVersion, status: nextStatus })
    .eq('id', room.id)
    .eq('version', room.version)
    .select('*')
    .single()

  if (updateError || !updated) {
    return NextResponse.json({ ok: false, error: 'La mesa cambió. Reintentá la acción.' }, { status: 409 })
  }

  await supabase.from('truco_room_actions').insert({
    room_id: room.id,
    actor,
    action,
    state_version: nextVersion,
  })

  if (nextStatus === 'finished') {
    await settleTrucoRoomIfNeeded(supabase, updated as never)
  }

  return NextResponse.json({ ok: true, room: sanitizeRoom(updated as StoredTrucoRoom, secret) })
}
