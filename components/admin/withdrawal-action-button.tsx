'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, ShieldCheck, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type DepositAuditRisk = 'low' | 'medium' | 'high'

interface DepositAuditItem {
  id: string
  amount: number
  currency: string
  paymentMethod: string | null
  paymentReference: string | null
  receiptUrl: string | null
  createdAt: string
  reviewRecommendation: string | null
  confidence: number | null
  autoApproved: boolean
  senderName: string | null
  risk: DepositAuditRisk
  flags: string[]
}

interface WithdrawalAudit {
  deposits: DepositAuditItem[]
  summary: {
    approvedCount: number
    approvedAmount: number
    riskCounts: Record<DepositAuditRisk, number>
    highestRisk: DepositAuditRisk
    needsManualCheck: boolean
  }
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'ARS', maximumFractionDigits: 0 }).format(Number(amount))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short' }).format(new Date(value))
}

function RiskBadge({ risk }: { risk: DepositAuditRisk }) {
  if (risk === 'high') return <Badge className="bg-rose-500 text-white hover:bg-rose-500">Riesgo alto</Badge>
  if (risk === 'medium') return <Badge className="bg-amber-300 text-zinc-950 hover:bg-amber-300">Revisar</Badge>
  return <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">OK</Badge>
}

export function WithdrawalActionButton({
  id,
  action,
  disabled,
}: {
  id: string
  action: 'approve' | 'reject'
  disabled?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [reference, setReference] = useState('')
  const [verified, setVerified] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audit, setAudit] = useState<WithdrawalAudit | null>(null)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState<string | null>(null)

  const approving = action === 'approve'

  const openDialog = async () => {
    setOpen(true)
    if (!approving) return
    setAuditLoading(true)
    setAuditError(null)
    try {
      const response = await fetch(`/api/admin/withdrawals/${id}/audit`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo cargar la verificación')
      setAudit(data.audit as WithdrawalAudit)
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : 'No se pudo cargar la verificación')
    } finally {
      setAuditLoading(false)
    }
  }

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/withdrawals/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          notes,
          settlement_reference: approving ? reference : null,
          verified: approving ? verified : undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo revisar el retiro')
      setOpen(false)
      setNotes('')
      setReference('')
      setVerified(false)
      setAudit(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo revisar el retiro')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        disabled={disabled}
        variant={approving ? 'default' : 'outline'}
        data-sound={approving ? 'ui.open' : 'ui.error'}
        onClick={openDialog}
        className={approving
          ? 'bg-emerald-400 font-bold text-zinc-950 hover:bg-emerald-300'
          : 'border-rose-400/40 bg-transparent text-rose-200 hover:bg-rose-500/10'}
      >
        {approving ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
        {approving ? 'Aprobar' : 'Rechazar'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approving ? <ShieldCheck className="h-5 w-5 text-emerald-300" /> : <XCircle className="h-5 w-5 text-rose-300" />}
              {approving ? 'Verificar y confirmar pago del retiro' : 'Rechazar retiro'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {approving
                ? 'Revisá los pagos que formaron el saldo del jugador contra tu homebanking antes de pagar. El saldo ya fue reservado al crear la solicitud.'
                : 'El monto reservado se reintegrará automáticamente al jugador.'}
            </DialogDescription>
          </DialogHeader>

          {approving && (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
              {auditLoading ? (
                <p className="flex items-center gap-2 text-sm text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" /> Cargando depósitos del jugador…</p>
              ) : auditError ? (
                <p className="text-sm text-rose-200">{auditError}</p>
              ) : audit ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-zinc-300">{audit.summary.approvedCount} depósito{audit.summary.approvedCount === 1 ? '' : 's'} aprobado{audit.summary.approvedCount === 1 ? '' : 's'}</span>
                    <span className="font-mono font-bold text-amber-300">{formatMoney(audit.summary.approvedAmount, 'ARS')}</span>
                    {audit.summary.riskCounts.high > 0 && <Badge className="bg-rose-500 text-white hover:bg-rose-500">{audit.summary.riskCounts.high} de alto riesgo</Badge>}
                    {audit.summary.riskCounts.medium > 0 && <Badge className="bg-amber-300 text-zinc-950 hover:bg-amber-300">{audit.summary.riskCounts.medium} a revisar</Badge>}
                  </div>

                  {audit.summary.needsManualCheck && (
                    <p className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-2 text-xs text-amber-100">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      Hay pagos que el filtro automático no confirmó del todo. Cotejalos manualmente con el banco antes de aprobar.
                    </p>
                  )}

                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {audit.deposits.length === 0 ? (
                      <p className="text-sm text-zinc-500">Este jugador no tiene depósitos aprobados registrados.</p>
                    ) : audit.deposits.map((deposit) => (
                      <div key={deposit.id} className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-white">{formatMoney(deposit.amount, deposit.currency)}</span>
                          <RiskBadge risk={deposit.risk} />
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">
                          {deposit.paymentMethod || 'Método sin definir'} · Op. {deposit.paymentReference || 's/n'} · {formatDate(deposit.createdAt)}
                        </p>
                        {deposit.senderName && <p className="text-xs text-zinc-500">De {deposit.senderName}</p>}
                        {typeof deposit.confidence === 'number' && <p className="text-[11px] text-zinc-600">Confianza OCR {Math.round(deposit.confidence * 100)}%{deposit.autoApproved ? ' · auto-aprobado' : ''}</p>}
                        {deposit.flags.length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {deposit.flags.map((flag) => (
                              <li key={flag} className="flex items-start gap-1 text-[11px] text-amber-200"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {flag}</li>
                            ))}
                          </ul>
                        )}
                        {deposit.receiptUrl && (
                          <a href={`/api/file?pathname=${encodeURIComponent(deposit.receiptUrl)}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-sky-300">
                            Ver comprobante <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div className="grid gap-4">
            {approving && (
              <div className="space-y-2">
                <Label>Número de operación del pago realizado</Label>
                <Input value={reference} onChange={(event) => setReference(event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Nota administrativa</Label>
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
            </div>

            {approving && (
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-3">
                <Checkbox checked={verified} onCheckedChange={(value) => setVerified(value === true)} className="mt-0.5 border-emerald-400 data-[state=checked]:bg-emerald-500" />
                <span className="text-sm text-zinc-200">Verifiqué que cada pago listado se acreditó realmente en la cuenta de destino y los datos coinciden.</span>
              </label>
            )}

            {error && <p className="rounded-md border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" data-sound="ui.close" onClick={() => setOpen(false)} className="border-white/15 bg-transparent text-zinc-200">Cancelar</Button>
            <Button
              data-sound={approving ? 'wallet.approved' : 'ui.error'}
              onClick={submit}
              disabled={busy || (approving && (reference.trim().length < 3 || !verified))}
              className={approving ? 'bg-emerald-400 font-bold text-zinc-950 hover:bg-emerald-300' : 'bg-rose-500 font-bold text-white hover:bg-rose-400'}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {approving ? 'Confirmar pago' : 'Confirmar rechazo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
