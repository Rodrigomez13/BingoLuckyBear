import { randomUUID } from 'node:crypto'
import type { User } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ensurePlayerAccount } from '@/lib/wallet/server'
import { parseTrucoIdentity, type TrucoIdentity } from '@/lib/truco/identity'
import {
  createInitialRoomState,
  makeRoomCode,
  sanitizeRoom,
  summarizePublicRoom,
  type RoomVisibility,
  type StoredTrucoRoom,
} from '@/lib/truco/server-authority'
import { normalizeTrucoRules } from '@/lib/truco/rules'

function missingSupabaseEnv() {
  const missing: string[] = []
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  return missing
}

function dbSetupHint(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes('lbb_create_truco_room') || lower.includes('host_name')) return 'Ejecutá la migración 20260616_truco_guest_stakes_wallet_atomic.sql en Supabase.'
  if (lower.includes('lbb_wallets') || lower.includes('entry_fee_points')) return 'Ejecutá la migración 20260615_profiles_wallet_truco_economy.sql en Supabase.'
  if (lower.includes('visibility')) return 'Ejecutá la migración 20260614_truco_lobby_visibility.sql en el mismo proyecto Supabase conectado a Vercel.'
  if (lower.includes('truco_rooms')) return 'Ejecutá primero la migración 20260613_truco_server_authority.sql en Supabase.'
  return 'Revisá que Vercel apunte al mismo proyecto Supabase donde ejecutaste las migraciones.'
}

function normalizePotPoints(value: unknown) {
  const amount = Number(value ?? 0)
  return [0, 20, 100, 200].includes(amount) ? amount : null
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

    const body = await request.json().catch(() => ({}))
    const target: 15 | 30 = body?.target === 15 ? 15 : 30
    const visibility: RoomVisibility = body?.visibility === 'public' ? 'public' : 'private'
    const potPoints = normalizePotPoints(body?.potPoints)
    const rules = normalizeTrucoRules(body?.rules)

    if (potPoints === null) {
      return NextResponse.json({ ok: false, error: 'El pozo debe ser 0, 20, 100 o 200.' }, { status: 400 })
    }

    if (potPoints > 0 && !user) {
      return NextResponse.json({ ok: false, error: 'Las mesas con pozo requieren iniciar sesión.' }, { status: 401 })
    }

    const entryFee = potPoints / 2
    const ranked = entryFee > 0
    const supabase = await createServiceClient()
    const identity = user
      ? await getAuthenticatedIdentity(supabase, user)
      : parseTrucoIdentity(body?.identity)

    if (!identity) {
      return NextResponse.json({ ok: false, error: 'Ingresá un nombre de 3 a 24 caracteres y elegí un avatar.' }, { status: 400 })
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const roomCode = makeRoomCode(attempt === 0 ? body?.roomCode : undefined)
      const hostSecret = randomUUID()
      const state = createInitialRoomState(target, rules)

      const { data, error } = await supabase.rpc('lbb_create_truco_room', {
        p_room_code: roomCode,
        p_target_score: target,
        p_visibility: visibility,
        p_state: state,
        p_host_secret: hostSecret,
        p_host_user_id: user?.id ?? null,
        p_host_name: identity.name,
        p_host_avatar_key: identity.avatarKey,
        p_entry_fee_points: entryFee,
        p_ranked: ranked,
      })

      if (!error && data) {
        return NextResponse.json({
          ok: true,
          room: sanitizeRoom(data as StoredTrucoRoom, hostSecret),
          secret: hostSecret,
        })
      }

      const message = error?.message ?? 'No se pudo crear la mesa'
      const lower = message.toLowerCase()
      if (!lower.includes('duplicate') && error?.code !== '23505') {
        const status = lower.includes('saldo insuficiente') ? 402 : lower.includes('requieren una cuenta') ? 401 : 500
        return NextResponse.json({ ok: false, error: message, hint: dbSetupHint(message) }, { status })
      }
    }

    return NextResponse.json({ ok: false, error: 'No se pudo generar un código de mesa disponible' }, { status: 409 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado'
    return NextResponse.json({ ok: false, error: message, hint: dbSetupHint(message) }, { status: 500 })
  }
}
