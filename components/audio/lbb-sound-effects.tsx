'use client'

import { useCallback, useEffect, useRef } from 'react'
import { resolveLbbSound } from '@/lib/audio/lbb-sounds'

type LbbSoundEventDetail = {
  sound?: string
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

  const play = useCallback((sound: string) => {
    const definition = resolveLbbSound(sound)
    if (!definition) return

    let audio = cacheRef.current.get(definition.src)
    if (!audio) {
      audio = new Audio(definition.src)
      audio.preload = 'auto'
      cacheRef.current.set(definition.src, audio)
    }

    audio.pause()
    audio.currentTime = 0
    audio.volume = definition.volume ?? 0.5
    void audio.play().catch(() => {
      // Browsers can block audio until the first trusted interaction.
    })
  }, [])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null
      if (!target) return
      if (target.closest('[data-sound-off="true"]')) return

      const explicit = target.closest<HTMLElement>('[data-sound]')
      if (explicit) {
        if (!isDisabledElement(explicit)) play(explicit.dataset.sound || 'ui.click')
        return
      }

      const interactive = target.closest<HTMLElement>('button,a,[role="button"]')
      if (!interactive || isDisabledElement(interactive)) return

      play('ui.click')
    }

    const onSoundEvent = (event: WindowEventMap['lbb:sound']) => {
      if (event.detail?.sound) play(event.detail.sound)
    }

    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('lbb:sound', onSoundEvent)

    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('lbb:sound', onSoundEvent)
    }
  }, [play])

  return null
}

export function dispatchLbbSound(sound: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('lbb:sound', { detail: { sound } }))
}
