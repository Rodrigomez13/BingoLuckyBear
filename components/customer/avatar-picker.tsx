'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { AvatarBadge } from '@/components/customer/avatar-badge'
import { CUSTOMER_AVATARS, getCustomerAvatar, type CustomerAvatarKey } from '@/lib/customer/avatars'

interface AvatarPickerProps {
  value: string
  onChange: (value: CustomerAvatarKey) => void
  label?: string
  compact?: boolean
}

export function AvatarPicker({ value, onChange, label = 'Avatar', compact = false }: AvatarPickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const selected = getCustomerAvatar(value)

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="grid"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-left transition hover:border-amber-300/40"
      >
        <span className="flex min-w-0 items-center gap-3">
          <AvatarBadge avatarKey={selected.key} size={compact ? 42 : 52} />
          <span className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/80">{label}</span>
            <span className="block truncate text-sm font-bold text-white">{selected.label}</span>
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-amber-200 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+.5rem)] z-40 rounded-2xl border border-amber-300/20 bg-zinc-950/98 p-3 text-zinc-100 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/80">Elegir avatar</p>
            <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-zinc-400">{CUSTOMER_AVATARS.length} opciones</span>
          </div>
          <div className="lbb-scrollbar grid max-h-72 grid-cols-5 gap-2 overflow-y-auto pr-1 sm:grid-cols-6">
            {CUSTOMER_AVATARS.map((avatar) => {
              const active = selected.key === avatar.key
              return (
                <button
                  key={avatar.key}
                  type="button"
                  onClick={() => {
                    onChange(avatar.key)
                    setOpen(false)
                  }}
                  className={`group relative rounded-2xl border p-1.5 transition ${
                    active
                      ? 'border-amber-300 bg-amber-300/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-amber-300/45'
                  }`}
                  title={avatar.label}
                  aria-label={avatar.label}
                  aria-pressed={active}
                >
                  <AvatarBadge avatarKey={avatar.key} size={compact ? 46 : 52} className="mx-auto" />
                  {active && (
                    <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-amber-300 text-zinc-950">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
