import type { SupabaseClient } from '@supabase/supabase-js'

export type DepositAuditRisk = 'low' | 'medium' | 'high'

export interface DepositAuditItem {
  id: string
  amount: number
  currency: string
  paymentMethod: string | null
  paymentReference: string | null
  receiptUrl: string | null
  status: string
  createdAt: string
  reviewedAt: string | null
  parseStatus: string | null
  reviewRecommendation: string | null
  confidence: number | null
  autoApproved: boolean
  autoRejected: boolean
  amountMatches: boolean | null
  operationMatches: boolean | null
  destinationMatches: boolean | null
  senderDocumentMatches: boolean | null
  senderName: string | null
  senderDocument: string | null
  risk: DepositAuditRisk
  flags: string[]
}

export interface WithdrawalDepositAudit {
  deposits: DepositAuditItem[]
  summary: {
    approvedCount: number
    approvedAmount: number
    riskCounts: Record<DepositAuditRisk, number>
    highestRisk: DepositAuditRisk
    needsManualCheck: boolean
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function asBoolOrNull(value: unknown): boolean | null {
  return value === true ? true : value === false ? false : null
}

/**
 * Builds the reinforced manual-verification checklist for a withdrawal: it
 * gathers every APPROVED deposit that funded the player's balance and scores
 * each one so the admin can confirm against the real homebanking before paying.
 *
 * The superficial OCR filter at deposit time is intentionally lenient; this is
 * where the money trail is actually scrutinized.
 */
export async function buildWithdrawalDepositAudit(
  serviceClient: SupabaseClient,
  userId: string,
): Promise<WithdrawalDepositAudit> {
  const { data, error } = await serviceClient
    .from('payment_deposits')
    .select('id, amount, currency, payment_method, payment_reference, receipt_url, status, receipt_parse_status, created_at, reviewed_at, metadata')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw error

  const deposits: DepositAuditItem[] = (data ?? []).map((row) => {
    const ocr = asRecord(asRecord(row.metadata).ocr)
    const amountMatches = asBoolOrNull(ocr.amountMatches)
    const operationMatches = asBoolOrNull(ocr.operationMatches)
    const destinationMatches = asBoolOrNull(ocr.destinationMatches)
    const senderDocumentMatches = asBoolOrNull(ocr.senderDocumentMatches)
    const confidence = typeof ocr.confidence === 'number' ? ocr.confidence : null
    const reviewRecommendation = typeof ocr.reviewRecommendation === 'string' ? ocr.reviewRecommendation : null
    const autoApproved = ocr.autoApproved === true
    const parseStatus = typeof row.receipt_parse_status === 'string' ? row.receipt_parse_status : null

    const flags: string[] = []
    if (amountMatches === false) flags.push('El monto leído no coincidía con el informado')
    if (operationMatches === false) flags.push('El número de operación no coincidía')
    if (destinationMatches === false) flags.push('La cuenta destino no era una cuenta de cobro válida')
    if (senderDocumentMatches === false) flags.push('El documento del emisor no coincidía con el jugador')
    if (row.receipt_url && !parseStatus) flags.push('El comprobante nunca pasó por el lector OCR')
    if (parseStatus === 'manual') flags.push('Aprobado por revisión manual, sin validación automática')
    if (parseStatus === 'failed') flags.push('El lector OCR falló al leer el comprobante')
    if (confidence !== null && confidence < 0.62) flags.push('Lectura automática de baja confianza')
    if (destinationMatches === null && row.receipt_url) flags.push('No se confirmó la cuenta destino')

    const hasHardMismatch = [amountMatches, operationMatches, destinationMatches, senderDocumentMatches].some((v) => v === false)
    const risk: DepositAuditRisk = hasHardMismatch || reviewRecommendation === 'mismatch'
      ? 'high'
      : autoApproved && amountMatches === true && operationMatches === true && destinationMatches !== false
        ? 'low'
        : flags.length > 0 || reviewRecommendation === 'manual_review'
          ? 'medium'
          : 'low'

    return {
      id: row.id as string,
      amount: Number(row.amount),
      currency: (row.currency as string) || 'ARS',
      paymentMethod: (row.payment_method as string) ?? null,
      paymentReference: (row.payment_reference as string) ?? null,
      receiptUrl: (row.receipt_url as string) ?? null,
      status: row.status as string,
      createdAt: row.created_at as string,
      reviewedAt: (row.reviewed_at as string) ?? null,
      parseStatus,
      reviewRecommendation,
      confidence,
      autoApproved,
      autoRejected: ocr.autoRejected === true,
      amountMatches,
      operationMatches,
      destinationMatches,
      senderDocumentMatches,
      senderName: typeof ocr.senderName === 'string' ? ocr.senderName : null,
      senderDocument: typeof ocr.senderDocument === 'string' ? ocr.senderDocument : null,
      risk,
      flags,
    }
  })

  const riskCounts: Record<DepositAuditRisk, number> = { low: 0, medium: 0, high: 0 }
  for (const deposit of deposits) riskCounts[deposit.risk] += 1
  const highestRisk: DepositAuditRisk = riskCounts.high > 0 ? 'high' : riskCounts.medium > 0 ? 'medium' : 'low'

  return {
    deposits,
    summary: {
      approvedCount: deposits.length,
      approvedAmount: deposits.reduce((sum, deposit) => sum + deposit.amount, 0),
      riskCounts,
      highestRisk,
      needsManualCheck: riskCounts.high > 0 || riskCounts.medium > 0,
    },
  }
}
