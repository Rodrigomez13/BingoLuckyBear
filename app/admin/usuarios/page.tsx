import Link from 'next/link'
import { ArrowLeft, Mail, ShieldCheck, UserCircle2, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BearLogo } from '@/components/bear-logo'
import { requireAdminPage } from '@/lib/auth/roles'
import { getCustomerAvatar, getCustomerAvatarImageSrc } from '@/lib/customer/avatars'
import { UserManagementTable, type AdminUserRow } from '@/components/admin/user-management-table'

interface ProfileRow {
  id: string
  email: string | null
  full_name: string | null
  alias: string | null
  avatar_key: string | null
  phone: string | null
  dni: string | null
  created_at?: string | null
}

interface WalletRow {
  user_id: string
  general_balance: number | null
}

interface RoleRow {
  user_id: string
  role: 'admin' | 'operator' | 'player'
}

interface StatsRow {
  user_id: string
  matches_played: number | null
  matches_won: number | null
  matches_lost: number | null
  ranking_points: number | null
}

interface CardCountRow {
  user_id: string | null
  email: string | null
  dni: string | null
  deposit_id: string | null
  payment_status: string | null
}

interface DepositRow {
  id: string
  user_id: string | null
  customer_email: string | null
  amount: number
  currency: string
  wallet_kind: 'general' | 'bonus_points' | 'cash_credits'
  payment_method: string
  payment_reference: string | null
  status: string
  created_at: string
}

interface TransactionRow {
  id: string
  user_id: string
  wallet_kind: 'general' | 'bonus_points' | 'cash_credits'
  transaction_type: string
  amount: number
  balance_after: number | null
  description: string | null
  created_at: string
}

interface WithdrawalRow {
  id: string
  user_id: string | null
  amount: number
  currency: string
  payout_account_kind: string
  payout_account: string
  payout_holder_name: string
  status: string
  settlement_reference: string | null
  created_at: string
}

