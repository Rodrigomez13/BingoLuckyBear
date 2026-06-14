import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock3, ShieldCheck, Ticket, Trophy, WalletCards } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BearLogo } from '@/components/bear-logo'
import { WalletAdjustmentPanel } from '@/components/admin/wallet-adjustment-panel'
import { requireAdminPage } from '@/lib/auth/roles'

interface WalletRow {
  user_id: string
  bonus_points_balance: number | null
  cash_credits_balance: number | null
}

interface TransactionRow {
  id: string
  user_id: string
  wallet_kind: string | null
  transaction_type: string | null
  amount: number | null
  balance_after: number | null
  description: string | null
  created_at: string
}

interface TrucoRoomRow {
  id: string
  status: string | null
  entry_fee_points: number | null
  prize_pool_points: number | null
  created_at: string
}

export default async function AdminWalletOpsPage() {
  const { serviceClient } = await requireAdminPage()

  const [{ data: wallets }, { data: transactions }, { data: trucoRooms }, { data: cards }, { data: auditLogs }] = await Promise.all([
    serviceClient.from('lbb_wallets').select('user_id, bonus_points_balance, cash_credits_balance').limit(500),
    serviceClient
      .from('lbb_wallet_transactions')
      .select('id, user_id, wallet_kind, transaction_type, amount, balance_after, description, created_at')
      .order('created_at', { ascending: false })
      .limit(80),
    serviceClient
      .from('truco_rooms')
      .select('id, status, entry_fee_points, prize_pool_points, created_at')
      .order('created_at', { ascending: false })
      .limit(40),
    serviceClient
      .from('bingo_cards')
      .select('id, payment_status, receipt_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    serviceClient
      .from('lbb_admin_audit_logs')
      .select('id, action, entity_type, entity_id, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(12),
  ])

  const walletRows = (wallets ?? []) as WalletRow[]
  const transactionRows = (transactions ?? []) as TransactionRow[]
  const trucoRoomRows = (trucoRooms ?? []) as TrucoRoomRow[]
  const cardRows = (cards ?? []) as { payment_status?: string | null; receipt_amount?: number | null }[]
  const auditRows = (auditLogs ?? []) as { id: string; action: string; entity_type?: string | null; entity_id?: string | null; reason?: string | null; created_at: string }[]

  const pendingDeposits = transactionRows.filter((row) => row.transaction_type === 'deposit_pending')
  const approvedDeposits = transactionRows.filter((row) => row.transaction_type === 'deposit_approved')
  const trucoEntryFees = transactionRows.filter((row) => row.transaction_type === 'truco_entry_fee')
  const trucoPrizes = transactionRows.filter((row) => row.transaction_type === 'truco_prize')
  const bingoPurchases = transactionRows.filter((row) => row.transaction_type === 'bingo_purchase')
  const openTrucoRooms = trucoRoomRows.filter((row) => row.status === 'waiting' || row.status === 'playing')
  const approvedBingoAmount = cardRows.reduce((total, card) => card.payment_status === 'approved' ? total + Number(card.receipt_amount ?? 0) : total, 0)

  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-zinc-100">
      <div className="lbb-ambient" />
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/70 p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BearLogo size={44} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300">Panel Admin</p>
              <h1 className="font-mono text-2xl font-black text-white sm:text-4xl">Saldo, créditos y partidas</h1>
              <p className="mt-1 text-sm text-zinc-400">Control operativo para recargas, compra de cartones, entradas a torneos y partidas de Truco.</p>
            </div>
          </div>
          <Button asChild variant="outline" className="rounded-full border-white/15 bg-transparent text-amber-200 hover:bg-amber-300/10">
            <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al admin</Link>
          </Button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <WalletMetric icon={<WalletCards className="h-5 w-5" />} label="Usuarios con saldo" value={String(walletRows.length)} detail="wallets creadas" />
          <WalletMetric icon={<Clock3 className="h-5 w-5" />} label="Recargas pendientes" value={String(pendingDeposits.length)} detail="requieren validación" />
          <WalletMetric icon={<Ticket className="h-5 w-5" />} label="Cartones aprobados" value={formatARS(approvedBingoAmount)} detail="ingreso confirmado" />
          <WalletMetric icon={<Trophy className="h-5 w-5" />} label="Pozo Truco activo" value={`${openTrucoRooms.reduce((total, room) => total + Number(room.prize_pool_points ?? 0), 0)} LBB`} detail={`${openTrucoRooms.length} mesa${openTrucoRooms.length !== 1 ? 's' : ''} abierta${openTrucoRooms.length !== 1 ? 's' : ''}`} />
        </div>

        <div className="mb-6">
          <WalletAdjustmentPanel />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <Card className="border-white/10 bg-zinc-950/85 text-zinc-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <ShieldCheck className="h-5 w-5 text-emerald-300" /> Flujo controlado de saldo
              </CardTitle>
              <p className="text-sm text-zinc-400">Este flujo separa dinero real, puntos LBB y permisos de juego para evitar errores de acreditación.</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <ProcessStep step="1" title="Solicitud de recarga" text="El usuario carga comprobante y monto. Se registra como deposit_pending sin habilitar saldo automático." />
                <ProcessStep step="2" title="Validación admin" text="El panel compara monto, operación, destino y titular. Recién al aprobar se acredita cash_credits o bonus_points." />
                <ProcessStep step="3" title="Uso de saldo" text="Cartones, torneos y entrada a mesas descuentan wallet con una transacción trazable." />
                <ProcessStep step="4" title="Liquidación" text="Premios de Truco o bingo generan transacciones separadas, con referencia a sala, cartón o torneo." />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-950/85 text-zinc-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <WalletCards className="h-5 w-5 text-amber-300" /> Movimientos recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactionRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center text-sm text-zinc-400">
                  Todavía no hay movimientos de saldo registrados.
                </div>
              ) : (
                <div className="space-y-2">
                  {transactionRows.slice(0, 14).map((row) => (
                    <div key={row.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">{formatTransactionType(row.transaction_type)}</p>
                          <p className="mt-1 truncate text-xs text-zinc-500">{row.description || row.user_id}</p>
                        </div>
                        <Badge className={Number(row.amount ?? 0) >= 0 ? 'bg-emerald-500 text-white hover:bg-emerald-500' : 'bg-rose-500 text-white hover:bg-rose-500'}>
                          {Number(row.amount ?? 0) >= 0 ? '+' : ''}{row.amount ?? 0}
                        </Badge>
                      </div>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{formatDate(row.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="grid gap-4 md:grid-cols-3">
            <OperationBox label="Recargas aprobadas" value={String(approvedDeposits.length)} />
            <OperationBox label="Entradas Truco debitadas" value={String(trucoEntryFees.length)} />
            <OperationBox label="Premios Truco pagados" value={String(trucoPrizes.length)} />
            <OperationBox label="Compras bingo con wallet" value={String(bingoPurchases.length)} />
            <OperationBox label="Mesas Truco recientes" value={String(trucoRoomRows.length)} />
            <OperationBox label="Saldo LBB circulante" value={`${walletRows.reduce((total, row) => total + Number(row.bonus_points_balance ?? 0), 0)} LBB`} />
          </div>

          <Card className="border-white/10 bg-zinc-950/85 text-zinc-100">
            <CardHeader>
              <CardTitle className="text-white">Auditoría reciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {auditRows.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">No hay auditoría registrada todavía.</p>
              ) : (
                auditRows.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <p className="text-sm font-bold text-white">{formatTransactionType(log.action)}</p>
                    <p className="mt-1 truncate text-xs text-zinc-500">{log.reason || `${log.entity_type ?? 'entidad'} ${log.entity_id ?? ''}`}</p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{formatDate(log.created_at)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

function WalletMetric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-amber-300/20 bg-zinc-950/80 p-4 shadow-xl shadow-black/30">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300">{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{detail}</p>
    </div>
  )
}

function ProcessStep({ step, title, text }: { step: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-300 font-mono font-black text-zinc-950">{step}</span>
        <p className="font-bold text-white">{title}</p>
      </div>
      <p className="text-sm leading-6 text-zinc-400">{text}</p>
    </div>
  )
}

function OperationBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="mb-2 flex items-center gap-2 text-emerald-300"><CheckCircle2 className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</span></div>
      <p className="font-mono text-2xl font-black text-white">{value}</p>
    </div>
  )
}

function formatTransactionType(type?: string | null) {
  const labels: Record<string, string> = {
    signup_bonus: 'Bono inicial',
    admin_credit: 'Crédito manual',
    admin_debit: 'Débito manual',
    deposit_pending: 'Recarga pendiente',
    deposit_approved: 'Recarga aprobada',
    deposit_rejected: 'Recarga rechazada',
    truco_entry_fee: 'Entrada Truco',
    truco_prize: 'Premio Truco',
    bingo_purchase: 'Compra bingo',
    refund: 'Reintegro',
    withdrawal_pending: 'Retiro pendiente',
    withdrawal_approved: 'Retiro aprobado',
    withdrawal_rejected: 'Retiro rechazado',
    adjustment: 'Ajuste',
  }
  return labels[type ?? ''] ?? type ?? 'Movimiento'
}

function formatARS(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}
