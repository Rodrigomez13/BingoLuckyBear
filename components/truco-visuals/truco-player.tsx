'use client'

import React from 'react'

export default function TrucoPlayer() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 text-white shadow-lg">
      <div className="mb-4 text-lg font-bold">Interfaz visual de Truco</div>
      <p className="mb-4 text-sm text-slate-300">Aquí se integrarán las visuales de LuckyBear (luckybear-arg).</p>
      <div className="h-96 w-full rounded-md border border-dashed border-white/6 bg-black/40 flex items-center justify-center">
        <span className="text-slate-400">Visuales de Truco importadas</span>
      </div>
    </div>
  )
}
