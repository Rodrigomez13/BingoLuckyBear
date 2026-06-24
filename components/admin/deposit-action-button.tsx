'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DepositActionButton({
  id,
  action,
  disabled,
  disabledReason,
}: {
  id: string
  action: 'approve' | 'reject'
  disabled?: boolean
  disabledReason?: string
}) {
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  const run = async () => {
    setBusy(true)
    try {
      const response = await fetch(`/api/admin/deposits/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: action === 'approve' ? 'Aprobado desde panel admin' : 'Rechazado desde panel admin' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo aplicar la acción')
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo aplicar la acción')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={disabled || busy}
      data-sound={action === 'approve' ? 'wallet.approved' : 'ui.error'}
      onClick={run}
      variant={action === 'reject' ? 'outline' : 'default'}
      title={disabled && disabledReason ? disabledReason : action === 'approve' ? 'Aprobar depósito' : 'Rechazar depósito'}
      className={action === 'approve' ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'border-rose-400/40 bg-transparent text-rose-200 hover:bg-rose-500/10'}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : action === 'approve' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
    </Button>
  )
}
