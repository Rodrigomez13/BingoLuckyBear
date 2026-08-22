import Link from 'next/link'
import { ArrowLeft, Landmark } from 'lucide-react'
import { AdminEconomyNav } from '@/components/admin/admin-economy-nav'
import { WithdrawalActionButton } from '@/components/admin/withdrawal-action-button'
import { BearLogo } from '@/components/bear-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAdminPage } from '@/lib/auth/roles'

interface WithdrawalRow {
  id: string
  user_id: string | null
  amount: number
  currency: string
  payout_account_kind: string
  payout_account: string
  payout_holder_name: string
  status: string
  review_notes: string | null
  settlement_reference: string | null
  wallet_transaction_id: string | null
  reversal_transaction_id: string | null
  created_at: string
  reviewed_at: string | null
}

interface ProfileRow {
  id: string
  email: string | null
  full_name: string | null
  alias: string | null
  dni: string | null
}

export default async function AdminWithdrawalsPage() {
  const { serviceClient } = await requireAdminPage()
  const { data } = await serviceClient
    .from('payment_withdrawals')
    .select('id, user_id, amount, currency, payout_account_kind, payout_account, payout_holder_name, status, review_notes, settlement_reference, wallet_transaction_id, reversal_transaction_id, created_at, reviewed_at')
    .order('created_at', { ascending: false })
    .limit(200)

  const rows = (data ?? []) as WithdrawalRow[]
  const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))] as string[]
  const { data: profiles } = userIds.length
    ? await serviceClient.from('customer_profiles').select('id, email, full_name, alias, dni').in('id', userIds)
    : { data: [] }
  const profileById = new Map(((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]))
  const pending = rows.filter((row) => row.status === 'pending')
  const approved = rows.filter((row) => row.status === 'approved')
  const returned = rows.filter((row) => row.status === 'rejected' || row.status === 'cancelled')
  const pendingAmount = pending.reduce((sum, row) => sum + Number(row.amount), 0)

  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-zinc-100">
      <div className="lbb-ambient" />
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/70 p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BearLogo size={44} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300">Economía</p>
              <h1 className="font-mono text-2xl font-black text-white sm:text-4xl">Retiros</h1>
              <p className="mt-1 text-sm text-zinc-400">Pagos solicitados por jugadores y saldo reservado.</p>
            </div>
          </div>
          <Button asChild variant="outline" className="border-white/15 bg-transparent text-amber-200 hover:bg-amber-300/10">
            <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al admin</Link>
          </Button>
        </header>

        <AdminEconomyNav />

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Pendientes" value={String(pending.length)} detail={formatMoney(pendingAmount, 'ARS')} />
          <Metric label="Pagados" value={String(approved.length)} detail="transferencia confirmada" />
          <Metric label="Reintegrados" value={String(returned.length)} detail="rechazados o cancelados" />
          <Metric label="Total listado" value={String(rows.length)} detail="solicitudes recientes" />
        </div>

        <Card className="border-white/10 bg-zinc-950/85 text-zinc-100">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-white"><Landmark className="h-5 w-5 text-amber-300" /> Solicitudes de retiro</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-sm">
                <thead className="bg-black/30 text-left text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Jugador</th>
                    <th className="px-4 py-3">Monto</th>
                    <th className="px-4 py-3">Cuenta destino</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Operación</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {rows.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-zinc-500">No hay retiros registrados.</td></tr>
                  ) : rows.map((row) => {
                    const profile = row.user_id ? profileById.get(row.user_id) : null
                    return (
                      <tr key={row.id} className="hover:bg-white/[0.03]">
                        <td className="px-4 py-4">
                          <p className="font-bold text-white">{profile?.full_name || profile?.alias || row.payout_holder_name}</p>
                          <p className="text-xs text-zinc-500">{profile?.email || row.user_id || 'Usuario eliminado'}</p>
                          {profile?.dni && <p className="text-[10px] text-zinc-600">DNI {profile.dni}</p>}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-mono text-lg font-black text-amber-300">{formatMoney(row.amount, row.currency)}</p>
                          <p className="text-xs text-zinc-500">{row.wallet_transaction_id ? 'Saldo reservado' : 'Sin reserva'}</p>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className="bg-zinc-800 text-zinc-100 hover:bg-zinc-800">{row.payout_account_kind}</Badge>
                          <p className="mt-1 font-mono text-sm text-white">{row.payout_account}</p>
                          <p className="text-xs text-zinc-500">{row.payout_holder_name}</p>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={row.status} />
                          {row.review_notes && <p className="mt-1 max-w-[220px] text-xs text-zinc-500">{row.review_notes}</p>}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-mono text-xs text-zinc-300">{row.settlement_reference || 'Sin referencia'}</p>
                          {row.reversal_transaction_id && <p className="text-[10px] text-emerald-300">Saldo reintegrado</p>}
                        </td>
                        <td className="px-4 py-4 text-xs text-zinc-400">
                          {formatDate(row.created_at)}
                          {row.reviewed_at && <p className="text-zinc-600">Rev. {formatDate(row.reviewed_at)}</p>}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <WithdrawalActionButton id={row.id} action="approve" disabled={row.status !== 'pending'} />
                            <WithdrawalActionButton id={row.id} action="reject" disabled={row.status !== 'pending'} />
                          </div>
                        </td>
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

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-amber-300/20 bg-zinc-950/80 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p><p className="mt-1 font-mono text-3xl font-black text-white">{value}</p><p className="mt-1 text-xs text-zinc-400">{detail}</p></div>
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') return <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Pagado</Badge>
  if (status === 'rejected') return <Badge className="bg-rose-500 text-white hover:bg-rose-500">Rechazado</Badge>
  if (status === 'cancelled') return <Badge className="bg-zinc-700 text-zinc-100 hover:bg-zinc-700">Cancelado</Badge>
  return <Badge className="bg-amber-300 text-zinc-950 hover:bg-amber-300">Pendiente</Badge>
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'ARS', maximumFractionDigits: 0 }).format(Number(amount))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}
