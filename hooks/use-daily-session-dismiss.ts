'use client'

import { useCallback, useEffect, useState } from 'react'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function useDailySessionDismiss(storageKey: string) {
  const [dismissed, setDismissed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const today = todayKey()
    try {
      setDismissed(localStorage.getItem(storageKey) === today || sessionStorage.getItem(storageKey) === today)
    } catch {
      setDismissed(false)
    } finally {
      setReady(true)
    }
  }, [storageKey])

  const dismiss = useCallback(() => {
    const today = todayKey()
    setDismissed(true)
    try {
      localStorage.setItem(storageKey, today)
      sessionStorage.setItem(storageKey, today)
    } catch {
      /* ignore storage errors */
    }
  }, [storageKey])

  return { dismissed, dismiss, ready }
}
