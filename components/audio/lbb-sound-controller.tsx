'use client'

import { useEffect } from 'react'
import { playLbbSound, type LbbSoundName } from '@/lib/audio/lbb-sfx'

const DIRECT_SOUNDS = new Set<LbbSoundName>([
  'uiClick',
  'navHover',
  'primaryButton',
  'cardFlip',
  'cardDeal',
  'coinIn',
  'betPlace',
  'tableJoin',
  'notification',
  'errorSoft',
  'winSmall',
  'winBig',
  'countdownTick',
  'bingoNumber',
  'call',
  'accept',
])

const INTERACTIVE_SELECTOR = 'button, a, [role="button"], [data-lbb-sound]'

export function LbbSoundController() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest(INTERACTIVE_SELECTOR) : null
      if (!(target instanceof HTMLElement) || isDisabled(target)) return

      const sound = getSoundForElement(target)
      if (sound) playLbbSound(sound)
    }

    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])

  return null
}

function getSoundForElement(element: HTMLElement): LbbSoundName | null {
  const direct = element.dataset.lbbSound
  if (direct && DIRECT_SOUNDS.has(direct as LbbSoundName)) return direct as LbbSoundName

  const label = normalizeLabel([
    element.getAttribute('aria-label'),
    element.getAttribute('title'),
    element.textContent,
  ].filter(Boolean).join(' '))

  if (!label) return null

  if (looksLikePlayingCard(label)) return 'cardFlip'
  if (label.includes('no quiero') || label.includes('no se pudo') || label.includes('cancelar')) return 'errorSoft'
  if (label.includes('quiero') || label.includes('aceptar') || label.includes('confirmar')) return 'accept'
  if (label.includes('truco') || label.includes('retruco') || label.includes('vale cuatro') || label.includes('vale 4')) return 'call'
  if (label.includes('envido') || label.includes('real') || label.includes('falta') || label.includes('flor') || label.includes('mazo')) return 'call'
  if (label.includes('apostar') || label.includes('apuesta') || label.includes('comprar') || label.includes('depositar') || label.includes('recargar')) return 'betPlace'
  if (label.includes('jugar') || label.includes('entrar') || label.includes('unirse') || label.includes('crear mesa') || label.includes('crear y abrir')) return 'tableJoin'
  if (label.includes('copiar')) return 'uiClick'
  if (label.includes('actualizar') || label.includes('filtrar') || label.includes('disponibles') || label.includes('en juego')) return 'navHover'
  if (label.includes('bonos') || label.includes('perfil') || label.includes('inicio') || label.includes('ranking') || label.includes('tienda')) return 'uiClick'

  return 'uiClick'
}

function looksLikePlayingCard(label: string) {
  return (
    label.includes(' de espada') ||
    label.includes(' de basto') ||
    label.includes(' de oro') ||
    label.includes(' de copa') ||
    label.includes('carta boca abajo')
  )
}

function normalizeLabel(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function isDisabled(element: HTMLElement) {
  return Boolean(
    element.getAttribute('aria-disabled') === 'true' ||
      element.hasAttribute('disabled') ||
      (element instanceof HTMLButtonElement && element.disabled),
  )
}
