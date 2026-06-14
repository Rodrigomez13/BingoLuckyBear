import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { normalizeRoomCode } from '@/lib/truco/shared'
import { sanitizeRoom, type StoredTrucoRoom } from '@/lib/truco/server-authority'
import { chargeTrucoEntryFee, ensurePlayerAccount, getWalletSnapshot } from '@/lib/wallet/server'

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

  if (!user) {
    return NextResponse.json({ ok: false, error: 'Para entrar a una mesa online tenés que iniciar sesión.' }, { status: 401 })
  }

  if (room.guest_secret) {
    return NextResponse.json({ ok: false, error: 'La mesa ya tiene dos jugadores' }, { status: 409 })
  }

  if (room.host_user_id === user.id) {
    return NextResponse.json({ ok: false, error: 'No podés entrar como rival a tu propia mesa.' }, { status: 409 })
  }

  const entryFee = Number(room.entry_fee_points ?? 0)
  await ensurePlayerAccount(serviceClient, user)
  const guestWallet = await getWalletSnapshot(serviceClient, user.id)
  if (entryFee > 0 && guestWallet.bonus_points_balance < entryFee) {
    return NextResponse.json({ ok: false, error: 'Saldo insuficiente para entrar a esta mesa.' }, { status: 402 })
  }

  if (entryFee > 0 && room.host_user_id) {
    const hostWallet = await getWalletSnapshot(serviceClient, room.host_user_id)
    if (hostWallet.bonus_points_balance < entryFee) {
      return NextResponse.json({ ok: false, error: 'El anfitrión ya no tiene saldo suficiente. Elegí otra mesa.' }, { status: 409 })
    }
  }

  if (entryFee > 0 && room.host_user_id) {
    await chargeTrucoEntryFee(serviceClient, room.id, room.host_user_id, entryFee)
    await chargeTrucoEntryFee(serviceClient, room.id, user.id, entryFee)
  }

  const guestSecret = randomUUID()
  const { data, error } = await serviceClient
    .from('truco_rooms')
    .update({
      guest_secret: guestSecret,
      guest_user_id: user.id,
      guest_connected_at: new Date().toISOString(),
      status: 'playing',
      prize_pool_points: entryFee > 0 ? entryFee * 2 : 0,
    })
    .eq('id', room.id)
    .is('guest_secret', null)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'No se pudo unir a la mesa' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, room: sanitizeRoom(data as StoredTrucoRoom, guestSecret), secret: guestSecret })
}
