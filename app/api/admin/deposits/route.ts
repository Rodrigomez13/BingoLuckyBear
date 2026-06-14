import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/roles'

const VALID_STATUS = ['pending', 'approved', 'rejected', 'cancelled'] as const
type DepositStatus = (typeof VALID_STATUS)[number]

function normalizeStatus(value: string | null): DepositStatus {
  return (VALID_STATUS as readonly string[]).includes(value ?? '') ? (value as DepositStatus) : 'pending'
}

export async function GET(request: Request) {
  const { serviceClient, error } = await requireAdminApi()
  if (error) return error
  if (!serviceClient) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const url = new URL(request.url)
    const status = normalizeStatus(url.searchParams.get('status'))
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 50), 1), 200)

    const { data: deposits, error: depositsError } = await serviceClient
      .from('payment_deposits')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (depositsError) throw depositsError

    const rows = deposits ?? []
    const depositIds = rows.map((row) => row.id)

    // Cantidad de cartones vinculados por deposito para distinguir recargas de compras.
    const cardCountByDeposit = new Map<string, number>()
    if (depositIds.length > 0) {
      const { data: cards } = await serviceClient
        .from('bingo_cards')
        .select('deposit_id')
        .in('deposit_id', depositIds)
      for (const card of cards ?? []) {
        const key = String(card.deposit_id)
        cardCountByDeposit.set(key, (cardCountByDeposit.get(key) ?? 0) + 1)
      }
    }

    const enriched = rows.map((row) => ({
      ...row,
      linked_card_count: cardCountByDeposit.get(String(row.id)) ?? 0,
      kind: (cardCountByDeposit.get(String(row.id)) ?? 0) > 0 ? 'card_purchase' : 'wallet_recharge',
    }))

    return NextResponse.json({ status, deposits: enriched })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'No se pudieron leer los depositos' }, { status: 500 })
  }
}
