'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowDownToLine, ArrowUpFromLine, FileText, Image as ImageIcon, Landmark, Loader2, RefreshCw, XCircle } from 'lucide-react'
import { PAYMENT_METHODS } from '@/lib/payment'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FundRequest {
  id: string
  amount: number
  currency: string
  status: string
  created_at: string
  review_notes?: string | null
  payment_method?: string
  payment_reference?: string | null
  payout_account_kind?: string
  payout_account?: string
  settlement_reference?: string | null
}

interface FundsData {
  paymentAccount: {
    holder?: string | null
    alias?: string | null
    cbu?: string | null
    bank?: string | null
    concept?: string | null
    note?: string | null
  } | null
  payoutProfile: {
    payout_account_kind?: string | null
    payout_account?: string | null
    payout_holder_name?: string | null
  } | null
  deposits: FundRequest[]
  withdrawals: FundRequest[]
}

const MAX_RECEIPT_SIZE = 8 * 1024 * 1024
const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export function FundsPanel({
  cashBalance,
  onChanged,
}: {
  cashBalance: number
  onChanged: () => Promise<void>
}) {
  const [mode, setMode] = useState<'deposit' | 'withdrawal' | 'history'>('deposit')
  const [data, setData] = useState<FundsData | null>(null)
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const response = await fetch('/api/customer/funds', { cache: 'no-store' })
    const json = await response.json()
    if (!response.ok) throw new Error(json.error || 'No se pudieron cargar las solicitudes')
    setData(json)
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar saldo'))
  }, [])

  const parsedAmount = Math.trunc(Number(amount))
  const payoutReady = Boolean(
    data?.payoutProfile?.payout_account_kind
    && data.payoutProfile.payout_account
    && data.payoutProfile.payout_holder_name,
  )

  const history = useMemo(() => {
    const deposits = (data?.deposits ?? []).map((item) => ({ ...item, kind: 'deposit' as const }))
    const withdrawals = (data?.withdrawals ?? []).map((item) => ({ ...item, kind: 'withdrawal' as const }))
    return [...deposits, ...withdrawals].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }, [data])

  const uploadReceipt = async () => {
    if (!file) throw new Error('Subí el comprobante de transferencia')
    if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) throw new Error('El comprobante debe ser JPG, PNG, WebP o PDF')
    if (file.size > MAX_RECEIPT_SIZE) throw new Error('El comprobante no debe superar 8 MB')

    const form = new FormData()
    form.append('file', file)
    const response = await fetch('/api/upload', { method: 'POST', body: form })
    const json = await response.json()
    if (!response.ok) throw new Error(json.error || 'No se pudo subir el comprobante')
    return String(json.pathname)
  }

  const submitDeposit = async () => {
    if (parsedAmount <= 0) throw new Error('Ingresá el monto transferido')
    if (!paymentMethod || !paymentReference.trim()) throw new Error('Completá método y número de operación')
    const receiptUrl = await uploadReceipt()
    const response = await fetch('/api/customer/funds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deposit',
        amount: parsedAmount,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        receipt_url: receiptUrl,
      }),
    })
    const json = await response.json()
    if (!response.ok) throw new Error(json.error || 'No se pudo solicitar la carga')
    setMessage('Carga enviada. El saldo se acreditará cuando el comprobante sea aprobado.')
  }

  const submitWithdrawal = async () => {
    if (parsedAmount <= 0) throw new Error('Ingresá el monto a retirar')
    if (parsedAmount > cashBalance) throw new Error('No tenés saldo suficiente')
    const response = await fetch('/api/customer/funds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'withdrawal', amount: parsedAmount }),
    })
    const json = await response.json()
    if (!response.ok) throw new Error(json.error || 'No se pudo solicitar el retiro')
    setMessage('Retiro solicitado. El monto quedó reservado hasta que el admin lo pague o rechace.')
  }

  const submit = async () => {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      if (mode === 'deposit') await submitDeposit()
      if (mode === 'withdrawal') await submitWithdrawal()
      setAmount('')
      setPaymentReference('')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      await Promise.all([load(), onChanged()])
      setMode('history')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo procesar la solicitud')
    } finally {
      setBusy(false)
    }
  }

  const cancelWithdrawal = async (id: string) => {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/customer/funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_withdrawal', withdrawal_id: id }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'No se pudo cancelar el retiro')
      setMessage('Retiro cancelado y saldo reintegrado.')
      await Promise.all([load(), onChanged()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar el retiro')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-white/10 bg-zinc-950/85 text-zinc-100">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white"><Landmark className="h-5 w-5 text-amber-300" /> Cargar o retirar saldo</CardTitle>
            <CardDescription className="mt-1 text-zinc-400">Las cargas, retiros y consumos de juego usan el saldo general de tu cuenta.</CardDescription>
          </div>
          <Button type="button" size="icon" variant="outline" onClick={() => void load()} className="border-white/15 bg-transparent text-zinc-200" aria-label="Actualizar solicitudes">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-5 grid grid-cols-3 border-b border-white/10">
          <ModeButton active={mode === 'deposit'} onClick={() => setMode('deposit')} icon={<ArrowDownToLine className="h-4 w-4" />} label="Cargar" />
          <ModeButton active={mode === 'withdrawal'} onClick={() => setMode('withdrawal')} icon={<ArrowUpFromLine className="h-4 w-4" />} label="Retirar" />
          <ModeButton active={mode === 'history'} onClick={() => setMode('history')} icon={<FileText className="h-4 w-4" />} label="Solicitudes" />
        </div>

        {mode === 'deposit' && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Monto transferido</Label>
                <Input type="number" min={1} step={1} value={amount} onChange={(event) => setAmount(event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Método</Label>
                  <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white">
                    <option value="">Seleccioná</option>
                    {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Número de operación</Label>
                  <Input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
                </div>
              </div>
              <button type="button" onClick={() => fileRef.current?.click()} className="min-h-28 rounded-md border border-dashed border-amber-300/35 bg-amber-300/[0.04] p-4 text-center text-sm text-amber-100 hover:bg-amber-300/[0.08]">
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="hidden" />
                <ImageIcon className="mx-auto mb-2 h-6 w-6 text-amber-300" />
                {file ? file.name : 'Subir comprobante'}
              </button>
            </div>
            <AccountInstructions account={data?.paymentAccount ?? null} amount={parsedAmount} />
          </div>
        )}

        {mode === 'withdrawal' && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
            <div className="space-y-2">
              <Label>Monto a retirar</Label>
              <Input type="number" min={1} max={cashBalance} step={1} value={amount} onChange={(event) => setAmount(event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
              <p className="text-xs text-zinc-500">Disponible: {formatMoney(cashBalance)}</p>
            </div>
            <div className="rounded-md border border-white/10 bg-black/25 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Cuenta de cobro</p>
              {payoutReady ? (
                <>
                  <p className="mt-2 font-bold text-white">{data?.payoutProfile?.payout_account_kind}: {data?.payoutProfile?.payout_account}</p>
                  <p className="mt-1 text-sm text-zinc-400">{data?.payoutProfile?.payout_holder_name}</p>
                </>
              ) : (
                <p className="mt-2 text-sm text-amber-100">Completá tu cuenta de cobro antes de retirar.</p>
              )}
              <Button asChild size="sm" variant="outline" className="mt-3 border-white/15 bg-transparent text-zinc-200">
                <Link href="/mi-cuenta">Editar cuenta</Link>
              </Button>
            </div>
          </div>
        )}

        {mode === 'history' && (
          <div className="divide-y divide-white/10 rounded-md border border-white/10">
            {history.length === 0 ? (
              <p className="p-5 text-sm text-zinc-500">Todavía no hay solicitudes.</p>
            ) : history.map((item) => (
              <div key={`${item.kind}-${item.id}`} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <div>
                  <p className="font-bold text-white">{item.kind === 'deposit' ? 'Carga de saldo' : 'Retiro de saldo'}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(item.created_at).toLocaleString('es-AR')}
                    {item.kind === 'deposit' && item.payment_reference ? ` · Op. ${item.payment_reference}` : ''}
                    {item.settlement_reference ? ` · Pago ${item.settlement_reference}` : ''}
                  </p>
                  {item.review_notes && <p className="mt-1 text-xs text-zinc-400">{item.review_notes}</p>}
                </div>
                <p className="font-mono font-black text-amber-300">{formatMoney(item.amount)}</p>
                <div className="flex items-center justify-end gap-2">
                  <StatusBadge status={item.status} />
                  {item.kind === 'withdrawal' && item.status === 'pending' && (
                    <Button type="button" size="icon" variant="ghost" disabled={busy} onClick={() => void cancelWithdrawal(item.id)} className="text-rose-300 hover:bg-rose-500/10 hover:text-rose-200" aria-label="Cancelar retiro">
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {mode !== 'history' && (
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={busy || (
              mode === 'withdrawal'
              && (!payoutReady || parsedAmount <= 0 || parsedAmount > cashBalance)
            )}
            className="mt-5 h-11 w-full bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200"
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'deposit' ? 'Enviar carga para aprobación' : 'Solicitar retiro'}
          </Button>
        )}

        {(error || message) && (
          <p className={`mt-4 rounded-md border p-3 text-sm ${error ? 'border-rose-400/30 bg-rose-500/10 text-rose-100' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'}`}>
            {error || message}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function ModeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick} className={`flex h-11 items-center justify-center gap-2 border-b-2 px-2 text-sm font-bold ${active ? 'border-amber-300 text-amber-200' : 'border-transparent text-zinc-500 hover:text-white'}`}>
      {icon}{label}
    </button>
  )
}

function AccountInstructions({ account, amount }: { account: FundsData['paymentAccount']; amount: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Transferir a</p>
      {!account ? (
        <p className="mt-2 text-sm text-amber-100">No hay una cuenta de cobro configurada.</p>
      ) : (
        <div className="mt-3 space-y-2 text-sm">
          <AccountLine label="Titular" value={account.holder} />
          <AccountLine label="Alias" value={account.alias} />
          <AccountLine label="CBU/CVU" value={account.cbu} />
          <AccountLine label="Banco" value={account.bank} />
          {amount > 0 && <AccountLine label="Monto" value={formatMoney(amount)} />}
          {account.concept && <AccountLine label="Concepto" value={account.concept} />}
          {account.note && <p className="pt-1 text-xs text-zinc-500">{account.note}</p>}
        </div>
      )}
    </div>
  )
}

function AccountLine({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return <div className="flex justify-between gap-4"><span className="text-zinc-500">{label}</span><span className="break-all text-right font-semibold text-white">{value}</span></div>
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') return <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Aprobado</Badge>
  if (status === 'rejected') return <Badge className="bg-rose-500 text-white hover:bg-rose-500">Rechazado</Badge>
  if (status === 'cancelled') return <Badge className="bg-zinc-700 text-zinc-100 hover:bg-zinc-700">Cancelado</Badge>
  return <Badge className="bg-amber-300 text-zinc-950 hover:bg-amber-300">Pendiente</Badge>
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(value))
}
