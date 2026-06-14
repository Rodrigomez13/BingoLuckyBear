import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ensurePlayerAccount, getWalletSnapshot } from '@/lib/wallet/server'
import {
  createInitialRoomState,
  makeRoomCode,
  sanitizeRoom,
  summarizePublicRoom,
  type RoomVisibility,
  type StoredTrucoRoom,
} from '@/lib/truco/server-authority'

function missingSupabaseEnv() {
  const missing: string[] = []
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  return missing
}

function dbSetupHint(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes('lbb_wallets') || lower.includes('entry_fee_points')) return 'Ejecutá la migración 20260615_profiles_wallet_truco_economy.sql en Supabase.'
  if (lower.includes('visibility')) return 'Ejecutá la migración 20260614_truco_lobby_visibility.sql en el mismo proyecto Supabase conectado a Vercel.'
  if (lower.includes('truco_rooms')) return 'Ejecutá primero la migración 20260613_truco_server_authority.sql en Supabase.'
  return 'Revisá que Vercel apunte al mismo proyecto Supabase donde ejecutaste las migraciones.'
}

function normalizeEntryFee(value: unknown) {
  const amount = Number(value ?? 0)
  if (![0, 10, 50, 100].includes(amount)) return 0
  return amount
}

export async function GET() {
  try {
    const missing = missingSupabaseEnv()
    if (missing.length > 0) {
      return NextResponse.json({ ok: false, rooms: [], error: `Faltan variables en Vercel: ${missing.join(', ')}` })
    }

    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('truco_rooms')
      .select('*')
      .eq('visibility', 'public')
      .in('status', ['waiting', 'playing'])
      .order('updated_at', { ascending: false })
      .limit(24)

    if (error) {
      return NextResponse.json({ ok: false, rooms: [], error: error.message, hint: dbSetupHint(error.message) })
    }

    return NextResponse.json({
      ok: true,
      rooms: (data ?? []).map((room) => summarizePublicRoom(room as StoredTrucoRoom)),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado'
    return NextResponse.json({ ok: false, rooms: [], error: message, hint: dbSetupHint(message) })
  }
}

export async function POST(request: Request) {
  try {
    const missing = missingSupabaseEnv()
    if (missing.length > 0) {
      return NextResponse.json({ ok: false, error: `Faltan variables en Vercel: ${missing.join(', ')}` }, { status: 500 })
    }

    const authClient = await createClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Para crear una mesa online tenés que iniciar sesión.' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const target: 15 | 30 = body?.target === 15 ? 15 : 30
    const visibility: RoomVisibility = body?.visibility === 'public' ? 'public' : 'private'
    const entryFee = normalizeEntryFee(body?.entryFeePoints)
    const ranked = Boolean(body?.ranked ?? entryFee > 0)
    const supabase = await createServiceClient()

    await ensurePlayerAccount(supabase, user)
    const wallet = await getWalletSnapshot(supabase, user.id)
    if (entryFee > 0 && wallet.bonus_points_balance < entryFee) {
      return NextResponse.json({ ok: false, error: 'Saldo insuficiente para crear esta mesa.' }, { status: 402 })
    }

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
          host_user_id: user.id,
          entry_fee_points: entryFee,
          prize_pool_points: 0,
          ranked,
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

      const message = error?.message ?? 'No se pudo crear la mesa'
      if (!message.toLowerCase().includes('duplicate')) {
        return NextResponse.json({ ok: false, error: message, hint: dbSetupHint(message) }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: false, error: 'No se pudo generar un código de mesa disponible' }, { status: 409 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado'
    return NextResponse.json({ ok: false, error: message, hint: dbSetupHint(message) }, { status: 500 })
  }
}
