'use client'

import Image from 'next/image'

interface TrucoLoadingOverlayProps {
  show: boolean
  message?: string
}

/**
 * Full-screen loading screen shown during transitions between lobby screens
 * (creating a room, joining a room, entering a game). The golden bear mascot
 * lives here instead of permanently sitting at the top of the lobby.
 */
export function TrucoLoadingOverlay({ show, message = 'Preparando la mesa…' }: TrucoLoadingOverlayProps) {
  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 bg-[#04100b]/92 backdrop-blur-md lbb-fade-up"
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        <div className="absolute inset-0 -z-10 animate-ping rounded-full bg-amber-400/25 blur-2xl" />
        <div className="absolute inset-0 -z-10 rounded-full bg-amber-400/15 blur-3xl" />
        <Image
          src="/truco/golden-bear-mascot.png"
          alt=""
          width={150}
          height={150}
          className="lbb-float drop-shadow-2xl"
          priority
        />
      </div>

      <div className="flex items-center gap-2.5">
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-amber-300 [animation-delay:-0.3s]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-emerald-300 [animation-delay:-0.15s]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-amber-300" />
      </div>

      <p className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-amber-200">{message}</p>
    </div>
  )
}
