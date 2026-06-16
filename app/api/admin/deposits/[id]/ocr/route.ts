import { NextResponse } from 'next/server'
import { logAdminAudit } from '@/lib/admin/audit'
import { requireAdminApi } from '@/lib/auth/roles'
import { processDepositReceipt } from '@/lib/receipt-processing'

export const runtime = 'nodejs'
export const maxDuration = 60

function apiError(message: string, status = 500, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status })
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { user, serviceClient, error } = await requireAdminApi()
  if (error) return error
  if (!user || !serviceClient) return apiError('No autorizado', 401)

  const { id } = await context.params
  const body = await request.json().catch(() => ({}))

  if (!id) {
    return apiError('Falta el depósito', 400)
  }

  if (body.action === 'manual') {
    try {
      const { data: deposit, error: depositError } = await serviceClient
        .from('payment_deposits')
        .select('*')
        .eq('id', id)
        .single()

      if (depositError || !deposit) throw depositError ?? new Error('Depósito no encontrado')
      if (deposit.status !== 'pending') {
        return apiError('Solo se revisan comprobantes de depósitos pendientes', 409)
      }

      const reviewedAt = new Date().toISOString()
      const { data: updated, error: updateError } = await serviceClient
        .from('payment_deposits')
        .update({
          receipt_parse_status: 'manual',
          receipt_parse_error: null,
          metadata: {
            ...(deposit.metadata ?? {}),
            ocr: {
              ...((deposit.metadata as Record<string, Record<string, unknown>> | null)?.ocr ?? {}),
              reviewRecommendation: 'manual_review',
              manuallyReviewedBy: user.id,
              manuallyReviewedAt: reviewedAt,
            },
          },
        })
        .eq('id', id)
        .select('*')
        .single()

      if (updateError) throw updateError

      await logAdminAudit(serviceClient, {
        adminUserId: user.id,
        action: 'payment_deposit_receipt_manual_review',
        entityType: 'payment_deposit',
        entityId: id,
        beforeData: deposit,
        afterData: updated,
        reason: String(body.notes ?? '').trim().slice(0, 220) || 'Comprobante revisado manualmente',
      })

      return NextResponse.json({ ok: true, deposit: updated })
    } catch (err) {
      return apiError(err instanceof Error ? err.message : 'No se pudo marcar la revisión manual')
    }
  }

  const ocrText = typeof body.ocrText === 'string' ? body.ocrText.trim() : ''
  const ocrConfidence = Number(body.ocrConfidence)
  const preExtracted = ocrText.length >= 5
    ? { text: ocrText, confidence: Number.isFinite(ocrConfidence) ? ocrConfidence : null }
    : null

  const result = await processDepositReceipt(serviceClient, {
    depositId: id,
    actorUserId: user.id,
    autoApprove: true,
    preExtracted,
  })

  if (!result.ok) {
    return NextResponse.json({
      ok: false,
      error: result.error ?? 'No se pudo leer el comprobante',
      deposit: result.deposit,
      reviewRecommendation: 'manual_review',
    })
  }

  return NextResponse.json({
    ok: true,
    deposit: result.deposit,
    parsed: result.parsed,
    validation: result.validation,
    autoApproved: result.autoApproved,
    autoRejected: result.autoRejected,
  })
}
