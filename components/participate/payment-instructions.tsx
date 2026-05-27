'use client'

import { useState } from 'react'
import { Check, ClipboardCopy, Landmark, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PAYMENT_INFO } from '@/lib/payment'

interface PaymentInstructionsProps {
  amount?: string | null
}

export function PaymentInstructions({ amount }: PaymentInstructionsProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const paymentRows = [
    { label: 'Titular', value: PAYMENT_INFO.holder },
    { label: 'Alias', value: PAYMENT_INFO.alias },
    { label: 'CBU/CVU', value: PAYMENT_INFO.cbu },
    { label: 'Banco/Billetera', value: PAYMENT_INFO.bank },
    { label: 'Concepto', value: PAYMENT_INFO.concept },
    { label: 'Monto', value: amount || PAYMENT_INFO.amount },
  ]

  const copyValue = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(label)
    window.setTimeout(() => setCopied(null), 1600)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-amber-400/25 bg-zinc-950/85 text-zinc-100 shadow-xl shadow-black/20">
      <div className="border-b border-amber-400/15 bg-gradient-to-r from-amber-400/15 to-emerald-400/10 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-amber-400 text-zinc-950">
            <WalletCards className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-fredoka)' }}>
              Datos para transferir
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-300">
              Realiza el pago antes de completar el formulario y sube el comprobante al final.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2">
        {paymentRows.map((row) => (
          <div key={row.label} className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-200">{row.label}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="min-w-0 break-all font-semibold text-white">{row.value}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => copyValue(row.value, row.label)}
                className="h-9 shrink-0 border-amber-400/40 bg-transparent px-3 text-amber-200 hover:bg-amber-400/10"
              >
                {copied === row.label ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="flex gap-2 text-sm leading-relaxed text-zinc-300">
          <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          {PAYMENT_INFO.note}
        </p>
      </div>
    </div>
  )
}
