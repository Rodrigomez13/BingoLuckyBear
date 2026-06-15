import { NextResponse } from 'next/server'
import { logAdminAudit } from '@/lib/admin/audit'
import { requireAdminApi } from '@/lib/auth/roles'
import { formatReceiptOcrError } from '@/lib/receipt-ocr'
import { documentIdentityKeys, normalizeOperationNumber, validateParsedReceipt } from '@/lib/receipt-validation'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ProfileRecord {
  id: string
  email: string | null
  dni: string | null
}

function identitiesMatch(left?: string | null, right?: string | null) {
  const leftKeys = documentIdentityKeys(left)
  const rightKeys = documentIdentityKeys(right)
  return leftKeys.some((key) => rightKeys.includes(key))
}

function apiError(message: string, status = 500, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status })
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { user, serviceClient, error } = await requireAdminApi()
  if (error) return error
  if (!user || !serviceClient) return apiError('No autorizado', 401)

  const { id } = await context.params
  const body = await request.json().catch(() => ({}))

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

    if (body.action === 'manual') {
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
    }

    if (!deposit.receipt_url) {
      return apiError('El depósito no tiene comprobante adjunto', 400)
    }

    const [{ data: accounts }, { data: currentProfile }, { data: profiles }, { data: otherDeposits }] = await Promise.all([
      serviceClient
        .from('payment_accounts')
        .select('alias, cbu, is_default')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(4),
      deposit.user_id
        ? serviceClient.from('customer_profiles').select('id, email, dni').eq('id', deposit.user_id).maybeSingle<ProfileRecord>()
        : Promise.resolve({ data: null }),
      serviceClient.from('customer_profiles').select('id, email, dni').not('dni', 'is', null).limit(500),
      serviceClient
        .from('payment_deposits')
        .select('id, payment_reference, receipt_operation_number, status')
        .neq('id', id)
        .limit(500),
    ])

    const destinationAccounts = (accounts ?? [])
      .flatMap((account) => [account.alias, account.cbu])
      .filter(Boolean)

    const [{ getPrivateReceiptFile }, { parseReceiptWithFreeOcr }] = await Promise.all([
      import('@/lib/receipt-file'),
      import('@/lib/receipt-ocr'),
    ])

    const file = await getPrivateReceiptFile(deposit.receipt_url)
    const parsed = await parseReceiptWithFreeOcr({
      ...file,
      expectedAmount: deposit.amount,
      expectedOperationNumber: deposit.payment_reference,
      expectedDestinationAccounts: destinationAccounts,
    })

    const profileRows = (profiles ?? []) as ProfileRecord[]
    const matchingProfiles = parsed.senderDocument
      ? profileRows.filter((profile) => identitiesMatch(parsed.senderDocument, profile.dni))
      : []
    const autoLinkedProfile = !deposit.user_id && matchingProfiles.length === 1 ? matchingProfiles[0] : null
    const expectedProfile = currentProfile ?? autoLinkedProfile
    const validation = validateParsedReceipt(parsed, {
      expectedAmount: deposit.amount,
      expectedOperationNumber: deposit.payment_reference,
      expectedDestinationAccounts: destinationAccounts,
      expectedSenderDocument: expectedProfile?.dni,
      submittedAt: deposit.created_at,
      maxAgeDays: 30,
    })

    const parsedOperation = normalizeOperationNumber(parsed.operationNumber)
    const duplicateDepositIds = parsedOperation
      ? (otherDeposits ?? [])
          .filter((row) => [row.receipt_operation_number, row.payment_reference]
            .some((value) => normalizeOperationNumber(value) === parsedOperation))
          .map((row) => row.id)
      : []
    const warnings = [...validation.warnings]

    if (matchingProfiles.length > 1) warnings.push('El documento coincide con más de un usuario. No se vinculó automáticamente.')
    if (duplicateDepositIds.length > 0) warnings.push('El número de operación ya aparece en otro depósito.')

    const reviewRecommendation = duplicateDepositIds.length > 0 || matchingProfiles.length > 1
      ? 'mismatch'
      : validation.reviewRecommendation
    const parsedAt = new Date().toISOString()
    const nextMetadata = {
      ...(deposit.metadata ?? {}),
      ocr: {
        source: parsed.source,
        confidence: parsed.confidence,
        senderDocument: parsed.senderDocument,
        senderName: parsed.senderName,
        warnings: [...new Set(warnings)],
        reviewRecommendation,
        amountMatches: validation.amountMatches,
        operationMatches: validation.operationMatches,
        destinationMatches: validation.destinationMatches,
        senderDocumentMatches: validation.senderDocumentMatches,
        dateIsPlausible: validation.dateIsPlausible,
        duplicateDepositIds,
        parsedBy: user.id,
        parsedAt,
        autoLinkedUserId: autoLinkedProfile?.id ?? null,
      },
    }

    const { data: updated, error: updateError } = await serviceClient
      .from('payment_deposits')
      .update({
        user_id: autoLinkedProfile?.id ?? deposit.user_id,
        customer_email: autoLinkedProfile?.email ?? deposit.customer_email,
        receipt_amount: parsed.amount,
        receipt_operation_number: parsed.operationNumber,
        receipt_destination_account: parsed.destinationAccount,
        receipt_date: parsed.date,
        receipt_raw_text: parsed.rawText?.slice(0, 12_000) ?? null,
        receipt_parse_status: 'parsed',
        receipt_parse_error: null,
        metadata: nextMetadata,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) throw updateError

    if (autoLinkedProfile) {
      const [{ error: purchaseError }, { error: cardError }] = await Promise.all([
        serviceClient.from('game_purchases').update({ user_id: autoLinkedProfile.id }).eq('deposit_id', id),
        serviceClient.from('bingo_cards').update({ user_id: autoLinkedProfile.id, customer_id: autoLinkedProfile.id }).eq('deposit_id', id),
      ])
      if (purchaseError) throw purchaseError
      if (cardError) throw cardError
    }

    await logAdminAudit(serviceClient, {
      adminUserId: user.id,
      action: 'payment_deposit_receipt_ocr',
      entityType: 'payment_deposit',
      entityId: id,
      beforeData: deposit,
      afterData: updated,
      reason: 'Lectura y validación OCR de comprobante',
      metadata: { reviewRecommendation, duplicateDepositIds, autoLinkedUserId: autoLinkedProfile?.id ?? null },
    })

    return NextResponse.json({
      ok: true,
      deposit: updated,
      parsed,
      validation: { ...validation, warnings: [...new Set(warnings)], reviewRecommendation },
    })
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : 'No se pudo leer el comprobante'
    const message = formatReceiptOcrError(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error('Admin deposit OCR failed:', { depositId: id, message: rawMessage, stack })

    const { data: current } = await serviceClient
      .from('payment_deposits')
      .select('metadata')
      .eq('id', id)
      .maybeSingle()

    await serviceClient
      .from('payment_deposits')
      .update({
        receipt_parse_status: 'failed',
        receipt_parse_error: message,
        metadata: {
          ...(current?.metadata ?? {}),
          ocr: {
            ...((current?.metadata as Record<string, Record<string, unknown>> | null)?.ocr ?? {}),
            reviewRecommendation: 'manual_review',
            parsedBy: user.id,
            parsedAt: new Date().toISOString(),
          },
        },
      })
      .eq('id', id)

    return apiError(message, 500, process.env.NODE_ENV === 'development' ? stack : undefined)
  }
}
