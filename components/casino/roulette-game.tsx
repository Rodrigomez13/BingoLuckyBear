'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { formatAccountBalance } from '@/lib/economy/format'

const STAKES = [25, 50, 100, 200, 500, 1000]

type SpinResponse = {
  balanceAfter: number
  payout: number
  outcome: { result: string; metadata: { color: string; number: number; won: boolean } }
}

export function RouletteGame({ initialBalance }: { initialBalance: number }) {
  const [balance, setBalance] = useState(initialBalance)
  const [stake, setStake] = useState(25)
  const [selection, setSelection] = useState<'red' | 'black'>('red')
  const [result, setResult] = useState('Elegí rojo o negro y girá la ruleta.')
  const [isSpinning, setIsSpinning] = useState(false)

  async function spin() {
    setIsSpinning(true)
    setResult('Girando…')
    try {
      const response = await fetch('/api/casino/lbb-roulette-poc/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stake, selection, roundId: crypto.randomUUID() }),
      })
      const payload = await response.json() as SpinResponse & { error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'No se pudo procesar el giro.')
      setBalance(Number(payload.balanceAfter))
      const won = payload.outcome.metadata.won
      setResult(`${payload.outcome.result} · ${won ? `Ganaste ${formatAccountBalance(payload.payout)}` : 'Sin premio esta vez.'}`)
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'No se pudo procesar el giro.')
    } finally {
      setIsSpinning(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-2xl rounded-3xl border border-amber-300/25 bg-zinc-950 p-5 text-white shadow-2xl shadow-amber-950/30 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">Casino POC</p><h1 className="mt-1 text-3xl font-black">Ruleta Lucky Bear</h1></div>
        <div className="rounded-2xl bg-emerald-500/15 px-4 py-2 text-right"><p className="text-xs text-emerald-200">Saldo LBB</p><p className="font-bold text-emerald-300">{formatAccountBalance(balance)}</p></div>
      </div>
      <div className="my-8 grid aspect-square max-h-80 place-items-center rounded-full border-8 border-amber-500/70 bg-[conic-gradient(#b91c1c_0deg_10deg,#171717_10deg_20deg)] shadow-inner">
        <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-amber-300 bg-zinc-950 text-center text-sm font-bold text-amber-200">{isSpinning ? '…' : result.split(' · ')[0]}</div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-zinc-300">Apuesta<select value={stake} onChange={(event) => setStake(Number(event.target.value))} disabled={isSpinning} className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white">{STAKES.map((amount) => <option key={amount} value={amount}>{formatAccountBalance(amount)}</option>)}</select></label>
        <div className="grid gap-2 text-sm font-semibold text-zinc-300"><span>Color</span><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setSelection('red')} className={`rounded-xl p-3 font-bold ${selection === 'red' ? 'bg-red-600' : 'bg-red-950/50'}`}>Rojo</button><button type="button" onClick={() => setSelection('black')} className={`rounded-xl p-3 font-bold ${selection === 'black' ? 'bg-zinc-700' : 'bg-zinc-900'}`}>Negro</button></div></div>
      </div>
      <button type="button" onClick={spin} disabled={isSpinning} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-4 font-black text-zinc-950 transition hover:bg-amber-300 disabled:opacity-60">{isSpinning && <Loader2 className="size-5 animate-spin" />}Girar por {formatAccountBalance(stake)}</button>
      <p aria-live="polite" className="mt-4 min-h-6 text-center text-sm text-zinc-300">{result}</p>
    </section>
  )
}
