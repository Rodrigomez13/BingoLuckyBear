'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          settlement_reference: action === 'approve' ? reference : null,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo revisar el retiro')
      setOpen(false)
      setNotes('')
      setReference('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo revisar el retiro')
    } finally {
      setBusy(false)
    }
  }

  const approving = action === 'approve'

  return (
    <>
      <Button
        type="button"
        size="sm"
        disabled={disabled}
        variant={approving ? 'default' : 'outline'}
        onClick={() => setOpen(true)}
        className={approving
          ? 'bg-emerald-400 font-bold text-zinc-950 hover:bg-emerald-300'
          : 'border-rose-400/40 bg-transparent text-rose-200 hover:bg-rose-500/10'}
      >
        {approving ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
        {approving ? 'Aprobar' : 'Rechazar'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-zinc-950 text-zinc-100">
          <DialogHeader>
            <DialogTitle>{approving ? 'Confirmar pago del retiro' : 'Rechazar retiro'}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {approving
                ? 'Confirmá luego de realizar la transferencia. El saldo ya fue reservado al crear la solicitud.'
                : 'El monto reservado se reintegrará automáticamente al jugador.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {approving && (
              <div className="space-y-2">
                <Label>Número de operación</Label>
                <Input value={reference} onChange={(event) => setReference(event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Nota administrativa</Label>
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
            </div>
            {error && <p className="rounded-md border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-white/15 bg-transparent text-zinc-200">Cancelar</Button>
            <Button
              onClick={submit}
              disabled={busy || (approving && reference.trim().length < 3)}
              className={approving ? 'bg-emerald-400 font-bold text-zinc-950 hover:bg-emerald-300' : 'bg-rose-500 font-bold text-white hover:bg-rose-400'}
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
