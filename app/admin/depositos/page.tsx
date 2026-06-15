import Link from 'next/link'
import { ArrowLeft, ExternalLink, ReceiptText, WalletCards } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BearLogo } from '@/components/bear-logo'
import { requireAdminPage } from '@/lib/auth/roles'
import { DepositActionButton } from '@/components/admin/deposit-action-button'
import { DepositOcrControls } from '@/components/admin/deposit-ocr-controls'
import { AdminEconomyNav } from '@/components/admin/admin-economy-nav'

interface DepositRow {
  id: string
  user_id: string | null
  customer_email: string | null
  amount: number
  currency: string
  wallet_kind: string
  payment_method: string
  payment_reference: string | null
  receipt_url: string | null
  receipt_amount: number | null
  receipt_operation_number: string | null
  receipt_destination_account: string | null
  receipt_date: string | null
  receipt_parse_status: 'pending' | 'parsed' | 'failed' | 'manual' | null
  receipt_parse_error: string | null
  metadata: Record<string, unknown> | null
  status: string
  reviewed_at: string | null
  review_notes: string | null
  wallet_transaction_id: string | null
  created_at: string
  game_purchases?: { id: string; status: string; purchase_type: string; quantity: number }[] | null
}

interface ProfileRow {
  id: string
  email: string | null
  full_name: string | null
  alias: string | null
  phone: string | null
  dni: string | null
}

