import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/roles'
import { logAdminAudit } from '@/lib/admin/audit'
import { approveDeposit, rejectDepositAndCancelCards } from '@/lib/economy/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function cleanNotes(value: unknown) {
  const notes = String(value ?? '').trim().slice(0, 240)
  return notes || undefined
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user: adminUser, serviceClient, error } = await requireAdminApi()
  if (error) return error
  if (!adminUser || !serviceClient) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params
    if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Deposito invalido' }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    const action = String(body.action ?? '')
    const notes = cleanNotes(body.notes)

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Accion invalida' }, { status: 400 })
    }

    if (action === 'approve') {
      const { deposit, mode } = await approveDeposit(serviceClient, { depositId: id, adminUserId: adminUser.id, notes })
      await logAdminAudit(serviceClient, {
        adminUserId: adminUser.id,
        action: 'deposit_approved',
        entityType: 'payment_deposit',
        entityId: id,
        afterData: { status: 'approved', mode },
        reason: notes,
      })
      return NextResponse.json({ ok: true, deposit, mode })
    }

    const deposit = await rejectDepositAndCancelCards(serviceClient, { depositId: id, adminUserId: adminUser.id, notes })
    await logAdminAudit(serviceClient, {
      adminUserId: adminUser.id,
      action: 'deposit_rejected',
      entityType: 'payment_deposit',
      entityId: id,
      afterData: { status: 'rejected' },
      reason: notes,
    })
    return NextResponse.json({ ok: true, deposit })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'No se pudo procesar el deposito' }, { status: 500 })
  }
}
