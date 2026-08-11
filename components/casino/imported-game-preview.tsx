'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CircleDollarSign, Dices, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { CasinoDemoGame } from '@/lib/casino/demo-catalog'
import { formatAccountBalance } from '@/lib/economy/format'

const STAKES = [25, 50, 100, 250, 500]
const SLOT_SYMBOLS = ['7', '★', '♦', '♛', '●', '♣']

export function ImportedGamePreview({ game }: { game: CasinoDemoGame }) {
  const [credits, setCredits] = useState(10_000)
  const [stake, setStake] = useState(50)
  const [isPlaying, setIsPlaying] = useState(false)
  const [message, setMessage] = useState('Configurá tu apuesta para visualizar la integración.')
  const [reels, setReels] = useState(['7', '★', '♦'])

  function playPreview() {
    if (isPlaying || credits < stake) return
    setIsPlaying(true)
    setCredits((current) => current - stake)
    setMessage('Procesando una ronda simulada…')

    window.setTimeout(() => {
      const nextReels = Array.from({ length: 3 }, () => SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)])
      const isWin = nextReels[0] === nextReels[1] || nextReels[1] === nextReels[2]
      const payout = isWin ? stake * (nextReels[0] === nextReels[1] && nextReels[1] === nextReels[2] ? 8 : 2) : 0
      setReels(nextReels)
      if (payout) setCredits((current) => current + payout)
      setMessage(isWin ? `Vista de premio: ${formatAccountBalance(payout)} en créditos simulados.` : 'Vista de ronda sin premio.')
      setIsPlaying(false)
    }, 680)
  }

  function reset() {
    setCredits(10_000)
    setStake(50)
    setReels(['7', '★', '♦'])
    setMessage('Saldo de prueba reiniciado. No hubo movimientos reales.')
  }

  const thumbnail = `/api/casino/demo-thumbnail/${encodeURIComponent(game.symbol)}`

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#04130c] px-3 py-3 text-white sm:px-5 sm:py-5">
      <Image src={thumbnail} alt="" fill priority className="pointer-events-none object-cover opacity-[0.18] blur-[2px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(250,204,21,.28),transparent_28rem),radial-gradient(circle_at_80%_16%,rgba(34,197,94,.16),transparent_26rem),linear-gradient(135deg,rgba(2,8,5,.96),rgba(4,29,17,.86),rgba(2,8,5,.96))]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/20 bg-[#031008]/85 p-3 shadow-2xl shadow-black/45 backdrop-blur-xl sm:px-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.2em] text-amber-300"><Sparkles className="h-3.5 w-3.5" /> Integración LBB · vista de prueba</p>
            <h1 className="mt-1 truncate text-xl font-black text-white sm:text-2xl">{game.name}</h1>
          </div>
          <Link href="/casino" className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-300/25 bg-white/[0.04] px-3 text-xs font-black uppercase text-amber-100 transition hover:bg-amber-300 hover:text-zinc-950">
            <ArrowLeft className="h-4 w-4" /> Catálogo
          </Link>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section className="relative min-h-[32rem] overflow-hidden rounded-[1.7rem] border border-amber-300/25 bg-black/45 p-4 shadow-2xl shadow-black/45 backdrop-blur-xl sm:p-6">
            <Image src={thumbnail} alt={`Arte de ${game.name}`} fill sizes="(min-width: 1024px) 70vw, 100vw" className="object-cover opacity-55" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.82))]" />
            <div className="relative flex h-full min-h-[28rem] flex-col justify-between">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-amber-100">{game.kind} · {game.engine}</span>
                <span className="rounded-full border border-lime-300/25 bg-emerald-950/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-lime-200">Saldo de prueba</span>
              </div>

              <div className="mx-auto grid w-full max-w-md grid-cols-3 gap-2 rounded-[1.4rem] border border-amber-200/30 bg-black/65 p-3 shadow-2xl shadow-black/50 backdrop-blur-sm sm:gap-3 sm:p-4">
                {reels.map((symbol, index) => <div key={`${symbol}-${index}`} className={`grid aspect-[.78] place-items-center rounded-2xl border border-amber-200/30 bg-[radial-gradient(circle_at_50%_35%,rgba(250,204,21,.28),transparent_50%),rgba(1,8,4,.78)] font-serif text-5xl font-black text-amber-100 shadow-inner transition ${isPlaying ? 'animate-pulse' : ''}`}>{symbol}</div>)}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/60 p-3 text-center backdrop-blur-sm">
                <p aria-live="polite" className="text-sm font-bold text-emerald-50/85">{message}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[.16em] text-amber-200/75">Simulación visual · sin API de cobros ni saldo real</p>
              </div>
            </div>
          </section>

          <aside className="rounded-[1.7rem] border border-amber-300/20 bg-[#031008]/85 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-950/45 p-3">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-emerald-100/70"><CircleDollarSign className="h-4 w-4" /> Créditos LBB</p>
              <p className="mt-2 font-mono text-3xl font-black text-lime-300">{formatAccountBalance(credits)}</p>
              <p className="mt-1 text-xs text-emerald-50/60">Saldo simulado</p>
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-amber-300">Apuesta de prueba</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {STAKES.map((amount) => <button key={amount} type="button" onClick={() => setStake(amount)} className={`h-10 rounded-xl border text-xs font-black transition ${stake === amount ? 'border-amber-300 bg-amber-300 text-zinc-950' : 'border-white/10 bg-white/[.04] text-amber-100 hover:bg-white/[.08]'}`}>{formatAccountBalance(amount)}</button>)}
            </div>

            <button type="button" onClick={playPreview} disabled={isPlaying || credits < stake} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 text-sm font-black text-zinc-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60">
              <Dices className={`h-5 w-5 ${isPlaying ? 'animate-spin' : ''}`} /> {isPlaying ? 'Simulando…' : `Probar con ${formatAccountBalance(stake)}`}
            </button>
            <button type="button" onClick={reset} className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] text-xs font-black uppercase text-emerald-50/75 hover:bg-white/[.08]">
              <RotateCcw className="h-4 w-4" /> Reiniciar prueba
            </button>

            <div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/[.06] p-3 text-xs leading-5 text-amber-50/75">
              <ShieldCheck className="mb-2 h-5 w-5 text-amber-300" />
              Esta vista muestra la experiencia objetivo: la liquidación real se habilitaría sólo después de integrar proveedor, licencias, controles y backend autorizado.
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
