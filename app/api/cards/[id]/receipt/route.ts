import { type NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { formatReceiptOcrError, parseReceiptWithFreeOcr } from '@/lib/receipt-ocr'
import { validateParsedReceipt, type PaymentStatus } from '@/lib/receipt-validation'
import { getPrivateReceiptFile } from '@/lib/receipt-file'

interface PaymentAccountRecord {
  alias?: string | null
  cbu?: string | null
}

interface RaffleRecord {
  id: string
  admin_id: string
  amount?: string | null
  payment_account_id?: string | null
}

interface BingoCardRecord {
  id: string
  raffle_id: string
  payment_receipt_url: string
  payment_reference?: string | null
}

export const runtime = 'nodejs'
export const maxDuration = 60

async function ensureAdminOwnsCard(cardId: string, userId: string) {
  const supabase = await createServiceClient()
  const { data: card, error: cardError } = await supabase
    .from('bingo_cards')
    .select('id, raffle_id, payment_receipt_url, payment_reference')
    .eq('id', cardId)
    .single<BingoCardRecord>()

  if (cardError || !card) {
    return { error: NextResponse.json({ error: 'Carton no encontrado' }, { status: 404 }) }
  }

  const { data: raffle, error: raffleError } = await supabase
    .from('raffles')
    .select('id, admin_id, amount, payment_account_id')
    .eq('id', card.raffle_id)
    .single<RaffleRecord>()

  if (raffleError || !raffle || raffle.admin_id !== userId) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) }
  }

  let paymentAccount: PaymentAccountRecord | null = null

  if (raffle.payment_account_id) {
    const { data } = await supabase
      .from('payment_accounts')
      .select('alias, cbu')
      .eq('id', raffle.payment_account_id)
      .maybeSingle<PaymentAccountRecord>()
    paymentAccount = data ?? null
  }

  return { supabase, card, raffle, paymentAccount }
}

async function getAuthenticatedUser() {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  return user
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const access = await ensureAdminOwnsCard(id, user.id)
  if (access.error) return access.error

  const body = await request.json()
  const paymentStatus = String(body.payment_status ?? '').trim() as PaymentStatus

  if (!['pending', 'approved', 'rejected'].includes(paymentStatus)) {
    return NextResponse.json({ error: 'Estado invalido' }, { status: 400 })
  }

  const receiptAmount = body.receipt_amount === '' || body.receipt_amount === null || body.receipt_amount === undefined
    ? null
    : Number(body.receipt_amount)

  if (receiptAmount !== null && !Number.isFinite(receiptAmount)) {
    return NextResponse.json({ error: 'Monto invalido' }, { status: 400 })
  }

  const { data, error } = await access.supabase
    .from('bingo_cards')
    .update({
      payment_status: paymentStatus,
      card_status: paymentStatus === 'approved' ? 'active' : paymentStatus === 'rejected' ? 'cancelled' : 'reserved',
      issued_at: paymentStatus === 'approved' ? new Date().toISOString() : null,
      receipt_amount: receiptAmount,
      receipt_operation_number: String(body.receipt_operation_number ?? '').trim() || null,
      receipt_destination_account: String(body.receipt_destination_account ?? '').trim() || null,
      receipt_date: String(body.receipt_date ?? '').trim() || null,
      receipt_validation_notes: String(body.receipt_validation_notes ?? '').trim() || null,
      payment_reviewed_at: new Date().toISOString(),
      payment_reviewed_by: user.id,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ card: data })
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const access = await ensureAdminOwnsCard(id, user.id)
  if (access.error) return access.error

  try {
    const file = await getPrivateReceiptFile(access.card.payment_receipt_url)
    const parsed = await parseReceiptWithFreeOcr({
      ...file,
      expectedAmount: access.raffle.amount,
      expectedOperationNumber: access.card.payment_reference,
      expectedDestinationAccounts: [access.paymentAccount?.alias, access.paymentAccount?.cbu],
    })

    const validation = validateParsedReceipt(parsed, {
      expectedAmount: access.raffle.amount,
      expectedOperationNumber: access.card.payment_reference,
      expectedDestinationAccounts: [access.paymentAccount?.alias, access.paymentAccount?.cbu],
    })

    const { data, error } = await access.supabase
      .from('bingo_cards')
      .update({
        payment_status: 'pending',
        card_status: 'reserved',
        issued_at: null,
        receipt_amount: parsed.amount,
        receipt_operation_number: parsed.operationNumber,
        receipt_destination_account: parsed.destinationAccount,
        receipt_date: parsed.date,
        receipt_raw_text: parsed.rawText,
        receipt_parse_status: 'parsed',
        receipt_parse_error: null,
        receipt_validation_notes: validation.warnings.join('\n') || null,
        receipt_parsed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ card: data, validation })
  } catch (error) {
    const message = formatReceiptOcrError(error, 'No se pudo parsear el comprobante')
    const { data } = await access.supabase
      .from('bingo_cards')
      .update({
        receipt_parse_status: 'failed',
        receipt_parse_error: message,
        receipt_parsed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    return NextResponse.json({ error: message, card: data }, { status: 500 })
  }
}
