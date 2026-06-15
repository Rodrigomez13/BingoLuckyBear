import Link from 'next/link'
import { ArrowLeft, Gamepad2 } from 'lucide-react'
import { AdminEconomyNav } from '@/components/admin/admin-economy-nav'
import { BearLogo } from '@/components/bear-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAdminPage } from '@/lib/auth/roles'

interface PurchaseRow {
  id: string
  user_id: string | null
  game_type: string
  purchase_type: string
  wallet_kind: string
  amount: number
  quantity: number
  status: string
  related_type: string | null
  related_id: string | null
  description: string | null
  created_at: string
}

interface ProfileRow { id: string; email: string | null; full_name: string | null; alias: string | null }

export default async function AdminGameConsumptionPage() {
  const { serviceClient } = await requireAdminPage()
  const [{ data: purchases }, { data: trucoTransactions }] = await Promise.all([
    serviceClient.from('game_purchases').select('id, user_id, game_type, purchase_type, wallet_kind, amount, quantity, status, related_type, related_id, description, created_at').order('created_at', { ascending: false }).limit(300),
    serviceClient.from('lbb_wallet_transactions').select('id, user_id, wallet_kind, amount, related_type, related_id, description, created_at').eq('transaction_type', 'truco_entry_fee').order('created_at', { ascending: false }).limit(300),
  ])

  const purchaseRows = (purchases ?? []) as PurchaseRow[]
  const recordedTrucoRefs = new Set(purchaseRows.filter((row) => row.game_type === 'truco').map((row) => row.related_id).filter(Boolean))
  const fallbackTrucoRows: PurchaseRow[] = (trucoTransactions ?? [])
    .filter((row) => !recordedTrucoRefs.has(row.related_id))
    .map((row) => ({
      id: row.id,
      user_id: row.user_id,
      game_type: 'truco',
      purchase_type: 'truco_entry_fee',
      wallet_kind: row.wallet_kind,
      amount: Math.abs(Number(row.amount)),
      quantity: 1,
      status: 'paid',
      related_type: row.related_type,
      related_id: row.related_id,
      description: row.description,
      created_at: row.created_at,
    }))
  const rows = [...purchaseRows, ...fallbackTrucoRows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))] as string[]
  const { data: profiles } = userIds.length ? await serviceClient.from('customer_profiles').select('id, email, full_name, alias').in('id', userIds) : { data: [] }
  const profileById = new Map(((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]))
  const totals = rows.reduce<Record<string, number>>((result, row) => ({ ...result, [row.game_type]: (result[row.game_type] ?? 0) + Number(row.amount) }), {})

  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-zinc-100">
      <div className="lbb-ambient" />
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/70 p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><BearLogo size={44} /><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300">Economía</p><h1 className="font-mono text-2xl font-black text-white sm:text-4xl">Consumos por juego</h1><p className="mt-1 text-sm text-zinc-400">Detalle de compras y entradas separado por Bingo, Truco y torneos.</p></div></div>
          <Button asChild variant="outline" className="border-white/15 bg-transparent text-amber-200 hover:bg-amber-300/10"><Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al admin</Link></Button>
        </header>
        <AdminEconomyNav />

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <GameMetric label="Bingo" amount={totals.bingo ?? 0} />
          <GameMetric label="Truco" amount={totals.truco ?? 0} />
          <GameMetric label="Torneos" amount={totals.tournament ?? 0} />
        </div>

        <Card className="border-white/10 bg-zinc-950/85 text-zinc-100">
          <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Gamepad2 className="h-5 w-5 text-amber-300" /> Detalle de consumos</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-black/30 text-left text-[10px] uppercase tracking-[0.16em] text-zinc-500"><tr><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Juego</th><th className="px-4 py-3">Detalle</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Cantidad</th><th className="px-4 py-3 text-right">Importe</th><th className="px-4 py-3">Referencia</th><th className="px-4 py-3">Fecha</th></tr></thead>
                <tbody className="divide-y divide-white/10">
                  {rows.length === 0 ? <tr><td colSpan={8} className="px-4 py-10 text-center text-zinc-500">No hay consumos registrados.</td></tr> : rows.map((row) => {
                    const profile = row.user_id ? profileById.get(row.user_id) : null
                    return <tr key={row.id} className="hover:bg-white/[0.03]"><td className="px-4 py-4"><p className="font-bold text-white">{profile?.full_name || profile?.alias || 'Invitado'}</p><p className="text-xs text-zinc-500">{profile?.email || row.user_id || 'Sin cuenta'}</p></td><td className="px-4 py-4"><Badge className={gameClass(row.game_type)}>{gameLabel(row.game_type)}</Badge></td><td className="px-4 py-4"><p className="font-semibold text-white">{purchaseLabel(row.purchase_type)}</p><p className="max-w-[240px] truncate text-xs text-zinc-500">{row.description || walletLabel(row.wallet_kind)}</p></td><td className="px-4 py-4"><Badge className={statusClass(row.status)}>{statusLabel(row.status)}</Badge></td><td className="px-4 py-4 text-right font-mono">{row.quantity}</td><td className="px-4 py-4 text-right font-mono font-black text-amber-300">{formatNumber(Number(row.amount))}</td><td className="px-4 py-4"><p className="text-xs text-zinc-300">{row.related_type || 'operación'}</p><p className="max-w-[160px] truncate font-mono text-[10px] text-zinc-600">{row.related_id || row.id}</p></td><td className="px-4 py-4 text-xs text-zinc-400">{formatDate(row.created_at)}</td></tr>
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

function GameMetric({ label, amount }: { label: string; amount: number }) { return <div className="border border-white/10 bg-zinc-950/80 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p><p className="mt-1 font-mono text-3xl font-black text-white">{formatNumber(amount)}</p><p className="mt-1 text-xs text-zinc-500">unidades de saldo consumidas</p></div> }
function formatNumber(value: number) { return new Intl.NumberFormat('es-AR').format(value) }
function formatDate(value: string) { return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) }
function walletLabel(kind: string) { return kind === 'bonus_points' ? 'LBB Points' : 'Cash Credits' }
function gameLabel(game: string) { return game === 'bingo' ? 'Bingo' : game === 'truco' ? 'Truco' : 'Torneo' }
function gameClass(game: string) { return game === 'bingo' ? 'bg-amber-300 text-zinc-950 hover:bg-amber-300' : game === 'truco' ? 'bg-emerald-500 text-white hover:bg-emerald-500' : 'bg-sky-400 text-zinc-950 hover:bg-sky-400' }
function purchaseLabel(type: string) { const labels: Record<string, string> = { bingo_card: 'Cartones', truco_entry_fee: 'Entrada a partida', tournament_entry: 'Entrada a torneo', pack: 'Paquete', manual: 'Consumo manual' }; return labels[type] ?? type }
function statusLabel(status: string) { const labels: Record<string, string> = { pending: 'Pendiente', paid: 'Pagado', cancelled: 'Cancelado', refunded: 'Reintegrado', failed: 'Fallido' }; return labels[status] ?? status }
function statusClass(status: string) { return status === 'paid' ? 'bg-emerald-500 text-white hover:bg-emerald-500' : status === 'pending' ? 'bg-amber-300 text-zinc-950 hover:bg-amber-300' : status === 'refunded' ? 'bg-sky-400 text-zinc-950 hover:bg-sky-400' : 'bg-zinc-700 text-white hover:bg-zinc-700' }
