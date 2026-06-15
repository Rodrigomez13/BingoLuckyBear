import Link from 'next/link'
import { ArrowLeft, ArrowUpDown, CircleDollarSign, ListChecks, ReceiptText } from 'lucide-react'
import { AdminEconomyNav } from '@/components/admin/admin-economy-nav'
import { BearLogo } from '@/components/bear-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAdminPage } from '@/lib/auth/roles'

interface TransactionRow {
  id: string
  user_id: string
  wallet_kind: string
  transaction_type: string
  amount: number
  balance_after: number
  related_type: string | null
  related_id: string | null
  description: string | null
  created_at: string
}

interface ProfileRow {
  id: string
  email: string | null
  full_name: string | null
  alias: string | null
}

interface WithdrawalRow {
  amount: number
  status: string
  created_at: string
  reviewed_at: string | null
}

interface PurchaseRow {
  amount: number
  status: string
  created_at: string
}

export default async function AdminWalletMovementsPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string }>
}) {
  const { serviceClient } = await requireAdminPage()
  const period = normalizePeriod((await searchParams)?.period)
  const start = getPeriodStart(period)

  let transactionQuery = serviceClient
    .from('lbb_wallet_transactions')
    .select('id, user_id, wallet_kind, transaction_type, amount, balance_after, related_type, related_id, description, created_at')
    .order('created_at', { ascending: false })
    .limit(500)
  let withdrawalsQuery = serviceClient
    .from('payment_withdrawals')
    .select('amount, status, created_at, reviewed_at')
    .order('created_at', { ascending: false })
    .limit(500)
  let purchasesQuery = serviceClient
    .from('game_purchases')
    .select('amount, status, created_at')
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(500)

  if (start) {
    transactionQuery = transactionQuery.gte('created_at', start)
    withdrawalsQuery = withdrawalsQuery.gte('created_at', start)
    purchasesQuery = purchasesQuery.gte('created_at', start)
  }

  const [{ data: transactions }, { data: withdrawals }, { data: purchases }] = await Promise.all([
    transactionQuery,
    withdrawalsQuery,
    purchasesQuery,
  ])

  const rows = (transactions ?? []) as TransactionRow[]
  const withdrawalRows = (withdrawals ?? []) as WithdrawalRow[]
  const purchaseRows = (purchases ?? []) as PurchaseRow[]
  const userIds = [...new Set(rows.map((row) => row.user_id))]
  const { data: profiles } = userIds.length
    ? await serviceClient.from('customer_profiles').select('id, email, full_name, alias').in('id', userIds)
    : { data: [] }
  const profileById = new Map(((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]))
  const credits = rows.filter((row) => Number(row.amount) > 0).reduce((sum, row) => sum + Number(row.amount), 0)
  const debits = rows.filter((row) => Number(row.amount) < 0).reduce((sum, row) => sum + Math.abs(Number(row.amount)), 0)
  const income = rows
    .filter((row) => row.wallet_kind === 'cash_credits' && ['deposit_approved', 'admin_credit'].includes(row.transaction_type) && Number(row.amount) > 0)
    .reduce((sum, row) => sum + Number(row.amount), 0)
  const outflow = rows
    .filter((row) => row.wallet_kind === 'cash_credits' && ['withdrawal_pending', 'admin_debit'].includes(row.transaction_type) && Number(row.amount) < 0)
    .reduce((sum, row) => sum + Math.abs(Number(row.amount)), 0)
  const payments = withdrawalRows
    .filter((row) => row.status === 'approved')
    .reduce((sum, row) => sum + Number(row.amount), 0)
  const sales = purchaseRows.reduce((sum, row) => sum + Number(row.amount), 0)

  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-zinc-100">
      <div className="lbb-ambient" />
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader title="Movimientos" subtitle="Libro general de entradas, salidas y saldos resultantes." />
        <AdminEconomyNav />

        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { value: 'today', label: 'Hoy' },
            { value: '7d', label: '7 días' },
            { value: '30d', label: '30 días' },
            { value: 'all', label: 'Todo' },
          ].map((item) => (
            <Button key={item.value} asChild size="sm" variant={period === item.value ? 'default' : 'outline'} className={period === item.value ? 'bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200' : 'border-white/15 bg-transparent text-zinc-300'}>
              <Link href={`/admin/saldo/movimientos?period=${item.value}`}>{item.label}</Link>
            </Button>
          ))}
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Ingresos" value={formatARS(income)} icon={<CircleDollarSign className="h-4 w-4" />} positive />
          <Metric label="Egresos reservados" value={formatARS(outflow)} icon={<ArrowUpDown className="h-4 w-4" />} />
          <Metric label="Pagos realizados" value={formatARS(payments)} icon={<ReceiptText className="h-4 w-4" />} />
          <Metric label="Ventas de juegos" value={formatARS(sales)} icon={<ListChecks className="h-4 w-4" />} positive />
        </div>

        <Card className="border-white/10 bg-zinc-950/85 text-zinc-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white"><ListChecks className="h-5 w-5 text-amber-300" /> Libro de movimientos</CardTitle>
            <p className="text-sm text-zinc-500">{rows.length} movimientos · créditos {formatNumber(credits)} · débitos {formatNumber(debits)}</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-sm">
                <thead className="bg-black/30 text-left text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                  <tr><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Movimiento</th><th className="px-4 py-3">Billetera</th><th className="px-4 py-3 text-right">Importe</th><th className="px-4 py-3 text-right">Saldo posterior</th><th className="px-4 py-3">Referencia</th><th className="px-4 py-3">Fecha</th></tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {rows.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-zinc-500">No hay movimientos registrados.</td></tr> : rows.map((row) => {
                    const profile = profileById.get(row.user_id)
                    return (
                      <tr key={row.id} className="hover:bg-white/[0.03]">
                        <td className="px-4 py-4"><p className="font-bold text-white">{profile?.full_name || profile?.alias || 'Usuario'}</p><p className="text-xs text-zinc-500">{profile?.email || row.user_id}</p></td>
                        <td className="px-4 py-4"><p className="font-semibold text-white">{transactionLabel(row.transaction_type)}</p><p className="max-w-[250px] truncate text-xs text-zinc-500">{row.description || 'Sin descripción'}</p></td>
                        <td className="px-4 py-4"><Badge className="bg-zinc-800 text-zinc-100 hover:bg-zinc-800">{walletLabel(row.wallet_kind)}</Badge></td>
                        <td className={`px-4 py-4 text-right font-mono font-black ${Number(row.amount) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{Number(row.amount) >= 0 ? '+' : ''}{formatNumber(Number(row.amount))}</td>
                        <td className="px-4 py-4 text-right font-mono text-zinc-300">{formatNumber(Number(row.balance_after))}</td>
                        <td className="px-4 py-4"><p className="text-xs text-zinc-300">{row.related_type || 'manual'}</p><p className="max-w-[170px] truncate font-mono text-[10px] text-zinc-600">{row.related_id || row.id}</p></td>
                        <td className="px-4 py-4 text-xs text-zinc-400">{formatDate(row.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/70 p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><BearLogo size={44} /><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300">Economía</p><h1 className="font-mono text-2xl font-black text-white sm:text-4xl">{title}</h1><p className="mt-1 text-sm text-zinc-400">{subtitle}</p></div></div><Button asChild variant="outline" className="border-white/15 bg-transparent text-amber-200 hover:bg-amber-300/10"><Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al admin</Link></Button></header>
}

function Metric({ label, value, positive = false, icon }: { label: string; value: string; positive?: boolean; icon: React.ReactNode }) {
  return <div className="border border-white/10 bg-zinc-950/80 p-4"><div className="mb-2 flex items-center gap-2 text-amber-300">{icon}<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p></div><p className={`font-mono text-3xl font-black ${positive ? 'text-emerald-300' : 'text-white'}`}>{value}</p></div>
}

function walletLabel(kind: string) { return kind === 'bonus_points' ? 'LBB Points' : 'Cash Credits' }
function formatNumber(value: number) { return new Intl.NumberFormat('es-AR').format(value) }
function formatARS(value: number) { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value) }
function formatDate(value: string) { return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) }
function transactionLabel(type: string) {
  const labels: Record<string, string> = { signup_bonus: 'Bono inicial', admin_credit: 'Crédito manual', admin_debit: 'Débito manual', deposit_approved: 'Depósito aprobado', deposit_rejected: 'Depósito rechazado', bingo_purchase: 'Compra de bingo', truco_entry_fee: 'Entrada a Truco', truco_prize: 'Premio de Truco', tournament_entry: 'Entrada a torneo', game_purchase: 'Compra de juego', refund: 'Reintegro', game_refund: 'Reintegro de juego', withdrawal_pending: 'Retiro solicitado', withdrawal_approved: 'Retiro aprobado', withdrawal_rejected: 'Retiro reintegrado', adjustment: 'Ajuste' }
  return labels[type] ?? type
}

function normalizePeriod(value?: string) {
  return value === '7d' || value === '30d' || value === 'all' ? value : 'today'
}

function getPeriodStart(period: string) {
  if (period === 'all') return null
  if (period === 'today') {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date())
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
    return `${values.year}-${values.month}-${values.day}T03:00:00.000Z`
  }
  const days = period === '7d' ? 7 : 30
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}
