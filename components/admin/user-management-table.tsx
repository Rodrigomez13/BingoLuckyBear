'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BadgeDollarSign,
  CheckCircle2,
  CircleDollarSign,
  Ellipsis,
  History,
  Loader2,
  Search,
  ShieldCheck,
  WalletCards,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserAdminEditor } from '@/components/admin/user-admin-editor'
import { WithdrawalActionButton } from '@/components/admin/withdrawal-action-button'

type Role = 'admin' | 'operator' | 'player'
type WalletKind = 'bonus_points' | 'cash_credits'
type Direction = 'credit' | 'debit'
type DepositAction = 'approve' | 'reject'

export interface AdminUserRow {
  id: string
  email: string
  alias: string
  fullName: string
  phone: string
  dni: string
  role: Role
  avatarKey: string
  avatarLabel: string
  avatarSrc: string
  emailConfirmed: boolean
  createdAt: string | null
  lastSignInAt: string | null
  bonus: number
  cash: number
  cards: { total: number; approved: number; pending: number; rejected: number }
  matchesPlayed: number
  matchesWon: number
  matchesLost: number
  rankingPoints: number
  deposits: Array<{
    id: string
    amount: number
    currency: string
    walletKind: WalletKind
    paymentMethod: string
    paymentReference: string | null
    status: string
    createdAt: string
    matchedBy: 'user_id' | 'email' | 'dni'
  }>
  withdrawals?: Array<{
    id: string
    amount: number
    currency: string
    payoutAccountKind: string
    payoutAccount: string
    payoutHolderName: string
    status: string
    settlementReference: string | null
    createdAt: string
  }>
  transactions: Array<{
    id: string
    walletKind: WalletKind
    transactionType: string
    amount: number
    balanceAfter: number | null
    description: string | null
    createdAt: string
  }>
}

interface AdjustmentTarget {
  userIds: string[]
  direction: Direction
}

interface DepositReviewTarget {
  userIds: string[]
  action: DepositAction
}

