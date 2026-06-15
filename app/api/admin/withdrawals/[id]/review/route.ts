import { NextResponse } from 'next/server'
import { logAdminAudit } from '@/lib/admin/audit'
import { requireAdminApi } from '@/lib/auth/roles'

function cleanText(value: unknown, max = 220) {
  return String(value ?? '').trim().slice(0, max)
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { user, serviceClient, error } = await requireAdminApi()
  if (error) return error
  if (!user || !serviceClient) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const action = cleanText(body.action, 20)
    const notes = cleanText(body.notes)
    const settlementReference = cleanText(body.settlement_reference, 120)

    if (!id) return NextResponse.json({ error: 'Falta el retiro' }, { status: 400 })
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }

    const { data: before, error: readError } = await serviceClient
      .from('payment_withdrawals')
      .select('*')
      .eq('id', id)
      .single()

    if (readError || !before) throw readError ?? new Error('Retiro no encontrado')

    const { data: withdrawal, error: reviewError } = await serviceClient.rpc('lbb_review_withdrawal', {
      p_withdrawal_id: id,
      p_admin_user_id: user.id,
      p_action: action,
      p_notes: notes || (action === 'approve' ? 'Retiro aprobado' : 'Retiro rechazado'),
      p_settlement_reference: settlementReference || null,
    })

    if (reviewError) throw reviewError

    await logAdminAudit(serviceClient, {
      adminUserId: user.id,
      action: `payment_withdrawal_${action === 'approve' ? 'approved' : 'rejected'}`,
      entityType: 'payment_withdrawal',
      entityId: id,
      beforeData: before,
      afterData: withdrawal,
      reason: notes || (action === 'approve' ? 'Retiro aprobado' : 'Retiro rechazado'),
      metadata: settlementReference ? { settlementReference } : undefined,
    })

    return NextResponse.json({ ok: true, withdrawal })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo revisar el retiro' },
      { status: 500 },
    )
  }
}
