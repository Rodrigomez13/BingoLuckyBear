'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAuthenticatedSession() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checked, setChecked] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' })
      const data = await response.json()
      setAuthenticated(Boolean(data?.authenticated))
    } catch {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user
      setAuthenticated(Boolean(user?.email_confirmed_at || user?.confirmed_at))
    } finally {
      setChecked(true)
    }
  }, [supabase])

  useEffect(() => {
    void load()
    const { data } = supabase.auth.onAuthStateChange(() => {
      void load()
    })
    return () => data.subscription.unsubscribe()
  }, [load, supabase])

  return { authenticated, checked }
}