export function UserManagementTable({
  rows,
  currentUserId,
  canManageRoles,
}: {
  rows: AdminUserRow[]
  currentUserId: string
  canManageRoles: boolean
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activityUserId, setActivityUserId] = useState<string | null>(null)
  const [adjustment, setAdjustment] = useState<AdjustmentTarget | null>(null)
  const [depositReview, setDepositReview] = useState<DepositReviewTarget | null>(null)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [targetRole, setTargetRole] = useState<Role>('player')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const filteredRows = useMemo(() => {
    const term = normalizeSearch(search)
    if (!term) return rows
    return rows.filter((row) =>
      [row.alias, row.fullName, row.email, row.dni, row.phone, row.id]
        .some((value) => normalizeSearch(value).includes(term)),
    )
  }, [rows, search])

  const selectedRows = rows.filter((row) => selectedIds.includes(row.id))
  const activityUser = rows.find((row) => row.id === activityUserId) ?? null
  const allVisibleSelected = filteredRows.length > 0 && filteredRows.every((row) => selectedIds.includes(row.id))
  const selectedPendingDeposits = selectedRows.reduce(
    (total, row) => total + row.deposits.filter((deposit) => deposit.status === 'pending').length,
    0,
  )
  const selectedPendingWithdrawals = selectedRows.reduce(
    (total, row) => total + (row.withdrawals ?? []).filter((withdrawal) => withdrawal.status === 'pending').length,
    0,
  )

  const toggleUser = (userId: string) => {
    setSelectedIds((current) => current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId])
  }

  const toggleVisible = () => {
    const visibleIds = filteredRows.map((row) => row.id)
    setSelectedIds((current) => {
      if (allVisibleSelected) return current.filter((id) => !visibleIds.includes(id))
      return [...new Set([...current, ...visibleIds])]
    })
  }

  const reviewDeposits = async () => {
    if (!depositReview) return
    const targetRows = rows.filter((row) => depositReview.userIds.includes(row.id))
    const deposits = targetRows.flatMap((row) =>
      row.deposits
        .filter((deposit) => deposit.status === 'pending')
        .map((deposit) => ({ ...deposit, targetUserId: row.id })),
    )

    if (deposits.length === 0) {
      setFeedback({ tone: 'error', text: 'Los usuarios seleccionados no tienen depósitos pendientes.' })
      setDepositReview(null)
      return
    }

    setBusy(true)
    setFeedback(null)
    try {
      for (const deposit of deposits) {
        const response = await fetch(`/api/admin/deposits/${deposit.id}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: depositReview.action,
            target_user_id: deposit.targetUserId,
            notes: depositReview.action === 'approve'
              ? 'Aprobado desde la lista de usuarios'
              : 'Rechazado desde la lista de usuarios',
          }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'No se pudo revisar un depósito')
      }

      setFeedback({
        tone: 'success',
        text: `${deposits.length} depósito${deposits.length !== 1 ? 's' : ''} ${depositReview.action === 'approve' ? 'aprobado' : 'rechazado'}${deposits.length !== 1 ? 's' : ''}.`,
      })
      setDepositReview(null)
      setSelectedIds([])
      router.refresh()
    } catch (error) {
      setFeedback({ tone: 'error', text: error instanceof Error ? error.message : 'No se pudieron revisar los depósitos' })
    } finally {
      setBusy(false)
    }
  }

  const updateRoles = async () => {
    if (!canManageRoles || selectedRows.length === 0) return
    setBusy(true)
    setFeedback(null)
    try {
      for (const row of selectedRows) {
        if (row.id === currentUserId && targetRole !== 'admin') {
          throw new Error('No podés quitarte tu propio rol de administrador.')
        }
        const response = await fetch(`/api/admin/users/${row.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: targetRole,
            full_name: row.fullName,
            alias: row.alias,
            phone: row.phone,
            dni: row.dni,
            reason: `Cambio masivo de rol a ${targetRole}`,
          }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'No se pudo actualizar un rol')
      }
      setFeedback({ tone: 'success', text: `Rol actualizado para ${selectedRows.length} usuario${selectedRows.length !== 1 ? 's' : ''}.` })
      setRoleDialogOpen(false)
      setSelectedIds([])
      router.refresh()
    } catch (error) {
      setFeedback({ tone: 'error', text: error instanceof Error ? error.message : 'No se pudieron actualizar los roles' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, DNI, email o teléfono"
            className="border-zinc-700 bg-zinc-900 pl-9 text-white"
          />
        </div>
        <p className="text-sm text-zinc-500">{filteredRows.length} de {rows.length} usuarios</p>
      </div>

      {feedback && (
        <div className={`mb-4 rounded-md border p-3 text-sm font-semibold ${
          feedback.tone === 'success'
            ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
            : 'border-rose-400/30 bg-rose-500/10 text-rose-100'
        }`}>
          {feedback.text}
        </div>
      )}

      {selectedRows.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 rounded-md border border-amber-400/25 bg-amber-400/10 p-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="font-bold text-amber-50">{selectedRows.length} usuario{selectedRows.length !== 1 ? 's' : ''} seleccionado{selectedRows.length !== 1 ? 's' : ''}</p>
            <p className="text-xs text-amber-100/65">{selectedPendingDeposits} depósito{selectedPendingDeposits !== 1 ? 's' : ''} · {selectedPendingWithdrawals} retiro{selectedPendingWithdrawals !== 1 ? 's' : ''} pendiente{selectedPendingWithdrawals !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setAdjustment({ userIds: selectedIds, direction: 'credit' })} className="bg-emerald-400 font-bold text-zinc-950 hover:bg-emerald-300">
              <CircleDollarSign className="mr-2 h-4 w-4" /> Acreditar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAdjustment({ userIds: selectedIds, direction: 'debit' })} className="border-amber-300/40 bg-transparent text-amber-100 hover:bg-amber-300/10">
              <BadgeDollarSign className="mr-2 h-4 w-4" /> Debitar
            </Button>
            {selectedPendingDeposits > 0 && (
              <>
                <Button size="sm" variant="outline" onClick={() => setDepositReview({ userIds: selectedIds, action: 'approve' })} className="border-emerald-400/40 bg-transparent text-emerald-200 hover:bg-emerald-500/10">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Aprobar depósitos
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDepositReview({ userIds: selectedIds, action: 'reject' })} className="border-rose-400/40 bg-transparent text-rose-200 hover:bg-rose-500/10">
                  <XCircle className="mr-2 h-4 w-4" /> Rechazar
                </Button>
              </>
            )}
            {canManageRoles && (
              <Button size="sm" variant="outline" onClick={() => setRoleDialogOpen(true)} className="border-sky-400/40 bg-transparent text-sky-200 hover:bg-sky-500/10">
                <ShieldCheck className="mr-2 h-4 w-4" /> Cambiar rol
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])} className="text-zinc-300 hover:bg-white/10 hover:text-white">Limpiar</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              <th className="w-10 px-3 py-2">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} className="h-4 w-4 accent-amber-300" aria-label="Seleccionar usuarios visibles" />
              </th>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Rol</th>
              <th className="px-3 py-2 text-right">Saldo</th>
              <th className="px-3 py-2 text-center">Fondos</th>
              <th className="px-3 py-2 text-center">Cartones</th>
              <th className="px-3 py-2 text-center">Truco</th>
              <th className="px-3 py-2">Último acceso</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const pendingDeposits = row.deposits.filter((deposit) => deposit.status === 'pending')
              const withdrawals = row.withdrawals ?? []
              const pendingWithdrawals = withdrawals.filter((withdrawal) => withdrawal.status === 'pending')
              return (
                <tr key={row.id} className="rounded-md bg-black/25 align-middle">
                  <td className="rounded-l-md border-y border-l border-white/10 px-3 py-3">
                    <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleUser(row.id)} className="h-4 w-4 accent-amber-300" aria-label={`Seleccionar ${row.alias}`} />
                  </td>
                  <td className="border-y border-white/10 px-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-amber-300/25 bg-amber-300/10">
                        {/* Avatar assets are served by the authenticated local API. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={row.avatarSrc} alt={row.avatarLabel} className="h-full w-full object-cover" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">{row.alias}</p>
                        <p className="truncate text-xs text-zinc-500">{row.email}</p>
                        <p className="mt-1 truncate text-[10px] text-zinc-600">{row.dni ? `DNI ${row.dni}` : 'Sin DNI'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="border-y border-white/10 px-3 py-3">
                    <RoleBadge role={row.role} />
                    <p className="mt-1 text-[10px] text-zinc-500">{row.emailConfirmed ? 'Verificado' : 'Sin verificar'}</p>
                  </td>
                  <td className="border-y border-white/10 px-3 py-3 text-right">
                    <p className="font-mono font-black text-amber-300">{row.bonus} LBB</p>
                    <p className="text-xs text-zinc-500">Cash {formatNumber(row.cash)}</p>
                  </td>
                  <td className="border-y border-white/10 px-3 py-3 text-center">
                    {pendingDeposits.length + pendingWithdrawals.length > 0 ? (
                      <Badge className="bg-amber-300 text-zinc-950 hover:bg-amber-300">{pendingDeposits.length + pendingWithdrawals.length} pendiente{pendingDeposits.length + pendingWithdrawals.length !== 1 ? 's' : ''}</Badge>
                    ) : (
                      <span className="text-zinc-600">Sin pendientes</span>
                    )}
                    <p className="mt-1 text-[10px] text-zinc-500">{row.deposits.length} cargas · {withdrawals.length} retiros</p>
                  </td>
                  <td className="border-y border-white/10 px-3 py-3 text-center">
                    <p className="font-black text-white">{row.cards.total}</p>
                    <p className="text-[10px] text-zinc-500">{row.cards.approved} ok · {row.cards.pending} pend.</p>
                  </td>
                  <td className="border-y border-white/10 px-3 py-3 text-center">
                    <p className="font-black text-white">{row.matchesWon}/{row.matchesPlayed}</p>
                    <p className="text-[10px] text-zinc-500">{row.rankingPoints} pts</p>
                  </td>
                  <td className="border-y border-white/10 px-3 py-3 text-xs text-zinc-400">{formatDate(row.lastSignInAt)}</td>
                  <td className="rounded-r-md border-y border-r border-white/10 px-3 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" size="icon" variant="outline" className="border-white/15 bg-transparent text-zinc-200 hover:bg-white/10" aria-label={`Acciones para ${row.alias}`}>
                          <Ellipsis className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 border-white/10 bg-zinc-950 text-zinc-100">
                        <DropdownMenuLabel className="text-xs text-zinc-500">Cuenta y actividad</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => setActivityUserId(row.id)} className="focus:bg-white/10 focus:text-white">
                          <History className="h-4 w-4" /> Ver movimientos
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setAdjustment({ userIds: [row.id], direction: 'credit' })} className="focus:bg-white/10 focus:text-white">
                          <CircleDollarSign className="h-4 w-4" /> Acreditar saldo
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setAdjustment({ userIds: [row.id], direction: 'debit' })} className="focus:bg-white/10 focus:text-white">
                          <BadgeDollarSign className="h-4 w-4" /> Debitar saldo
                        </DropdownMenuItem>
                        {pendingDeposits.length > 0 && (
                          <>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem onSelect={() => setDepositReview({ userIds: [row.id], action: 'approve' })} className="text-emerald-200 focus:bg-emerald-500/10 focus:text-emerald-100">
                              <CheckCircle2 className="h-4 w-4" /> Aprobar depósitos
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setDepositReview({ userIds: [row.id], action: 'reject' })} className="text-rose-200 focus:bg-rose-500/10 focus:text-rose-100">
                              <XCircle className="h-4 w-4" /> Rechazar depósitos
                            </DropdownMenuItem>
                          </>
                        )}
                        {pendingWithdrawals.length > 0 && (
                          <DropdownMenuItem onSelect={() => setActivityUserId(row.id)} className="text-amber-100 focus:bg-amber-500/10 focus:text-amber-50">
                            <WalletCards className="h-4 w-4" /> Revisar retiros
                          </DropdownMenuItem>
                        )}
                        {canManageRoles && (
                          <>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <UserAdminEditor
                              trigger="menu"
                              user={{ id: row.id, email: row.email, role: row.role, fullName: row.fullName, alias: row.alias, phone: row.phone, dni: row.dni }}
                            />
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredRows.length === 0 && <div className="py-10 text-center text-sm text-zinc-500">No hay usuarios que coincidan con la búsqueda.</div>}
      </div>

      <ActivityDialog
        user={activityUser}
        onClose={() => setActivityUserId(null)}
        onAdjust={(direction) => {
          if (!activityUser) return
          setActivityUserId(null)
          setAdjustment({ userIds: [activityUser.id], direction })
        }}
        onReview={(action) => {
          if (!activityUser) return
          setActivityUserId(null)
          setDepositReview({ userIds: [activityUser.id], action })
        }}
      />
      <WalletAdjustmentDialog
        target={adjustment}
        rows={rows}
        busy={busy}
        onClose={() => setAdjustment(null)}
        onSubmit={async (walletKind, amount, reason) => {
          if (!adjustment) return
          setBusy(true)
          setFeedback(null)
          try {
            for (const userId of adjustment.userIds) {
              const response = await fetch('/api/admin/wallet/adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: userId, wallet_kind: walletKind, direction: adjustment.direction, amount, reason }),
              })
              const data = await response.json()
              if (!response.ok) throw new Error(data.error || 'No se pudo ajustar un saldo')
            }
            setFeedback({
              tone: 'success',
              text: `Movimiento aplicado a ${adjustment.userIds.length} usuario${adjustment.userIds.length !== 1 ? 's' : ''}.`,
            })
            setAdjustment(null)
            setSelectedIds([])
            router.refresh()
          } catch (error) {
            setFeedback({ tone: 'error', text: error instanceof Error ? error.message : 'No se pudieron ajustar los saldos' })
          } finally {
            setBusy(false)
          }
        }}
      />

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="border-white/10 bg-zinc-950 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Cambiar rol en simultáneo</DialogTitle>
            <DialogDescription className="text-zinc-400">Se aplicará el mismo rol a {selectedRows.length} usuario{selectedRows.length !== 1 ? 's' : ''}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nuevo rol</Label>
            <select value={targetRole} onChange={(event) => setTargetRole(event.target.value as Role)} className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white">
              <option value="player">Jugador</option>
              <option value="operator">Operador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)} className="border-white/15 bg-transparent text-zinc-200">Cancelar</Button>
            <Button onClick={updateRoles} disabled={busy} className="bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Aplicar rol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(depositReview)} onOpenChange={(open) => !open && setDepositReview(null)}>
        <DialogContent className="border-white/10 bg-zinc-950 text-zinc-100">
          <DialogHeader>
            <DialogTitle>{depositReview?.action === 'approve' ? 'Aprobar depósitos' : 'Rechazar depósitos'}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {depositReview?.action === 'approve'
                ? 'La aprobación acreditará saldo o activará las compras vinculadas. Cada operación quedará auditada.'
                : 'El rechazo cancelará automáticamente las compras y cartones asociados.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositReview(null)} className="border-white/15 bg-transparent text-zinc-200">Cancelar</Button>
            <Button
              onClick={reviewDeposits}
              disabled={busy}
              className={depositReview?.action === 'approve' ? 'bg-emerald-400 font-bold text-zinc-950 hover:bg-emerald-300' : 'bg-rose-500 font-bold text-white hover:bg-rose-400'}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function WalletAdjustmentDialog({
  target,
  rows,
  busy,
  onClose,
  onSubmit,
}: {
  target: AdjustmentTarget | null
  rows: AdminUserRow[]
  busy: boolean
  onClose: () => void
  onSubmit: (walletKind: WalletKind, amount: number, reason: string) => Promise<void>
}) {
  const [walletKind, setWalletKind] = useState<WalletKind>('bonus_points')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const targets = rows.filter((row) => target?.userIds.includes(row.id))

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-white/10 bg-zinc-950 text-zinc-100">
        <DialogHeader>
          <DialogTitle>{target?.direction === 'credit' ? 'Acreditar saldo' : 'Debitar saldo'}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            El movimiento se aplicará a {targets.length} usuario{targets.length !== 1 ? 's' : ''} y generará una transacción individual auditada.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="rounded-md border border-white/10 bg-black/25 p-3 text-sm text-zinc-300">
            {targets.slice(0, 4).map((row) => row.alias).join(', ')}
            {targets.length > 4 ? ` y ${targets.length - 4} más` : ''}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Saldo</Label>
              <select value={walletKind} onChange={(event) => setWalletKind(event.target.value as WalletKind)} className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white">
                <option value="bonus_points">LBB Points</option>
                <option value="cash_credits">Créditos cash</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Monto por usuario</Label>
              <Input type="number" min={1} step={1} value={amount} onChange={(event) => setAmount(event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ej: transferencia verificada / corrección operativa" className="border-zinc-700 bg-zinc-900 text-white" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/15 bg-transparent text-zinc-200">Cancelar</Button>
          <Button
            disabled={busy || Number(amount) <= 0 || reason.trim().length < 4}
            onClick={() => onSubmit(walletKind, Math.trunc(Number(amount)), reason.trim())}
            className={target?.direction === 'credit' ? 'bg-emerald-400 font-bold text-zinc-950 hover:bg-emerald-300' : 'bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200'}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Aplicar movimiento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ActivityDialog({
  user,
  onClose,
  onAdjust,
  onReview,
}: {
  user: AdminUserRow | null
  onClose: () => void
  onAdjust: (direction: Direction) => void
  onReview: (action: DepositAction) => void
}) {
  const pendingDeposits = user?.deposits.filter((deposit) => deposit.status === 'pending') ?? []
  const withdrawals = user?.withdrawals ?? []
  const pendingWithdrawals = withdrawals.filter((withdrawal) => withdrawal.status === 'pending')

  return (
    <Dialog open={Boolean(user)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] w-[min(96vw,900px)] max-w-none overflow-y-auto border-white/10 bg-zinc-950 text-zinc-100">
        <DialogHeader>
          <DialogTitle>{user?.alias ?? 'Usuario'}</DialogTitle>
          <DialogDescription className="text-zinc-400">Saldo, cargas, retiros y últimos movimientos de la cuenta.</DialogDescription>
        </DialogHeader>
        {user && (
          <div className="grid gap-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Summary label="LBB Points" value={formatNumber(user.bonus)} />
              <Summary label="Créditos cash" value={formatNumber(user.cash)} />
              <Summary label="Pendientes" value={String(pendingDeposits.length + pendingWithdrawals.length)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onAdjust('credit')} className="bg-emerald-400 font-bold text-zinc-950 hover:bg-emerald-300"><CircleDollarSign className="mr-2 h-4 w-4" /> Acreditar</Button>
              <Button size="sm" variant="outline" onClick={() => onAdjust('debit')} className="border-amber-300/40 bg-transparent text-amber-100"><BadgeDollarSign className="mr-2 h-4 w-4" /> Debitar</Button>
              {pendingDeposits.length > 0 && (
                <>
                  <Button size="sm" variant="outline" onClick={() => onReview('approve')} className="border-emerald-400/40 bg-transparent text-emerald-200"><CheckCircle2 className="mr-2 h-4 w-4" /> Aprobar pendientes</Button>
                  <Button size="sm" variant="outline" onClick={() => onReview('reject')} className="border-rose-400/40 bg-transparent text-rose-200"><XCircle className="mr-2 h-4 w-4" /> Rechazar pendientes</Button>
                </>
              )}
            </div>
            <section>
              <h3 className="mb-2 flex items-center gap-2 font-bold text-white"><WalletCards className="h-4 w-4 text-amber-300" /> Depósitos</h3>
              <div className="divide-y divide-white/10 rounded-md border border-white/10">
                {user.deposits.length === 0 ? <p className="p-4 text-sm text-zinc-500">No hay depósitos registrados.</p> : user.deposits.map((deposit) => (
                  <div key={deposit.id} className="grid gap-2 p-3 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <div>
                      <p className="font-semibold text-white">{deposit.paymentMethod} · {deposit.paymentReference || 'Sin referencia'}</p>
                      <p className="text-xs text-zinc-500">{formatDate(deposit.createdAt)} · vínculo por {deposit.matchedBy === 'user_id' ? 'cuenta' : deposit.matchedBy === 'dni' ? 'DNI' : 'email'}</p>
                    </div>
                    <p className="font-mono font-black text-amber-300">{formatMoney(deposit.amount, deposit.currency)}</p>
                    <StatusBadge status={deposit.status} />
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="mb-2 flex items-center gap-2 font-bold text-white"><BadgeDollarSign className="h-4 w-4 text-amber-300" /> Retiros</h3>
              <div className="divide-y divide-white/10 rounded-md border border-white/10">
                {withdrawals.length === 0 ? <p className="p-4 text-sm text-zinc-500">No hay retiros registrados.</p> : withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="grid gap-2 p-3 text-sm lg:grid-cols-[1fr_auto_auto] lg:items-center">
                    <div>
                      <p className="font-semibold text-white">{withdrawal.payoutAccountKind} · {withdrawal.payoutAccount}</p>
                      <p className="text-xs text-zinc-500">{withdrawal.payoutHolderName} · {formatDate(withdrawal.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-black text-amber-300">{formatMoney(withdrawal.amount, withdrawal.currency)}</p>
                      <StatusBadge status={withdrawal.status} />
                    </div>
                    {withdrawal.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <WithdrawalActionButton id={withdrawal.id} action="approve" />
                        <WithdrawalActionButton id={withdrawal.id} action="reject" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="mb-2 flex items-center gap-2 font-bold text-white"><History className="h-4 w-4 text-emerald-300" /> Movimientos recientes</h3>
              <div className="divide-y divide-white/10 rounded-md border border-white/10">
                {user.transactions.length === 0 ? <p className="p-4 text-sm text-zinc-500">No hay movimientos registrados.</p> : user.transactions.map((transaction) => (
                  <div key={transaction.id} className="grid gap-2 p-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="font-semibold text-white">{transactionLabel(transaction.transactionType)}</p>
                      <p className="text-xs text-zinc-500">{transaction.description || 'Sin descripción'} · {formatDate(transaction.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-black ${transaction.amount >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{transaction.amount >= 0 ? '+' : ''}{formatNumber(transaction.amount)}</p>
                      <p className="text-[10px] text-zinc-500">{transaction.walletKind === 'bonus_points' ? 'LBB' : 'Cash'} · saldo {formatNumber(transaction.balanceAfter ?? 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-white/10 bg-white/[0.04] p-3"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</p><p className="mt-1 font-mono text-2xl font-black text-white">{value}</p></div>
}

function RoleBadge({ role }: { role: Role }) {
  if (role === 'admin') return <Badge className="bg-amber-300 text-zinc-950 hover:bg-amber-300">Admin</Badge>
  if (role === 'operator') return <Badge className="bg-sky-400 text-zinc-950 hover:bg-sky-400">Operador</Badge>
  return <Badge className="bg-zinc-700 text-zinc-100 hover:bg-zinc-700">Jugador</Badge>
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') return <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Aprobado</Badge>
  if (status === 'rejected' || status === 'cancelled') return <Badge className="bg-rose-500 text-white hover:bg-rose-500">Rechazado</Badge>
  return <Badge className="bg-amber-300 text-zinc-950 hover:bg-amber-300">Pendiente</Badge>
}

function normalizeSearch(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w@.+-]/g, '')
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-AR').format(value)
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'ARS', maximumFractionDigits: 0 }).format(value)
}

function transactionLabel(type: string) {
  const labels: Record<string, string> = {
    signup_bonus: 'Bono inicial',
    admin_credit: 'Crédito administrativo',
    admin_debit: 'Débito administrativo',
    deposit_approved: 'Depósito aprobado',
    bingo_purchase: 'Compra de cartones',
    truco_entry_fee: 'Entrada a Truco',
    truco_prize: 'Premio de Truco',
    game_purchase: 'Compra de juego',
    game_refund: 'Reintegro',
    refund: 'Reintegro',
    adjustment: 'Ajuste',
  }
  return labels[type] || type.replace(/_/g, ' ')
}
