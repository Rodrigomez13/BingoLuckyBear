'use client'

import { useCallback, useEffect, useRef } from 'react'
import { resolveLbbSound } from '@/lib/audio/lbb-sounds'

export type LbbVoice = 'male' | 'female'

type LbbSoundEventDetail = {
  sound?: string
  voice?: LbbVoice
  /** Stable game-log identity. It lets polling/realtime transports send the same event safely. */
  eventId?: string
}

declare global {
  interface WindowEventMap {
    'lbb:sound': CustomEvent<LbbSoundEventDetail>
  }
}

function isDisabledElement(element: Element | null) {
  if (!element) return false
  if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
    return element.disabled
  }
  return element.getAttribute('aria-disabled') === 'true'
}

export function LbbSoundEffects() {
  const cacheRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const voiceVariantRef = useRef<number | null>(null)
  const voiceQueueRef = useRef<LbbSoundEventDetail[]>([])
  const playingVoiceRef = useRef(false)
  const seenVoiceEventsRef = useRef<Map<string, number>>(new Map())
  const unmountedRef = useRef(false)

  const getAudio = useCallback((sound: string, voice?: LbbVoice) => {
    const definition = resolveLbbSound(sound)
    if (!definition) return null

    if (voiceVariantRef.current === null) {
      const storedVoice = window.sessionStorage.getItem('lbb-truco-voice')
      voiceVariantRef.current = storedVoice === 'female' ? 1 : storedVoice === 'male' ? 0 : Math.random() < 0.5 ? 0 : 1
      window.sessionStorage.setItem('lbb-truco-voice', voiceVariantRef.current === 1 ? 'female' : 'male')
    }

    const requestedVariant = voice === 'female' ? 1 : voice === 'male' ? 0 : voiceVariantRef.current
    const source = typeof definition.src === 'string'
      ? definition.src
      : definition.src[requestedVariant % definition.src.length]

    let audio = cacheRef.current.get(source)
    if (!audio) {
      audio = new Audio(source)
      audio.preload = 'auto'
      cacheRef.current.set(source, audio)
    }

    audio.volume = definition.volume ?? 0.5
    return { audio, definition }
  }, [])

  const playImmediate = useCallback((sound: string, voice?: LbbVoice) => {
    const resolved = getAudio(sound, voice)
    if (!resolved) return
    const { audio } = resolved
    audio.pause()
    audio.currentTime = 0
    void audio.play().catch(() => {
      // Browser autoplay policies must never affect the game state.
    })
  }, [getAudio])

  const drainVoiceQueue = useCallback(() => {
    if (playingVoiceRef.current || unmountedRef.current) return
    const next = voiceQueueRef.current.shift()
    if (!next?.sound) return

    const resolved = getAudio(next.sound, next.voice)
    if (!resolved) {
      drainVoiceQueue()
      return
    }

    const { audio } = resolved
    playingVoiceRef.current = true
    let completed = false
    const finish = () => {
      if (completed) return
      completed = true
      audio.removeEventListener('ended', finish)
      audio.removeEventListener('error', finish)
      playingVoiceRef.current = false
      // A small conversational pause makes a response feel natural.
      window.setTimeout(drainVoiceQueue, 280)
    }

    audio.pause()
    audio.currentTime = 0
    audio.addEventListener('ended', finish, { once: true })
    audio.addEventListener('error', finish, { once: true })
    void audio.play().catch(finish)
  }, [getAudio])

  const play = useCallback((detail: LbbSoundEventDetail) => {
    if (!detail.sound) return
    if (window.localStorage.getItem('lbb-sound-enabled') === 'false') return
    const resolved = getAudio(detail.sound, detail.voice)
    if (!resolved) return

    if (resolved.definition.queue !== 'voice') {
      playImmediate(detail.sound, detail.voice)
      return
    }

    const eventId = detail.eventId
    if (eventId) {
      const now = Date.now()
      if (seenVoiceEventsRef.current.has(eventId)) return
      seenVoiceEventsRef.current.set(eventId, now)
      // Keep this bounded even in a long-running table.
      if (seenVoiceEventsRef.current.size > 200) {
        for (const [key, createdAt] of seenVoiceEventsRef.current) {
          if (now - createdAt > 10 * 60_000) seenVoiceEventsRef.current.delete(key)
        }
      }
    }

    voiceQueueRef.current.push(detail)
    drainVoiceQueue()
  }, [drainVoiceQueue, getAudio, playImmediate])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null
      if (!target) return
      if (target.closest('[data-sound-off="true"]')) return

      const explicit = target.closest<HTMLElement>('[data-sound]')
      if (explicit) {
        if (!isDisabledElement(explicit)) play({ sound: explicit.dataset.sound || 'ui.click' })
        return
      }

      const interactive = target.closest<HTMLElement>('button,a,[role="button"]')
      if (!interactive || isDisabledElement(interactive)) return

      play({ sound: 'ui.click' })
    }

    const onSoundEvent = (event: WindowEventMap['lbb:sound']) => {
      play(event.detail)
    }

    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('lbb:sound', onSoundEvent)

    return () => {
      unmountedRef.current = true
      voiceQueueRef.current = []
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('lbb:sound', onSoundEvent)
    }
  }, [play])

  return null
}

export function dispatchLbbSound(sound: string, voice?: LbbVoice, eventId?: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('lbb:sound', { detail: { sound, voice, eventId } }))
}
