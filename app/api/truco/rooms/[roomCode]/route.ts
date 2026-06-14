import { randomUUID } from 'node:crypto'
import type { User } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { normalizeRoomCode } from '@/lib/truco/shared'
import { parseTrucoIdentity, type TrucoIdentity } from '@/lib/truco/identity'
import {
  forfeitGame,
  isValidRoleSecret,
  sanitizeRoom,
  type StoredTrucoRoom,
} from '@/lib/truco/server-authority'
import { ensurePlayerAccount, settleTrucoRoomIfNeeded } from '@/lib/wallet/server'

type RouteContext = {
  params: Promise<{ roomCode: string }>
}

async function getRoomCode(context: RouteContext) {
  const params = await context.params
  return normalizeRoomCode(params.roomCode)
}

async function getAuthenticatedIdentity(
  serviceClient: Awaited<ReturnType<typeof createServiceClient>>,
  user: Pick<User, 'id' | 'email'>,
): Promise<TrucoIdentity> {
  await ensurePlayerAccount(serviceClient, user)
  const { data, error } = await serviceClient
    .from('customer_profiles')
    .select('alias, avatar_key')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return parseTrucoIdentity({ name: data.alias, avatarKey: data.avatar_key }) ?? {
    name: 'Jugador',
    avatarKey: 'golden_bear',
  }
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
  const serviceClient = await createServiceClient()

  const { data: existing, error: fetchError } = await serviceClient.from('truco_rooms').select('*').eq('room_code', roomCode).single()

  if (fetchError || !existing) {
    return NextResponse.json({ ok: false, error: 'Mesa no encontrada' }, { status: 404 })
  }

  const room = existing as StoredTrucoRoom

  if (providedSecret && (providedSecret === room.host_secret || providedSecret === room.guest_secret)) {
    return NextResponse.json({ ok: true, room: sanitizeRoom(room, providedSecret), secret: providedSecret })
  }

  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (room.guest_secret) {
    return NextResponse.json({ ok: false, error: 'La mesa ya tiene dos jugadores' }, { status: 409 })
  }

  if (user && room.host_user_id === user.id) {
    return NextResponse.json({ ok: false, error: 'No podés entrar como rival a tu propia mesa.' }, { status: 409 })
  }

  const entryFee = Number(room.entry_fee_points ?? 0)
  if (entryFee > 0 && !user) {
    return NextResponse.json({ ok: false, error: 'Las mesas con pozo requieren iniciar sesión.' }, { status: 401 })
  }

  const identity = user
    ? await getAuthenticatedIdentity(serviceClient, user)
    : parseTrucoIdentity(body?.identity)

  if (!identity) {
    return NextResponse.json({ ok: false, error: 'Ingresá un nombre de 3 a 24 caracteres y elegí un avatar.' }, { status: 400 })
  }

  const guestSecret = randomUUID()
  const { data, error } = await serviceClient.rpc('lbb_join_truco_room', {
    p_room_id: room.id,
    p_guest_user_id: user?.id ?? null,
    p_guest_secret: guestSecret,
    p_guest_name: identity.name,
    p_guest_avatar_key: identity.avatarKey,
  })

  if (error || !data) {
    const message = error?.message ?? 'No se pudo unir a la mesa'
    const lower = message.toLowerCase()
    const status = lower.includes('saldo insuficiente') ? 402 : lower.includes('requieren una cuenta') ? 401 : lower.includes('disponible') || lower.includes('propia mesa') ? 409 : 500
    return NextResponse.json({ ok: false, error: message }, { status })
  }

  return NextResponse.json({ ok: true, room: sanitizeRoom(data as StoredTrucoRoom, guestSecret), secret: guestSecret })
}

export async function DELETE(request: Request, context: RouteContext) {
  const roomCode = await getRoomCode(context)

  if (roomCode.length !== 5) {
    return NextResponse.json({ ok: false, error: 'Código de mesa inválido' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const actor = body?.actor === 'opponent' ? 'opponent' : body?.actor === 'player' ? 'player' : null
  const secret = typeof body?.secret === 'string' ? body.secret : ''

  if (!actor || !secret || secret.length > 100) {
    return NextResponse.json({ ok: false, error: 'Faltan credenciales válidas para salir.' }, { status: 401 })
  }

  const serviceClient = await createServiceClient()
  const { data: existing, error: fetchError } = await serviceClient
    .from('truco_rooms')
    .select('*')
    .eq('room_code', roomCode)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ ok: false, error: 'Mesa no encontrada' }, { status: 404 })
  }

  const room = existing as StoredTrucoRoom
  if (!isValidRoleSecret(room, actor, secret)) {
    return NextResponse.json({ ok: false, error: 'Salida no autorizada' }, { status: 403 })
  }

  if (room.status === 'abandoned') {
    return NextResponse.json({ ok: true, room: sanitizeRoom(room, secret) })
  }

  if (room.status === 'finished') {
    await settleTrucoRoomIfNeeded(serviceClient, room)
    const { data: settled } = await serviceClient.from('truco_rooms').select('*').eq('id', room.id).single()
    return NextResponse.json({ ok: true, room: sanitizeRoom((settled ?? room) as StoredTrucoRoom, secret) })
  }

  if (room.status === 'waiting') {
    if (actor !== 'player') {
      return NextResponse.json({ ok: false, error: 'Solo el anfitrión puede cancelar una mesa en espera.' }, { status: 403 })
    }

    const { data, error } = await serviceClient.rpc('lbb_cancel_waiting_truco_room', {
      p_room_id: room.id,
    })

    if (error || !data) {
      return NextResponse.json({ ok: false, error: error?.message ?? 'No se pudo cancelar la mesa.' }, { status: 409 })
    }

    return NextResponse.json({ ok: true, room: sanitizeRoom(data as StoredTrucoRoom, secret) })
  }

  const nextState = forfeitGame(room.state, actor)
  const nextVersion = room.version + 1
  const { data: updated, error: updateError } = await serviceClient
    .from('truco_rooms')
    .update({
      state: nextState,
      status: 'finished',
      version: nextVersion,
      abandoned_by: actor,
    })
    .eq('id', room.id)
    .eq('version', room.version)
    .eq('status', 'playing')
    .select('*')
    .single()

  if (updateError || !updated) {
    return NextResponse.json({ ok: false, error: 'La mesa cambió mientras salías. Reintentá.' }, { status: 409 })
  }

  await serviceClient.from('truco_room_actions').insert({
    room_id: room.id,
    actor,
    action: { type: 'leave-room' },
    state_version: nextVersion,
  })

  await settleTrucoRoomIfNeeded(serviceClient, updated as StoredTrucoRoom)

  const { data: settled } = await serviceClient.from('truco_rooms').select('*').eq('id', room.id).single()
  return NextResponse.json({ ok: true, room: sanitizeRoom((settled ?? updated) as StoredTrucoRoom, secret) })
}
