import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/roles'
import { logAdminAudit } from '@/lib/admin/audit'
import { applyWalletTransaction, ensurePlayerAccount, type WalletKind } from '@/lib/wallet/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isWalletKind(value: unknown): value is WalletKind {
  return value === 'bonus_points' || value === 'cash_credits'
}

function cleanReason(value: unknown) {
  return String(value ?? '').trim().slice(0, 180)
}

async function resolveTargetUser(serviceClient: NonNullable<Awaited<ReturnType<typeof requireAdminApi>>['serviceClient']>, identifier: string) {
  const value = identifier.trim().toLowerCase()

  if (UUID_RE.test(value)) {
    const { data, error } = await serviceClient.auth.admin.getUserById(value)
    if (error || !data.user) throw new Error('Usuario no encontrado')
    return data.user
  }

  const { data: profile, error } = await serviceClient
    .from('customer_profiles')
    .select('id, email')
    .eq('email', value)
    .maybeSingle<{ id: string; email: string | null }>()

  if (error) throw error
  if (!profile?.id) throw new Error('Usuario no encontrado. Primero debe iniciar sesión o estar registrado.')

  const { data, error: userError } = await serviceClient.auth.admin.getUserById(profile.id)
  if (userError || !data.user) throw new Error('Usuario no encontrado')
  return data.user
}

export async function POST(request: Request) {
  const { user: adminUser, serviceClient, error } = await requireAdminApi()
  if (error) return error
  if (!adminUser || !serviceClient) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json().catch(() => ({}))
    const identifier = String(body.identifier ?? '').trim()
    const walletKind = body.wallet_kind
    const direction = String(body.direction ?? '')
    const amount = Math.trunc(Number(body.amount ?? 0))
    const reason = cleanReason(body.reason)

    if (!identifier) return NextResponse.json({ error: 'Indica email o ID de usuario' }, { status: 400 })
    if (!isWalletKind(walletKind)) return NextResponse.json({ error: 'Wallet invalida' }, { status: 400 })
    if (direction !== 'credit' && direction !== 'debit') return NextResponse.json({ error: 'Movimiento invalido' }, { status: 400 })
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'Monto invalido' }, { status: 400 })
    if (reason.length < 4) return NextResponse.json({ error: 'Indica un motivo claro' }, { status: 400 })

    const targetUser = await resolveTargetUser(serviceClient, identifier)
    await ensurePlayerAccount(serviceClient, targetUser)

    const signedAmount = direction === 'credit' ? amount : -amount
    const transactionType = direction === 'credit' ? 'admin_credit' : 'admin_debit'
    const balanceAfter = await applyWalletTransaction(serviceClient, {
      userId: targetUser.id,
      walletKind,
      type: transactionType,
      amount: signedAmount,
      description: reason,
      metadata: {
        adminUserId: adminUser.id,
        targetEmail: targetUser.email,
        source: 'admin_wallet_adjustment_panel',
      },
    })

    await logAdminAudit(serviceClient, {
      adminUserId: adminUser.id,
      action: transactionType,
      entityType: 'wallet',
      entityId: targetUser.id,
      afterData: { walletKind, amount: signedAmount, balanceAfter },
      reason,
      metadata: { targetEmail: targetUser.email },
    })

    return NextResponse.json({ ok: true, user_id: targetUser.id, balance_after: balanceAfter })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'No se pudo ajustar el saldo' }, { status: 500 })
  }
}
