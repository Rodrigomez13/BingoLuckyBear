'use client'

import { useEffect, useState } from 'react'
import { Download, X, Share, Plus } from 'lucide-react'
import { BearLogo } from '@/components/bear-logo'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'lbb-install-dismissed'

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [iosHint, setIosHint] = useState(false)

  // Register the service worker once on mount.
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* ignore registration errors */
      })
    }
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Already installed (running as PWA)?
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true
    if (standalone) return

    // Recently dismissed?
    try {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0)
      if (dismissedAt && Date.now() - dismissedAt < 1000 * 60 * 60 * 24 * 14) return
    } catch {
      /* ignore */
    }

    // iOS: no beforeinstallprompt, show manual hint.
    const ua = window.navigator.userAgent.toLowerCase()
    const isIos = /iphone|ipad|ipod/.test(ua)
    const isSafari = /safari/.test(ua) && !/crios|fxios|edgios/.test(ua)
    if (isIos && isSafari) {
      const timer = setTimeout(() => {
        setIosHint(true)
        setVisible(true)
      }, 2500)
      return () => clearTimeout(timer)
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      /* ignore */
    }
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[58] px-3 md:bottom-5 md:left-auto md:right-5 md:max-w-sm">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-xl md:mx-0">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-amber-300/20">
          <BearLogo size={34} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">Instalá la app</p>
          {iosHint ? (
            <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-slate-300">
              Tocá <Share className="inline h-3.5 w-3.5 text-emerald-300" /> y luego
              <span className="inline-flex items-center gap-0.5 font-semibold text-amber-200">
                <Plus className="h-3.5 w-3.5" /> Agregar a inicio
              </span>
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-slate-400">Acceso directo a los sorteos desde tu celular.</p>
          )}
        </div>
        {!iosHint && (
          <button
            type="button"
            onClick={install}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-amber-300 px-3 py-2 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20"
          >
            <Download className="h-4 w-4" />
            Instalar
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
