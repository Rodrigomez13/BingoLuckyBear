import type { SupabaseClient } from '@supabase/supabase-js'
import { logAdminAudit } from '@/lib/admin/audit'
import { finalizeDepositApproval, finalizeDepositRejection } from '@/lib/economy/server'
import { getPrivateReceiptFile } from '@/lib/receipt-file'
import { parseReceiptWithFreeOcr } from '@/lib/receipt-ocr-fast'
import { formatReceiptOcrError, parseReceiptText } from '@/lib/receipt-ocr'
import {
  type ParsedReceiptData,
  documentIdentityKeys,
  normalizeOperationNumber,
  validateParsedReceipt,
} from '@/lib/receipt-validation'

interface ProfileRecord {
  id: string
  email: string | null
  dni: string | null
}

export interface ProcessReceiptResult {
  ok: boolean
  deposit: Record<string, unknown> | null
  parsed?: ParsedReceiptData
  validation?: ReturnType<typeof validateParsedReceipt> & { reviewRecommendation: string }
  autoApproved?: boolean
  autoRejected?: boolean
  error?: string
}

export interface ClientReceiptOcrEvidence {
  rawText?: string | null
  confidence?: number | null
  source?: 'browser_ocr' | string | null
}

function identitiesMatch(left?: string | null, right?: string | null) {
  const leftKeys = documentIdentityKeys(left)
  const rightKeys = documentIdentityKeys(right)
  return leftKeys.some((key) => rightKeys.includes(key))
}

/**
 * Reads a deposit's receipt with the free local OCR engine, validates it against
 * the declared data, links the sender by DNI when possible and then either:
 * - auto-approves when every key field matches with high confidence.
 * - auto-rejects when there is a hard invalid signal (duplicate operation,
 *   amount/destination/document mismatch or implausible date).
 *
 * `actorUserId` is the admin that triggered it, or `null` for an automatic
 * (system) run fired when the customer uploads the receipt.
 */
