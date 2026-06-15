'use client'

import { useState } from 'react'
import { Loader2, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function WalletAdjustmentPanel() {
  const [identifier, setIdentifier] = useState('')
  const [walletKind, setWalletKind] = useState<'bonus_points' | 'cash_credits'>('cash_credits')
  const [direction, setDirection] = useState<'credit' | 'debit'>('credit')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/admin/wallet/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, wallet_kind: walletKind, direction, amount: Number(amount), reason }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'No se pudo ajustar el saldo')
      setMessage(`Saldo actualizado. Balance: ${data.balance_after}`)
      setAmount('')
      setReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo ajustar el saldo')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-amber-300/20 bg-zinc-950/85 text-zinc-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <WalletCards className="h-5 w-5 text-amber-300" /> Agregar o retirar saldo
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Aplica un movimiento administrativo trazable. Retirar saldo aquí no realiza una transferencia bancaria.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Usuario</Label>
            <Input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="Email o UUID del usuario"
              required
              className="border-zinc-700 bg-zinc-900 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Wallet</Label>
            <select
              value={walletKind}
              onChange={(event) => setWalletKind(event.target.value as 'bonus_points' | 'cash_credits')}
              className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-amber-400"
            >
              <option value="bonus_points">LBB Points</option>
              <option value="cash_credits">Créditos cash</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Movimiento</Label>
            <select
              value={direction}
              onChange={(event) => setDirection(event.target.value as 'credit' | 'debit')}
              className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-amber-400"
            >
              <option value="credit">Agregar saldo</option>
              <option value="debit">Retirar saldo</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Monto</Label>
            <Input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
              className="border-zinc-700 bg-zinc-900 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Motivo</Label>
            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ej: premio manual / corrección de saldo"
              required
              minLength={4}
              className="border-zinc-700 bg-zinc-900 text-white"
            />
          </div>

          <Button disabled={busy} className="h-11 rounded-full bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200 md:col-span-2">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {direction === 'credit' ? 'Agregar saldo' : 'Retirar saldo'}
          </Button>
        </form>

        {(message || error) && (
          <div className={`mt-4 rounded-xl border p-3 text-sm font-semibold ${error ? 'border-rose-400/30 bg-rose-500/10 text-rose-100' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'}`}>
            {error || message}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
