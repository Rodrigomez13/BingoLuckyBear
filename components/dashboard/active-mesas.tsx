'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { LayoutGrid, RefreshCw, HelpCircle, Plus, Megaphone } from 'lucide-react'
import { MesaCard } from '@/components/dashboard/mesa-card'
import type { PublicRoomSummary } from '@/lib/truco/server-authority'

export function ActiveMesas() {
  const [rooms, setRooms] = useState<PublicRoomSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/truco/rooms', { cache: 'no-store' })
      const data = await res.json()
      if (data?.ok) {
        setRooms(Array.isArray(data.rooms) ? data.rooms : [])
        setError(null)
      } else {
        setError(data?.error || 'No se pudieron cargar las mesas.')
      }
    } catch {
      setError('No se pudieron cargar las mesas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const id = window.setInterval(() => void load(), 15000)
    return () => window.clearInterval(id)
  }, [load])

  return (
    <section className="lbb-panel rounded-2xl p-4 sm:p-5">
      {/* Section header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-amber-300" />
          <h2 className="text-lg font-black uppercase tracking-wide text-amber-50">Mesas activas</h2>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {rooms.length} en juego
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/truco"
            className="hidden items-center gap-1.5 rounded-full border border-amber-300/25 bg-emerald-950/60 px-3 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-300/10 sm:inline-flex"
          >
            <HelpCircle className="h-4 w-4" /> ¿Cómo jugar?
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-emerald-950/60 px-3 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-300/10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-4">
        {loading && rooms.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl border border-amber-300/10 bg-emerald-950/40" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <EmptyMesas error={error} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {rooms.map((room, index) => (
              <MesaCard key={room.roomCode} room={room} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function EmptyMesas({ error }: { error: string | null }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-amber-300/20 bg-emerald-950/40 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-300/10">
        <Megaphone className="h-7 w-7 text-amber-300" />
      </div>
      <div>
        <p className="text-lg font-black text-amber-50">No hay mesas públicas ahora</p>
        <p className="mt-1 text-sm text-emerald-200/70">
          {error ? error : 'Sé el primero en crear una mesa y esperá a tu rival.'}
        </p>
      </div>
      <Link
        href="/truco"
        className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black uppercase tracking-wide lbb-gold-button"
      >
        <Plus className="h-4 w-4" /> Crear una mesa
      </Link>
    </div>
  )
}