export default async function AdminDepositsPage() {
  const { serviceClient } = await requireAdminPage()

  const { data: deposits } = await serviceClient
    .from('payment_deposits')
    .select('id, user_id, customer_email, amount, currency, wallet_kind, payment_method, payment_reference, receipt_url, receipt_amount, receipt_operation_number, receipt_destination_account, receipt_date, receipt_parse_status, receipt_parse_error, metadata, status, reviewed_at, review_notes, wallet_transaction_id, created_at, game_purchases(id, status, purchase_type, quantity)')
    .order('created_at', { ascending: false })
    .limit(120)

  const depositRows = (deposits ?? []) as DepositRow[]
  const userIds = Array.from(new Set(depositRows.map((row) => row.user_id).filter(Boolean))) as string[]
  const { data: profiles } = userIds.length
    ? await serviceClient.from('customer_profiles').select('id, email, full_name, alias, phone, dni').in('id', userIds)
    : { data: [] }

  const profilesById = new Map(((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]))
  const pending = depositRows.filter((row) => row.status === 'pending')
  const approved = depositRows.filter((row) => row.status === 'approved')
  const rejected = depositRows.filter((row) => row.status === 'rejected')
  const totalPending = pending.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)

  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-zinc-100">
      <div className="lbb-ambient" />
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/70 p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BearLogo size={44} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300">Panel Admin</p>
              <h1 className="font-mono text-2xl font-black text-white sm:text-4xl">Depósitos</h1>
              <p className="mt-1 text-sm text-zinc-400">Revisión ordenada de ingresos, comprobantes y acreditación de saldo.</p>
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

        <AdminEconomyNav />

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Pendientes" value={String(pending.length)} detail={formatARS(totalPending)} />
          <Metric label="Aprobados" value={String(approved.length)} detail="con revisión admin" />
          <Metric label="Rechazados" value={String(rejected.length)} detail="requieren seguimiento" />
          <Metric label="Total listado" value={String(depositRows.length)} detail="últimos movimientos" />
        </div>

        <Card className="border-white/10 bg-zinc-950/85 text-zinc-100">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-white">
              <ReceiptText className="h-5 w-5 text-amber-300" /> Planilla de depósitos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1320px] text-sm">
                <thead className="bg-black/30 text-left text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Monto</th>
                    <th className="px-4 py-3">Referencia</th>
                    <th className="px-4 py-3">Validación OCR</th>
                    <th className="px-4 py-3">Wallet</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {depositRows.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-500">No hay depósitos registrados.</td></tr>
                  ) : depositRows.map((deposit) => {
                    const profile = deposit.user_id ? profilesById.get(deposit.user_id) : null
                    const canReview = deposit.status === 'pending'
                    const linkedPurchase = deposit.game_purchases?.[0] ?? null
                    const ocr = getOcrMetadata(deposit.metadata)
                    const canApprove = !deposit.receipt_url
                      || deposit.receipt_parse_status === 'manual'
                      || (deposit.receipt_parse_status === 'parsed' && ocr.reviewRecommendation === 'ready_for_review')
                    return (
                      <tr key={deposit.id} className="bg-zinc-950/30 hover:bg-white/[0.03]">
                        <td className="px-4 py-4">
                          <p className="font-bold text-white">{profile?.full_name || profile?.alias || deposit.customer_email || 'Invitado'}</p>
                          <p className="text-xs text-zinc-500">{profile?.email || deposit.customer_email || 'Sin email'}</p>
                          {profile?.dni && <p className="text-[10px] text-zinc-600">DNI {profile.dni}</p>}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-mono text-lg font-black text-amber-300">{formatMoney(deposit.amount, deposit.currency)}</p>
                          <p className="text-xs text-zinc-500">{deposit.payment_method}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="max-w-[220px] truncate font-semibold text-white">{deposit.payment_reference || 'Sin referencia'}</p>
                          {deposit.receipt_url && <a href={`/api/file?pathname=${encodeURIComponent(deposit.receipt_url)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-sky-300">Ver comprobante <ExternalLink className="h-3 w-3" /></a>}
                        </td>
                        <td className="px-4 py-4">
                          <OcrStatusBadge status={deposit.receipt_parse_status} recommendation={ocr.reviewRecommendation} />
                          {typeof ocr.confidence === 'number' && <p className="mt-1 text-xs text-zinc-500">Confianza {Math.round(ocr.confidence * 100)}%</p>}
                          {deposit.receipt_amount !== null && <p className="mt-1 text-xs text-zinc-300">Monto {formatMoney(deposit.receipt_amount, deposit.currency)}</p>}
                          {deposit.receipt_operation_number && <p className="max-w-[210px] truncate text-xs text-zinc-500">Op. {deposit.receipt_operation_number}</p>}
                          {ocr.senderDocument && <p className="text-xs text-zinc-500">Doc. {ocr.senderDocument}</p>}
                          {ocr.warnings.length > 0 && <p className="mt-1 max-w-[240px] text-xs text-amber-200">{ocr.warnings[0]}{ocr.warnings.length > 1 ? ` (+${ocr.warnings.length - 1})` : ''}</p>}
                          {deposit.receipt_parse_error && <p className="mt-1 max-w-[240px] text-xs text-rose-200">{deposit.receipt_parse_error}</p>}
                        </td>
                        <td className="px-4 py-4">
                          <Badge className="bg-zinc-800 text-zinc-100 hover:bg-zinc-800">{linkedPurchase ? 'Compra de cartones' : deposit.wallet_kind === 'general' ? 'Saldo general' : 'Saldo histórico'}</Badge>
                          <p className="mt-1 text-xs text-zinc-500">{linkedPurchase ? `${linkedPurchase.quantity} cartón${linkedPurchase.quantity === 1 ? '' : 'es'} · ${linkedPurchase.status}` : deposit.wallet_transaction_id ? 'Acreditado' : 'Sin acreditar'}</p>
                        </td>
                        <td className="px-4 py-4"><StatusBadge status={deposit.status} />{deposit.review_notes && <p className="mt-1 max-w-[220px] text-xs text-zinc-500">{deposit.review_notes}</p>}</td>
                        <td className="px-4 py-4 text-xs text-zinc-400">{formatDate(deposit.created_at)}{deposit.reviewed_at && <p className="text-zinc-600">Rev. {formatDate(deposit.reviewed_at)}</p>}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <DepositOcrControls id={deposit.id} disabled={!canReview || !deposit.receipt_url} />
                            <DepositActionButton
                              id={deposit.id}
                              action="approve"
                              disabled={!canReview || !canApprove}
                              disabledReason="Leé el comprobante con OCR o marcá revisión manual antes de aprobar"
                            />
                            <DepositActionButton id={deposit.id} action="reject" disabled={!canReview} />
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

function getOcrMetadata(metadata: Record<string, unknown> | null) {
  const ocr = metadata && typeof metadata.ocr === 'object' && metadata.ocr
    ? metadata.ocr as Record<string, unknown>
    : {}
  return {
    confidence: typeof ocr.confidence === 'number' ? ocr.confidence : null,
    senderDocument: typeof ocr.senderDocument === 'string' ? ocr.senderDocument : null,
    reviewRecommendation: typeof ocr.reviewRecommendation === 'string' ? ocr.reviewRecommendation : null,
    warnings: Array.isArray(ocr.warnings) ? ocr.warnings.map(String).filter(Boolean) : [],
  }
}

function OcrStatusBadge({
  status,
  recommendation,
}: {
  status: DepositRow['receipt_parse_status']
  recommendation: string | null
}) {
  if (status === 'manual') return <Badge className="bg-zinc-700 text-white hover:bg-zinc-700">Revisión manual</Badge>
  if (status === 'failed') return <Badge className="bg-rose-500 text-white hover:bg-rose-500">OCR fallido</Badge>
  if (status === 'parsed' && recommendation === 'ready_for_review') {
    return <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Coincidencias OK</Badge>
  }
  if (status === 'parsed' && recommendation === 'mismatch') {
    return <Badge className="bg-rose-500 text-white hover:bg-rose-500">Hay diferencias</Badge>
  }
  if (status === 'parsed') return <Badge className="bg-amber-300 text-zinc-950 hover:bg-amber-300">Revisar lectura</Badge>
  return <Badge className="bg-sky-500 text-white hover:bg-sky-500">Sin leer</Badge>
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-amber-300/20 bg-zinc-950/80 p-4 shadow-xl shadow-black/30"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p><p className="mt-1 font-mono text-3xl font-black text-white">{value}</p><p className="mt-1 text-xs text-zinc-400">{detail}</p></div>
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') return <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Aprobado</Badge>
  if (status === 'pending') return <Badge className="bg-amber-300 text-amber-950 hover:bg-amber-300">Pendiente</Badge>
  if (status === 'rejected') return <Badge className="bg-rose-500 text-white hover:bg-rose-500">Rechazado</Badge>
  return <Badge className="bg-zinc-700 text-zinc-100 hover:bg-zinc-700">Cancelado</Badge>
}

function formatMoney(amount: number, currency: string) {
  if (currency === 'ARS') return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(amount ?? 0))
  return `${Number(amount ?? 0)} ${currency}`
}

function formatARS(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}
