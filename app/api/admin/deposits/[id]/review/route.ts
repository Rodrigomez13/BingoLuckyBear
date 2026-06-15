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
      const { data: purchases, error: purchasesError } = await serviceClient
        .from('game_purchases')
        .select('id')
        .eq('deposit_id', id)

      if (purchasesError) throw purchasesError
      const purchaseIds = (purchases ?? []).map((purchase) => purchase.id)

      if (purchaseIds.length > 0) {
        const reviewedAt = new Date().toISOString()
        const { data, error: updateError } = await serviceClient
          .from('payment_deposits')
          .update({
            status: 'approved',
            reviewed_by: user.id,
            reviewed_at: reviewedAt,
            review_notes: notes || 'Compra por comprobante aprobada',
          })
          .eq('id', id)
          .select('*')
          .single()

        if (updateError) throw updateError
        updated = data

        const { error: purchaseUpdateError } = await serviceClient
          .from('game_purchases')
          .update({ status: 'paid' })
          .in('id', purchaseIds)
        if (purchaseUpdateError) throw purchaseUpdateError

        const { error: cardsUpdateError } = await serviceClient
          .from('bingo_cards')
          .update({
            payment_status: 'approved',
            card_status: 'active',
            issued_at: reviewedAt,
            payment_reviewed_at: reviewedAt,
            payment_reviewed_by: user.id,
          })
          .eq('deposit_id', id)
        if (cardsUpdateError) throw cardsUpdateError
      } else if (deposit.user_id) {
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

    const cancelledPurchaseStatus = 'cancelled'
    const { error: purchaseUpdateError } = await serviceClient
      .from('game_purchases')
      .update({ status: cancelledPurchaseStatus })
      .eq('deposit_id', id)
    if (purchaseUpdateError) throw purchaseUpdateError

    const { error: cardsUpdateError } = await serviceClient
      .from('bingo_cards')
      .update({
        payment_status: 'rejected',
        card_status: 'cancelled',
        payment_reviewed_at: new Date().toISOString(),
        payment_reviewed_by: user.id,
      })
      .eq('deposit_id', id)
    if (cardsUpdateError) throw cardsUpdateError

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
