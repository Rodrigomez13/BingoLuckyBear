import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/roles'

export async function GET(request: Request) {
  const { serviceClient, error } = await requireAdminApi()
  if (error) return error
  if (!serviceClient) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'all'
    const search = (url.searchParams.get('search') || '').trim().toLowerCase()
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 80), 1), 200)

    let query = serviceClient
      .from('payment_deposits')
      .select('id, user_id, customer_email, amount, currency, wallet_kind, payment_method, payment_reference, receipt_url, status, reviewed_by, reviewed_at, review_notes, wallet_transaction_id, metadata, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`customer_email.ilike.%${search}%,payment_reference.ilike.%${search}%`)
    }

    const { data, error: depositsError } = await query
    if (depositsError) throw depositsError

    const userIds = Array.from(new Set((data ?? []).map((deposit) => deposit.user_id).filter(Boolean))) as string[]
    const { data: profiles } = userIds.length
      ? await serviceClient
          .from('customer_profiles')
          .select('id, email, full_name, alias, avatar_key, phone, dni')
          .in('id', userIds)
      : { data: [] }

    return NextResponse.json({
      deposits: data ?? [],
      profiles: profiles ?? [],
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'No se pudieron cargar los depósitos' }, { status: 500 })
  }
}
