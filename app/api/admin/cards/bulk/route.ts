import { NextResponse } from 'next/server'
import { isReasonablePhone, normalizePhoneNumber } from '@/lib/phone'
import { requireAdminApi } from '@/lib/auth/roles'
import { logAdminAudit } from '@/lib/admin/audit'

type PaymentStatus = 'pending' | 'approved' | 'rejected'

interface ClientUpdatePayload {
  full_name?: string
  dni?: string
  address?: string
  phone?: string
  email?: string
  payout_account_kind?: string
  payout_account?: string
  payout_holder_name?: string
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? [...new Set(value.map(String).map((item) => item.trim()).filter(Boolean))]
    : []
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return value === 'pending' || value === 'approved' || value === 'rejected'
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(request: Request) {
  const { user, serviceClient, error: authError } = await requireAdminApi()
  if (authError) return authError
  if (!user || !serviceClient) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const action = String(body.action ?? '')
    const cardIds = asStringArray(body.cardIds)

    if (cardIds.length === 0) {
      return NextResponse.json({ error: 'Selecciona al menos un carton' }, { status: 400 })
    }

    const { data: existingCards, error: existingError } = await serviceClient
      .from('bingo_cards')
      .select('*')
      .in('id', cardIds)

    if (existingError) throw existingError
    if (!existingCards || existingCards.length !== cardIds.length) {
      return NextResponse.json({ error: 'Algunos cartones no existen' }, { status: 404 })
    }

    if (action === 'set_payment_status') {
      if (!isPaymentStatus(body.payment_status)) {
        return NextResponse.json({ error: 'Estado invalido' }, { status: 400 })
      }

      const { data, error } = await serviceClient
        .from('bingo_cards')
        .update({
          payment_status: body.payment_status,
          payment_reviewed_at: new Date().toISOString(),
          payment_reviewed_by: user.id,
        })
        .in('id', cardIds)
        .select('*')

      if (error) throw error

      await logAdminAudit(serviceClient, {
        adminUserId: user.id,
        action: `bingo_cards_${body.payment_status}`,
        entityType: 'bingo_cards',
        entityId: cardIds.join(','),
        beforeData: existingCards,
        afterData: data,
        reason: String(body.reason ?? `Cambio masivo a ${body.payment_status}`),
      })

      return NextResponse.json({ cards: data ?? [] })
    }

    if (action === 'update_client') {
      const client = (typeof body.client === 'object' && body.client ? body.client : {}) as ClientUpdatePayload
      const fullName = String(client.full_name ?? '').trim()
      const dni = String(client.dni ?? '').trim()
      const address = String(client.address ?? '').trim()
      const phone = normalizePhoneNumber(client.phone)
      const email = String(client.email ?? '').trim().toLowerCase()
      const payoutAccountKind = String(client.payout_account_kind ?? '').trim()
      const payoutAccount = String(client.payout_account ?? '').trim()
      const payoutHolderName = String(client.payout_holder_name ?? '').trim()

      if (fullName.length < 3 || dni.length < 6 || address.length < 6 || !isReasonablePhone(phone) || !isValidEmail(email)) {
        return NextResponse.json({ error: 'Revisa nombre, DNI, direccion, telefono y email' }, { status: 400 })
      }

      if (payoutAccountKind && !['Alias', 'CBU', 'CVU'].includes(payoutAccountKind)) {
        return NextResponse.json({ error: 'Tipo de cuenta de premio invalido' }, { status: 400 })
      }

      const { data, error } = await serviceClient
        .from('bingo_cards')
        .update({
          full_name: fullName,
          dni,
          address,
          phone,
          email,
          payout_account_kind: payoutAccountKind || null,
          payout_account: payoutAccount || null,
          payout_holder_name: payoutHolderName || null,
        })
        .in('id', cardIds)
        .select('*')

      if (error) throw error

      await logAdminAudit(serviceClient, {
        adminUserId: user.id,
        action: 'bingo_cards_update_client',
        entityType: 'bingo_cards',
        entityId: cardIds.join(','),
        beforeData: existingCards,
        afterData: data,
        reason: String(body.reason ?? 'Actualización de datos de cliente'),
      })

      return NextResponse.json({ cards: data ?? [] })
    }

    return NextResponse.json({ error: 'Accion invalida' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo aplicar la accion masiva'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