export default async function AdminUsersPage() {
  const { user: currentUser, access, serviceClient } = await requireAdminPage()

  const { data: authUsersData, error: authUsersError } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (authUsersError) throw authUsersError

  const authUsers = authUsersData.users ?? []
  const userIds = authUsers.map((user) => user.id)

  const [profilesResult, walletsResult, rolesResult, statsResult, cardsResult, depositsResult, withdrawalsResult, transactionsResult] = await Promise.allSettled([
    userIds.length
      ? serviceClient.from('customer_profiles').select('id, email, full_name, alias, avatar_key, phone, dni, created_at').in('id', userIds)
      : Promise.resolve({ data: [] as ProfileRow[] }),
    userIds.length
      ? serviceClient.from('lbb_wallets').select('user_id, general_balance').in('user_id', userIds)
      : Promise.resolve({ data: [] as WalletRow[] }),
    userIds.length
      ? serviceClient.from('lbb_user_roles').select('user_id, role').in('user_id', userIds)
      : Promise.resolve({ data: [] as RoleRow[] }),
    userIds.length
      ? serviceClient.from('truco_player_stats').select('user_id, matches_played, matches_won, matches_lost, ranking_points').in('user_id', userIds)
      : Promise.resolve({ data: [] as StatsRow[] }),
    serviceClient
      .from('bingo_cards')
      .select('user_id, email, dni, deposit_id, payment_status')
      .order('created_at', { ascending: false })
      .limit(2000),
    serviceClient
      .from('payment_deposits')
      .select('id, user_id, customer_email, amount, currency, wallet_kind, payment_method, payment_reference, status, created_at')
      .order('created_at', { ascending: false })
      .limit(1000),
    serviceClient
      .from('payment_withdrawals')
      .select('id, user_id, amount, currency, payout_account_kind, payout_account, payout_holder_name, status, settlement_reference, created_at')
      .order('created_at', { ascending: false })
      .limit(1000),
    serviceClient
      .from('lbb_wallet_transactions')
      .select('id, user_id, wallet_kind, transaction_type, amount, balance_after, description, created_at')
      .order('created_at', { ascending: false })
      .limit(1000),
  ])

  const profiles = resultData<ProfileRow>(profilesResult)
  const wallets = resultData<WalletRow>(walletsResult)
  const roles = resultData<RoleRow>(rolesResult)
  const stats = resultData<StatsRow>(statsResult)
  const cards = resultData<CardCountRow>(cardsResult)
  const deposits = resultData<DepositRow>(depositsResult)
  const withdrawals = resultData<WithdrawalRow>(withdrawalsResult)
  const transactions = resultData<TransactionRow>(transactionsResult)

  const profileById = new Map(profiles.map((row) => [row.id, row]))
  const profileByDni = new Map(profiles.filter((row) => row.dni).map((row) => [normalizeDni(row.dni), row]))
  const walletById = new Map(wallets.map((row) => [row.user_id, row]))
  const roleById = new Map(roles.map((row) => [row.user_id, row.role]))
  const statsById = new Map(stats.map((row) => [row.user_id, row]))
  const authUserByEmail = new Map(authUsers.filter((user) => user.email).map((user) => [user.email!.toLowerCase(), user]))

  const cardsByUser = new Map<string, { total: number; approved: number; pending: number; rejected: number }>()
  for (const card of cards) {
    const key = card.user_id
      || authUserByEmail.get(card.email?.toLowerCase() ?? '')?.id
      || profileByDni.get(normalizeDni(card.dni))?.id
    if (!key) continue
    const current = cardsByUser.get(key) ?? { total: 0, approved: 0, pending: 0, rejected: 0 }
    current.total += 1
    if (card.payment_status === 'approved') current.approved += 1
    else if (card.payment_status === 'rejected') current.rejected += 1
    else current.pending += 1
    cardsByUser.set(key, current)
  }

  const depositsByUser = new Map<string, AdminUserRow['deposits']>()
  for (const deposit of deposits) {
    let matchedBy: 'user_id' | 'email' | 'dni' = 'user_id'
    let userId = deposit.user_id
    if (!userId && deposit.customer_email) {
      userId = authUserByEmail.get(deposit.customer_email.toLowerCase())?.id ?? null
      matchedBy = 'email'
    }
    if (!userId) {
      const linkedCard = cards.find((card) => card.deposit_id === deposit.id && card.dni)
      userId = profileByDni.get(normalizeDni(linkedCard?.dni))?.id ?? null
      matchedBy = 'dni'
    }
    if (!userId) continue
    const current = depositsByUser.get(userId) ?? []
    current.push({
      id: deposit.id,
      amount: Number(deposit.amount ?? 0),
      currency: deposit.currency || 'ARS',
      walletKind: deposit.wallet_kind,
      paymentMethod: deposit.payment_method,
      paymentReference: deposit.payment_reference,
      status: deposit.status,
      createdAt: deposit.created_at,
      matchedBy,
    })
    depositsByUser.set(userId, current)
  }

  const transactionsByUser = new Map<string, AdminUserRow['transactions']>()
  for (const transaction of transactions) {
    const current = transactionsByUser.get(transaction.user_id) ?? []
    if (current.length < 20) {
      current.push({
        id: transaction.id,
        walletKind: transaction.wallet_kind,
        transactionType: transaction.transaction_type,
        amount: Number(transaction.amount ?? 0),
        balanceAfter: transaction.balance_after === null ? null : Number(transaction.balance_after),
        description: transaction.description,
        createdAt: transaction.created_at,
      })
    }
    transactionsByUser.set(transaction.user_id, current)
  }

  const withdrawalsByUser = new Map<string, NonNullable<AdminUserRow['withdrawals']>>()
  for (const withdrawal of withdrawals) {
    if (!withdrawal.user_id) continue
    const current = withdrawalsByUser.get(withdrawal.user_id) ?? []
    current.push({
      id: withdrawal.id,
      amount: Number(withdrawal.amount ?? 0),
      currency: withdrawal.currency || 'ARS',
      payoutAccountKind: withdrawal.payout_account_kind,
      payoutAccount: withdrawal.payout_account,
      payoutHolderName: withdrawal.payout_holder_name,
      status: withdrawal.status,
      settlementReference: withdrawal.settlement_reference,
      createdAt: withdrawal.created_at,
    })
    withdrawalsByUser.set(withdrawal.user_id, current)
  }

  const rows: AdminUserRow[] = authUsers
    .map((user) => {
      const profile = profileById.get(user.id)
      const wallet = walletById.get(user.id)
      const role = roleById.get(user.id) ?? (user.id === currentUser.id ? access.role : 'player')
      const playerStats = statsById.get(user.id)
      const avatar = getCustomerAvatar(profile?.avatar_key)
      const cardCount = cardsByUser.get(user.id) ?? { total: 0, approved: 0, pending: 0, rejected: 0 }
      const alias = profile?.alias || profile?.full_name || user.email?.split('@')[0] || 'Usuario'

      return {
        id: user.id,
        email: user.email ?? profile?.email ?? 'sin-email',
        alias,
        fullName: profile?.full_name ?? '',
        phone: profile?.phone ?? '',
        dni: profile?.dni ?? '',
        role,
        avatarKey: avatar.key,
        avatarLabel: avatar.label,
        avatarSrc: getCustomerAvatarImageSrc(avatar.key),
        emailConfirmed: Boolean(user.email_confirmed_at || user.confirmed_at),
        createdAt: user.created_at ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
        balance: Number(wallet?.general_balance ?? 0),
        cards: cardCount,
        matchesPlayed: Number(playerStats?.matches_played ?? 0),
        matchesWon: Number(playerStats?.matches_won ?? 0),
        matchesLost: Number(playerStats?.matches_lost ?? 0),
        rankingPoints: Number(playerStats?.ranking_points ?? 1000),
        deposits: depositsByUser.get(user.id) ?? [],
        withdrawals: withdrawalsByUser.get(user.id) ?? [],
        transactions: transactionsByUser.get(user.id) ?? [],
      }
    })
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())

  const totalUsers = rows.length
  const adminUsers = rows.filter((row) => row.role === 'admin' || row.role === 'operator').length
  const verifiedUsers = rows.filter((row) => row.emailConfirmed).length
  const totalBalance = rows.reduce((sum, row) => sum + row.balance, 0)

  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-zinc-100">
      <div className="lbb-ambient" />
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/70 p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BearLogo size={44} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300">Panel Admin</p>
              <h1 className="font-mono text-2xl font-black text-white sm:text-4xl">Usuarios</h1>
              <p className="mt-1 text-sm text-zinc-400">Listado operativo de cuentas, roles, saldos, cartones y actividad de Truco.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-full border-white/15 bg-transparent text-amber-200 hover:bg-amber-300/10">
              <Link href="/admin/saldo"><WalletCards className="mr-2 h-4 w-4" /> Saldos</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-white/15 bg-transparent text-amber-200 hover:bg-amber-300/10">
              <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Link>
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<UserCircle2 className="h-5 w-5" />} label="Usuarios totales" value={String(totalUsers)} detail="auth.users" />
          <Metric icon={<ShieldCheck className="h-5 w-5" />} label="Admins / operadores" value={String(adminUsers)} detail="roles activos" />
          <Metric icon={<Mail className="h-5 w-5" />} label="Emails verificados" value={String(verifiedUsers)} detail={`${totalUsers - verifiedUsers} sin verificar`} />
          <Metric icon={<WalletCards className="h-5 w-5" />} label="Saldo de jugadores" value={formatMoney(totalBalance)} detail="billetera general" />
        </div>

        <Card className="border-white/10 bg-zinc-950/85 text-zinc-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <UserCircle2 className="h-5 w-5 text-amber-300" /> Lista de usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-zinc-400">
                No hay usuarios registrados.
              </div>
            ) : (
              <UserManagementTable rows={rows} currentUserId={currentUser.id} canManageRoles={access.role === 'admin'} />
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function resultData<T>(result: PromiseSettledResult<{ data: T[] | null }>) {
  if (result.status !== 'fulfilled') return []
  return result.value.data ?? []
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-amber-300/20 bg-zinc-950/80 p-4 shadow-xl shadow-black/30">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300">{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{detail}</p>
    </div>
  )
}

function normalizeDni(value?: string | null) {
  return String(value ?? '').replace(/\D/g, '')
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value)
}
