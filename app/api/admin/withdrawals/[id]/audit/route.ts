import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/roles'
import { buildWithdrawalDepositAudit } from '@/lib/withdrawal-audit'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { user, serviceClient, error } = await requireAdminApi()
  if (error) return error
  if (!user || !serviceClient) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: 'Falta el retiro' }, { status: 400 })

    const { data: withdrawal, error: readError } = await serviceClient
      .from('payment_withdrawals')
      .select('id, user_id, amount, currency, status, payout_account_kind, payout_account, payout_holder_name')
      .eq('id', id)
      .single()

    if (readError || !withdrawal) {
      return NextResponse.json({ error: 'Retiro no encontrado' }, { status: 404 })
    }
    if (!withdrawal.user_id) {
      return NextResponse.json({ error: 'El retiro no tiene un jugador vinculado' }, { status: 409 })
    }

    const audit = await buildWithdrawalDepositAudit(serviceClient, withdrawal.user_id)

    return NextResponse.json({ ok: true, withdrawal, audit })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'No se pudo generar la auditoría del retiro' },
      { status: 500 },
    )
  }
}