export async function processDepositReceipt(
  serviceClient: SupabaseClient,
  options: {
    depositId: string
    actorUserId: string | null
    autoApprove?: boolean
    autoReject?: boolean
    clientOcr?: ClientReceiptOcrEvidence | null
  },
): Promise<ProcessReceiptResult> {
  const { depositId, actorUserId } = options
  const autoApprove = options.autoApprove ?? true
  const autoReject = options.autoReject ?? true

  const { data: deposit, error: depositError } = await serviceClient
    .from('payment_deposits')
    .select('*')
    .eq('id', depositId)
    .single()

  if (depositError || !deposit) {
    return { ok: false, deposit: null, error: 'Depósito no encontrado' }
  }
  if (deposit.status !== 'pending') {
    return { ok: false, deposit, error: 'Solo se revisan comprobantes de depósitos pendientes' }
  }
  if (!deposit.receipt_url) {
    return { ok: false, deposit, error: 'El depósito no tiene comprobante adjunto' }
  }

  try {
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
        .neq('id', depositId)
        .in('status', ['pending', 'approved'])
        .limit(500),
    ])

    const destinationAccounts = (accounts ?? [])
      .flatMap((account) => [account.alias, account.cbu])
      .filter(Boolean)

    const receiptInput = {
      expectedAmount: deposit.amount,
      expectedOperationNumber: deposit.payment_reference,
      expectedDestinationAccounts: destinationAccounts,
    }
    const clientRawText = typeof options.clientOcr?.rawText === 'string'
      ? options.clientOcr.rawText.trim().slice(0, 12_000)
      : ''
    const clientConfidence = typeof options.clientOcr?.confidence === 'number' && Number.isFinite(options.clientOcr.confidence)
      ? Math.max(0, Math.min(1, options.clientOcr.confidence))
      : null
    const hasClientOcr = clientRawText.length >= 25
    let parsed: ParsedReceiptData
    if (hasClientOcr) {
      const browserParsed = parseReceiptText(clientRawText, receiptInput, { confidence: clientConfidence, source: 'browser_ocr' })
      parsed = {
        ...browserParsed,
        warnings: [
          ...browserParsed.warnings,
          'Lectura generada en el navegador del cliente; requiere validación administrativa antes de acreditar.',
        ],
      }
    } else {
      const file = await getPrivateReceiptFile(deposit.receipt_url)
      parsed = await parseReceiptWithFreeOcr({
        ...file,
        ...receiptInput,
      })
    }
    const evidenceIsClientOnly = parsed.source === 'browser_ocr'

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

    const operationKeys = [...new Set([parsed.operationNumber, deposit.payment_reference]
      .map((value) => normalizeOperationNumber(value))
      .filter((value) => value.length >= 4))]
    const duplicateDepositIds = operationKeys.length
      ? (otherDeposits ?? [])
          .filter((row) => [row.receipt_operation_number, row.payment_reference]
            .some((value) => operationKeys.includes(normalizeOperationNumber(value))))
          .map((row) => row.id)
      : []
    const warnings = [...validation.warnings]

    if (matchingProfiles.length > 1) warnings.push('El documento coincide con más de un usuario. No se vinculó automáticamente.')
    if (duplicateDepositIds.length > 0) warnings.push('El número de operación ya aparece en otro depósito.')

    const hardRejectReasons = [
      duplicateDepositIds.length > 0 ? 'El número de operación ya fue usado en otro depósito pendiente o aprobado.' : null,
      validation.amountMatches === false ? 'El monto detectado no coincide con el monto informado.' : null,
      validation.operationMatches === false ? 'El número de operación detectado no coincide con el informado.' : null,
      validation.destinationMatches === false ? 'La cuenta destino no coincide con una cuenta de cobro configurada.' : null,
      validation.senderDocumentMatches === false ? 'El documento del emisor no coincide con el DNI del usuario vinculado.' : null,
      validation.dateIsPlausible === false ? 'La fecha detectada es futura o demasiado anterior a la solicitud.' : null,
    ].filter((reason): reason is string => Boolean(reason))

    const reviewRecommendation = duplicateDepositIds.length > 0 || matchingProfiles.length > 1 || hardRejectReasons.length > 0
      ? 'mismatch'
      : validation.reviewRecommendation

    const finalUserId = autoLinkedProfile?.id ?? deposit.user_id ?? null

    // Auto-approve only when every key signal lines up with high confidence.
    const autoApproveEligible = autoApprove
      && !evidenceIsClientOnly
      && reviewRecommendation === 'ready_for_review'
      && duplicateDepositIds.length === 0
      && matchingProfiles.length <= 1
      && Boolean(finalUserId)
      && validation.amountMatches === true
      && validation.operationMatches === true
      && validation.destinationMatches !== false
      && validation.senderDocumentMatches !== false
      && validation.dateIsPlausible !== false

    // Browser OCR is assistive text provided by the client. It can speed up
    // review, but it is not trusted enough to auto-credit money.
    const browserSafeAutoRejectReasons = evidenceIsClientOnly
      ? hardRejectReasons.filter((reason) => /operaci[oó]n ya fue usado/i.test(reason))
      : hardRejectReasons
    const autoRejectEligible = autoReject && !autoApproveEligible && browserSafeAutoRejectReasons.length > 0

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
        hardRejectReasons,
        parsedBy: actorUserId,
        parsedAt,
        autoLinkedUserId: autoLinkedProfile?.id ?? null,
        autoApproved: false,
        autoRejected: false,
        engine: evidenceIsClientOnly ? 'browser_ocr' : 'free_ocr',
        evidenceTrust: evidenceIsClientOnly ? 'assistive_client_text' : 'server_extracted_text',
        serverAutoApprovalAllowed: !evidenceIsClientOnly,
      },
    }

    const { data: updated, error: updateError } = await serviceClient
      .from('payment_deposits')
      .update({
        user_id: finalUserId,
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
      .eq('id', depositId)
      .select('*')
      .single()

    if (updateError) throw updateError

    if (autoLinkedProfile) {
      const [{ error: purchaseError }, { error: cardError }] = await Promise.all([
        serviceClient.from('game_purchases').update({ user_id: autoLinkedProfile.id }).eq('deposit_id', depositId),
        serviceClient.from('bingo_cards').update({ user_id: autoLinkedProfile.id, customer_id: autoLinkedProfile.id }).eq('deposit_id', depositId),
      ])
      if (purchaseError) throw purchaseError
      if (cardError) throw cardError
    }

    if (actorUserId) {
      await logAdminAudit(serviceClient, {
        adminUserId: actorUserId,
        action: 'payment_deposit_receipt_ocr',
        entityType: 'payment_deposit',
        entityId: depositId,
        beforeData: deposit,
        afterData: updated,
        reason: 'Lectura y validación OCR de comprobante',
        metadata: { reviewRecommendation, duplicateDepositIds, autoLinkedUserId: autoLinkedProfile?.id ?? null },
      })
    }

    let finalDeposit = updated
    let autoApproved = false
    let autoRejected = false

    if (autoApproveEligible) {
      const approvalNotes = 'Aprobado automáticamente por validación OCR del comprobante'
      const approved = await finalizeDepositApproval(serviceClient, {
        depositId,
        adminUserId: actorUserId,
        notes: approvalNotes,
      })
      autoApproved = approved.status === 'approved'

      if (autoApproved) {
        const { data: stamped } = await serviceClient
          .from('payment_deposits')
          .update({
            metadata: {
              ...(approved.metadata ?? nextMetadata),
              ocr: {
                ...nextMetadata.ocr,
                ...((approved.metadata as Record<string, Record<string, unknown>> | null)?.ocr ?? {}),
                autoApproved: true,
                autoApprovedAt: new Date().toISOString(),
              },
            },
          })
          .eq('id', depositId)
          .select('*')
          .single()
        finalDeposit = stamped ?? approved

        if (actorUserId) {
          await logAdminAudit(serviceClient, {
            adminUserId: actorUserId,
            action: 'payment_deposit_auto_approved',
            entityType: 'payment_deposit',
            entityId: depositId,
            beforeData: updated,
            afterData: finalDeposit,
            reason: approvalNotes,
          })
        }
      }
    } else if (autoRejectEligible) {
      const rejectionNotes = `Rechazado automáticamente por el lector OCR: ${browserSafeAutoRejectReasons.join('; ')}.`
      const rejected = await finalizeDepositRejection(serviceClient, {
        depositId,
        adminUserId: actorUserId,
        notes: rejectionNotes,
      })
      autoRejected = rejected.status === 'rejected'

      if (autoRejected) {
        const { data: stamped } = await serviceClient
          .from('payment_deposits')
          .update({
            metadata: {
              ...(rejected.metadata ?? nextMetadata),
              ocr: {
                ...nextMetadata.ocr,
                ...((rejected.metadata as Record<string, Record<string, unknown>> | null)?.ocr ?? {}),
                autoRejected: true,
                autoRejectedAt: new Date().toISOString(),
                autoRejectReasons: browserSafeAutoRejectReasons,
              },
            },
          })
          .eq('id', depositId)
          .select('*')
          .single()
        finalDeposit = stamped ?? rejected

        if (actorUserId) {
          await logAdminAudit(serviceClient, {
            adminUserId: actorUserId,
            action: 'payment_deposit_auto_rejected',
            entityType: 'payment_deposit',
            entityId: depositId,
            beforeData: updated,
            afterData: finalDeposit,
            reason: rejectionNotes,
          })
        }
      }
    }

    return {
      ok: true,
      deposit: finalDeposit,
      parsed,
      validation: { ...validation, warnings: [...new Set(warnings)], reviewRecommendation },
      autoApproved,
      autoRejected,
    }
  } catch (err) {
    const message = formatReceiptOcrError(err)
    const rawMessage = err instanceof Error ? err.message : String(err)
    console.error('[v0] Deposit receipt processing failed:', { depositId, message: rawMessage })

    const { data: current } = await serviceClient
      .from('payment_deposits')
      .select('metadata')
      .eq('id', depositId)
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
            parsedBy: actorUserId,
            parsedAt: new Date().toISOString(),
            engine: 'free_ocr',
          },
        },
      })
      .eq('id', depositId)

    return { ok: false, deposit, error: message }
  }
}
