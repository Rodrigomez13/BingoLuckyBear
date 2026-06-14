'use client'

import { createClient } from '@supabase/supabase-js'
export {
  generateRoomCode,
  normalizeRoomCode,
  trucoRoomChannelName,
  type OnlineAction,
  type OnlineMessage,
  type OnlineRole,
} from './shared'

export function createTrucoRealtimeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) return null

  return createClient(url, anonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })
}
