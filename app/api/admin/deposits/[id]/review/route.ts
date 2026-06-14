import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/roles'
import { logAdminAudit } from '@/lib/admin/audit'
import { approveDepositAndCreditWallet } from '@/lib/economy/server'

function cleanNote(value: unknown) {
  return String(value ?? '').trim().slice(0, 220)
}

function isReviewAction(value: unknown): value is 'approve' | 'reject' | 'cancel' {
  return value === 'approve' || value === 'reject' || value === 'cancel'
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { user, serviceClient, error } = await requireAdminApi()
  if (error) return error
  if (!user || !serviceClient) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const action = body.action
    const notes = cleanNote(body.notes)

    if (!id) return NextResponse.json({ error: 'Falta el depósito' }, { status: 400 })
    if (!isReviewAction(action)) return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })

    const { data: deposit, error: readError } = await serviceClient
      .from('payment_deposits')
      .select('*')
      .eq('id', id)
      .single()

    if (readError || !deposit) throw readError ?? new Error('Depósito no encontrado')
    if (deposit.status !== 'pending') {
      return NextResponse.json({ error: 'Solo se pueden revisar depósitos pendientes' }, { status: 409 })
    }

    if (action === 'approve') {
      let updated = deposit

      if (deposit.user_id) {
        updated = await approveDepositAndCreditWallet(serviceClient, {
          depositId: id,
          adminUserId: user.id,
          notes: notes || 'Depósito aprobado desde panel admin',
        })
      } else {
        const { data, error: updateError } = await serviceClient
          .from('payment_deposits')
          .update({
            status: 'approved',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            review_notes: notes || 'Depósito aprobado sin usuario vinculado',
          })
          .eq('id', id)
          .select('*')
          .single()

        if (updateError) throw updateError
        updated = data
      }

      await logAdminAudit(serviceClient, {
        adminUserId: user.id,
        action: 'payment_deposit_approved',
        entityType: 'payment_deposit',
        entityId: id,
        beforeData: deposit,
        afterData: updated,
        reason: notes || 'Depósito aprobado',
      })

      return NextResponse.json({ ok: true, deposit: updated })
    }

    const nextStatus = action === 'reject' ? 'rejected' : 'cancelled'
    const { data: updated, error: updateError } = await serviceClient
      .from('payment_deposits')
      .update({
        status: nextStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: notes || (action === 'reject' ? 'Depósito rechazado' : 'Depósito cancelado'),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) throw updateError

    await logAdminAudit(serviceClient, {
      adminUserId: user.id,
      action: `payment_deposit_${nextStatus}`,
      entityType: 'payment_deposit',
      entityId: id,
      beforeData: deposit,
      afterData: updated,
      reason: notes || `Depósito ${nextStatus}`,
    })

    return NextResponse.json({ ok: true, deposit: updated })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'No se pudo revisar el depósito' }, { status: 500 })
  }
}
