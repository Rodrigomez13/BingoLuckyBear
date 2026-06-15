import { NextResponse } from 'next/server'
import { createPaymentDeposit } from '@/lib/economy/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ensurePlayerAccount } from '@/lib/wallet/server'

const MAX_AMOUNT = 100_000_000

function cleanText(value: unknown, max = 180) {
  return String(value ?? '').trim().slice(0, max)
}

function parseAmount(value: unknown) {
  const amount = Math.trunc(Number(value))
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    throw new Error('Ingresá un monto válido')
  }
  return amount
}

async function getAuthenticatedUser() {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  return user
}

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({
      user: null,
      paymentAccount: null,
      payoutProfile: null,
      deposits: [],
      withdrawals: [],
    })
  }

  try {
    const serviceClient = await createServiceClient()
    await ensurePlayerAccount(serviceClient, user)

    const [accountResult, profileResult, depositsResult, withdrawalsResult] = await Promise.all([
      serviceClient
        .from('payment_accounts')
        .select('id, name, holder, alias, cbu, bank, concept, note, is_default')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      serviceClient
        .from('customer_profiles')
        .select('payout_account_kind, payout_account, payout_holder_name')
        .eq('id', user.id)
        .maybeSingle(),
      serviceClient
        .from('payment_deposits')
        .select('id, amount, currency, payment_method, payment_reference, receipt_url, status, review_notes, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(12),
      serviceClient
        .from('payment_withdrawals')
        .select('id, amount, currency, payout_account_kind, payout_account, payout_holder_name, status, review_notes, settlement_reference, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(12),
    ])

    if (profileResult.error) throw profileResult.error
    if (depositsResult.error) throw depositsResult.error
    if (withdrawalsResult.error) throw withdrawalsResult.error

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      paymentAccount: accountResult.data ?? null,
      payoutProfile: profileResult.data ?? null,
      deposits: depositsResult.data ?? [],
      withdrawals: withdrawalsResult.data ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudieron cargar las solicitudes de saldo' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const action = cleanText(body.action, 24)
    const serviceClient = await createServiceClient()
    await ensurePlayerAccount(serviceClient, user)

    if (action === 'deposit') {
      const amount = parseAmount(body.amount)
      const paymentMethod = cleanText(body.payment_method, 80)
      const paymentReference = cleanText(body.payment_reference, 100)
      const receiptUrl = cleanText(body.receipt_url, 600)

      if (!paymentMethod || !paymentReference || !receiptUrl) {
        return NextResponse.json(
          { error: 'Completá método, número de operación y comprobante' },
          { status: 400 },
        )
      }

      const deposit = await createPaymentDeposit(serviceClient, {
        userId: user.id,
        customerEmail: user.email,
        amount,
        walletKind: 'cash_credits',
        paymentMethod,
        paymentReference,
        receiptUrl,
        receiptAmount: amount,
        metadata: { source: 'player_balance_request' },
      })

      return NextResponse.json({ ok: true, deposit })
    }

    if (action === 'withdrawal') {
      const amount = parseAmount(body.amount)
      const { data: profile, error: profileError } = await serviceClient
        .from('customer_profiles')
        .select('payout_account_kind, payout_account, payout_holder_name')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) throw profileError
      if (!profile?.payout_account_kind || !profile.payout_account || !profile.payout_holder_name) {
        return NextResponse.json(
          { error: 'Completá Alias/CBU/CVU y titular en Mi Cuenta antes de retirar' },
          { status: 400 },
        )
      }

      const { data, error } = await serviceClient.rpc('lbb_request_withdrawal', {
        p_user_id: user.id,
        p_amount: amount,
        p_payout_account_kind: profile.payout_account_kind,
        p_payout_account: profile.payout_account,
        p_payout_holder_name: profile.payout_holder_name,
        p_metadata: { source: 'player_balance_request' },
      })

      if (error) throw error
      return NextResponse.json({ ok: true, withdrawal: data })
    }

    if (action === 'cancel_withdrawal') {
      const withdrawalId = cleanText(body.withdrawal_id, 60)
      if (!withdrawalId) return NextResponse.json({ error: 'Falta el retiro' }, { status: 400 })

      const { data, error } = await serviceClient.rpc('lbb_cancel_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_user_id: user.id,
      })

      if (error) throw error
      return NextResponse.json({ ok: true, withdrawal: data })
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo procesar la solicitud'
    const status = /saldo insuficiente/i.test(message) ? 409 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
