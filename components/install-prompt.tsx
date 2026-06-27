'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Download, X, Share, Plus } from 'lucide-react'
import { BearLogo } from '@/components/bear-logo'
import { useDailySessionDismiss } from '@/hooks/use-daily-session-dismiss'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'lbb-install-dismissed-date'

export function InstallPrompt() {
  const pathname = usePathname()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [iosHint, setIosHint] = useState(false)
  const { dismissed, dismiss: dismissForToday, ready: dismissReady } = useDailySessionDismiss(DISMISS_KEY)

  // Register the service worker once on mount.
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      if ('caches' in window) {
        void window.caches.keys()
          .then((keys) => Promise.all(keys.filter((key) => key.startsWith('lbb-')).map((key) => window.caches.delete(key))))
      }
      return
    }

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
    if (pathname !== '/') return
    if (!dismissReady || dismissed) return

    // Already installed (running as PWA)?
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true
    if (standalone) return

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
  }, [dismissReady, dismissed, pathname])

  const dismiss = () => {
    setVisible(false)
    dismissForToday()
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setVisible(false)
  }

  if (!visible || pathname !== '/') return null

  return (
    <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[46] overflow-hidden px-3 md:bottom-4 md:left-auto md:right-4 md:max-w-[20rem]">
      <div className="mx-auto flex max-w-md items-center gap-2 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/95 p-2.5 shadow-2xl shadow-black/60 backdrop-blur-xl md:mx-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/20 to-amber-300/20">
          <BearLogo size={30} />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-sm font-bold text-white">Instalá la app</p>
          {iosHint ? (
            <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-slate-300">
              Tocá <Share className="inline h-3.5 w-3.5 text-emerald-300" /> y luego
              <span className="inline-flex items-center gap-0.5 font-semibold text-amber-200">
                <Plus className="h-3.5 w-3.5" /> Agregar a inicio
              </span>
            </p>
          ) : (
            <p className="mt-0.5 truncate text-xs text-slate-400 sm:whitespace-normal">Acceso directo a los sorteos desde tu celular.</p>
          )}
        </div>
        {!iosHint && (
          <button
            type="button"
            onClick={install}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-400 to-amber-300 px-2.5 py-2 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 sm:px-3 sm:text-sm"
          >
            <Download className="h-4 w-4" />
            <span className="hidden min-[420px]:inline">Instalar</span>
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

export const InstallAppPrompt = InstallPrompt
