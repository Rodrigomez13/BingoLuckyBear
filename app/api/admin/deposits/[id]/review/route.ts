import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/roles'
import { logAdminAudit } from '@/lib/admin/audit'
import { approveDepositAndCreditWallet, finalizeDepositRejection } from '@/lib/economy/server'

function cleanNote(value: unknown) {
  return String(value ?? '').trim().slice(0, 220)
}

function isReviewAction(value: unknown): value is 'approve' | 'reject' | 'cancel' {
  return value === 'approve' || value === 'reject' || value === 'cancel'
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { user, serviceClient, error } = await requireAdminApi()
  if (error) return error
  if (!user || !serviceClient) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const action = body.action
    const notes = cleanNote(body.notes)
    const targetUserId = String(body.target_user_id ?? '').trim()

    if (!id) return NextResponse.json({ error: 'Falta el depósito' }, { status: 400 })
    if (!isReviewAction(action)) return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })

    const { data: depositRow, error: readError } = await serviceClient
      .from('payment_deposits')
      .select('*')
      .eq('id', id)
      .single()

    if (readError || !depositRow) throw readError ?? new Error('Depósito no encontrado')
    let deposit = depositRow
    const originalDeposit = depositRow
    if (deposit.status !== 'pending') {
      return NextResponse.json({ error: 'Solo se pueden revisar depósitos pendientes' }, { status: 409 })
    }

    if (action === 'approve') {
      const ocrMetadata = deposit.metadata && typeof deposit.metadata.ocr === 'object'
        ? deposit.metadata.ocr as Record<string, unknown>
        : null
      const receiptWasReviewed = deposit.receipt_parse_status === 'manual'
        || (deposit.receipt_parse_status === 'parsed' && ocrMetadata?.reviewRecommendation === 'ready_for_review')

      if (deposit.receipt_url && !receiptWasReviewed) {
        return NextResponse.json(
          { error: 'Leé el comprobante con OCR o marcá una revisión manual antes de aprobar' },
          { status: 409 },
        )
      }

      if (!deposit.user_id && targetUserId) {
        if (!UUID_RE.test(targetUserId)) return NextResponse.json({ error: 'Usuario destino inválido' }, { status: 400 })
        const [{ data: targetAuth }, { data: targetProfile }] = await Promise.all([
          serviceClient.auth.admin.getUserById(targetUserId),
          serviceClient.from('customer_profiles').select('id, email, dni').eq('id', targetUserId).maybeSingle(),
        ])
        if (!targetAuth.user) return NextResponse.json({ error: 'Usuario destino no encontrado' }, { status: 404 })

        const { data: linkedDeposit, error: linkError } = await serviceClient
          .from('payment_deposits')
          .update({
            user_id: targetUserId,
            customer_email: targetProfile?.email ?? targetAuth.user.email?.toLowerCase() ?? deposit.customer_email,
            metadata: {
              ...(deposit.metadata ?? {}),
              linkedByAdmin: user.id,
              linkedFromUserList: true,
              linkedProfileDni: targetProfile?.dni ?? null,
            },
          })
          .eq('id', id)
          .eq('status', 'pending')
          .select('*')
          .single()

        if (linkError) throw linkError
        deposit = linkedDeposit

        const [{ error: purchaseLinkError }, { error: cardLinkError }] = await Promise.all([
          serviceClient.from('game_purchases').update({ user_id: targetUserId }).eq('deposit_id', id),
          serviceClient.from('bingo_cards').update({ user_id: targetUserId, customer_id: targetUserId }).eq('deposit_id', id),
        ])
        if (purchaseLinkError) throw purchaseLinkError
        if (cardLinkError) throw cardLinkError
      }

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
        beforeData: originalDeposit,
        afterData: updated,
        reason: notes || 'Depósito aprobado',
        metadata: deposit.user_id !== originalDeposit.user_id
          ? { linkedUserId: deposit.user_id, previousUserId: originalDeposit.user_id }
          : undefined,
      })

      return NextResponse.json({ ok: true, deposit: updated })
    }

    const nextStatus = action === 'reject' ? 'rejected' : 'cancelled'
    const updated = await finalizeDepositRejection(serviceClient, {
      depositId: id,
      adminUserId: user.id,
      status: nextStatus,
      notes: notes || (action === 'reject' ? 'Depósito rechazado' : 'Depósito cancelado'),
    })

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
