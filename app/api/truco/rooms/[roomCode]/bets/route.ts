import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { normalizeRoomCode } from '@/lib/truco/shared'
import { ensurePlayerAccount } from '@/lib/wallet/server'

type RouteContext = {
  params: Promise<{ roomCode: string }>
}

async function getRoomCode(context: RouteContext) {
  const params = await context.params
  return normalizeRoomCode(params.roomCode)
}

function serializeBet(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    roomCode: String(row.room_code),
    predictedWinnerRole: row.predicted_winner_role === 'opponent' ? 'opponent' : 'player',
    amountPoints: Number(row.amount_points ?? 0),
    potentialPayoutPoints: Number(row.potential_payout_points ?? 0),
    status: String(row.status ?? 'pending'),
  }
}

export async function POST(request: Request, context: RouteContext) {
  const roomCode = await getRoomCode(context)
  if (roomCode.length !== 5) {
    return NextResponse.json({ ok: false, error: 'Mesa inválida' }, { status: 400 })
  }

  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'Ingresá a tu cuenta para apostar con saldo.' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const predictedWinnerRole = body?.predictedWinnerRole === 'opponent' ? 'opponent' : body?.predictedWinnerRole === 'player' ? 'player' : null
  const amountPoints = Math.floor(Number(body?.amountPoints ?? 0))

  if (!predictedWinnerRole) {
    return NextResponse.json({ ok: false, error: 'Elegí un jugador para apostar.' }, { status: 400 })
  }
  if (!Number.isFinite(amountPoints) || amountPoints <= 0) {
    return NextResponse.json({ ok: false, error: 'Ingresá un monto válido.' }, { status: 400 })
  }

  const serviceClient = await createServiceClient()
  await ensurePlayerAccount(serviceClient, user)

  const { data: room, error: roomError } = await serviceClient
    .from('truco_rooms')
    .select('id')
    .eq('room_code', roomCode)
    .single()

  if (roomError || !room) {
    return NextResponse.json({ ok: false, error: 'Mesa no encontrada.' }, { status: 404 })
  }

  const { data, error } = await serviceClient.rpc('lbb_place_truco_side_bet', {
    p_room_id: room.id,
    p_user_id: user.id,
    p_predicted_winner_role: predictedWinnerRole,
    p_amount_points: amountPoints,
  })

  if (error || !data) {
    const message = error?.message ?? 'No se pudo registrar la apuesta.'
    const lower = message.toLowerCase()
    const status = lower.includes('saldo insuficiente') ? 409 : lower.includes('ventana') || lower.includes('propia') || lower.includes('maxima') ? 409 : 500
    return NextResponse.json({ ok: false, error: message }, { status })
  }

  return NextResponse.json({ ok: true, bet: serializeBet(data as Record<string, unknown>) })
}
