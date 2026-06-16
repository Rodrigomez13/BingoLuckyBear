import type { SupabaseClient } from '@supabase/supabase-js'
import { logAdminAudit } from '@/lib/admin/audit'
import { finalizeDepositApproval } from '@/lib/economy/server'
import { getPrivateReceiptFile } from '@/lib/receipt-file'
import { parseReceiptWithAi } from '@/lib/receipt-ai'
import { formatReceiptOcrError } from '@/lib/receipt-ocr'
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
  error?: string
}

function identitiesMatch(left?: string | null, right?: string | null) {
  const leftKeys = documentIdentityKeys(left)
  const rightKeys = documentIdentityKeys(right)
  return leftKeys.some((key) => rightKeys.includes(key))
}

/**
 * Reads a deposit's receipt with AI vision, validates it against the declared
 * data, links the sender by DNI when possible and — when every key field matches
 * with high confidence — automatically approves the deposit and credits the wallet.
 *
 * `actorUserId` is the admin that triggered it, or `null` for an automatic
 * (system) run fired when the customer uploads the receipt.
 */
export async function processDepositReceipt(
  serviceClient: SupabaseClient,
  options: { depositId: string; actorUserId: string | null; autoApprove?: boolean },
): Promise<ProcessReceiptResult> {
  const { depositId, actorUserId } = options
  const autoApprove = options.autoApprove ?? true

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
        .limit(500),
    ])

    const destinationAccounts = (accounts ?? [])
      .flatMap((account) => [account.alias, account.cbu])
      .filter(Boolean)

    const file = await getPrivateReceiptFile(deposit.receipt_url)
    const parsed = await parseReceiptWithAi({
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

    const finalUserId = autoLinkedProfile?.id ?? deposit.user_id ?? null

    // Auto-approve only when every key signal lines up with high confidence.
    const autoApproveEligible = autoApprove
      && reviewRecommendation === 'ready_for_review'
      && duplicateDepositIds.length === 0
      && matchingProfiles.length <= 1
      && Boolean(finalUserId)
      && validation.amountMatches === true
      && validation.operationMatches === true
      && validation.destinationMatches !== false
      && validation.senderDocumentMatches !== false
      && validation.dateIsPlausible !== false

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
        parsedBy: actorUserId,
        parsedAt,
        autoLinkedUserId: autoLinkedProfile?.id ?? null,
        autoApproved: false,
        engine: 'ai_vision',
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
        reason: 'Lectura y validación IA de comprobante',
        metadata: { reviewRecommendation, duplicateDepositIds, autoLinkedUserId: autoLinkedProfile?.id ?? null },
      })
    }

    let finalDeposit = updated
    let autoApproved = false

    if (autoApproveEligible) {
      const approvalNotes = 'Aprobado automáticamente por validación IA del comprobante'
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
    }

    return {
      ok: true,
      deposit: finalDeposit,
      parsed,
      validation: { ...validation, warnings: [...new Set(warnings)], reviewRecommendation },
      autoApproved,
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
            engine: 'ai_vision',
          },
        },
      })
      .eq('id', depositId)

    return { ok: false, deposit, error: message }
  }
}
