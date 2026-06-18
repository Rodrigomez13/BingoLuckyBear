export type LbbSoundName =
  | 'uiClick'
  | 'navHover'
  | 'primaryButton'
  | 'cardFlip'
  | 'cardDeal'
  | 'coinIn'
  | 'betPlace'
  | 'tableJoin'
  | 'notification'
  | 'errorSoft'
  | 'winSmall'
  | 'winBig'
  | 'countdownTick'
  | 'bingoNumber'
  | 'call'
  | 'accept'

const ENABLED_STORAGE_KEY = 'lbb-sfx-enabled'
const VOLUME_STORAGE_KEY = 'lbb-sfx-volume'
const DEFAULT_VOLUME = 0.38

type AudioWindow = typeof window & { webkitAudioContext?: typeof AudioContext }

let audioContext: AudioContext | null = null
let masterGain: GainNode | null = null
let noiseSeed = 7

export function isLbbSoundEnabled() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(ENABLED_STORAGE_KEY) !== 'false'
}

export function setLbbSoundEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ENABLED_STORAGE_KEY, enabled ? 'true' : 'false')
}

export function getLbbSoundVolume() {
  if (typeof window === 'undefined') return DEFAULT_VOLUME
  const stored = Number(window.localStorage.getItem(VOLUME_STORAGE_KEY))
  return Number.isFinite(stored) ? clamp(stored, 0, 1) : DEFAULT_VOLUME
}

export function setLbbSoundVolume(volume: number) {
  if (typeof window === 'undefined') return
  const safeVolume = clamp(volume, 0, 1)
  window.localStorage.setItem(VOLUME_STORAGE_KEY, String(safeVolume))
  if (masterGain) masterGain.gain.value = safeVolume
}

export function playLbbSound(name: LbbSoundName, options: { volume?: number } = {}) {
  if (!isLbbSoundEnabled()) return

  try {
    const context = getAudioContext()
    if (!context || !masterGain) return
    if (context.state === 'suspended') void context.resume()

    const volume = options.volume ?? getLbbSoundVolume()
    masterGain.gain.setTargetAtTime(clamp(volume, 0, 1), context.currentTime, 0.01)

    switch (name) {
      case 'uiClick':
        click(context)
        break
      case 'navHover':
        softBlip(context)
        break
      case 'primaryButton':
        primaryButton(context)
        break
      case 'cardFlip':
        cardFlip(context)
        break
      case 'cardDeal':
        cardDeal(context)
        break
      case 'coinIn':
        coinIn(context)
        break
      case 'betPlace':
        betPlace(context)
        break
      case 'tableJoin':
        tableJoin(context)
        break
      case 'notification':
        notification(context)
        break
      case 'errorSoft':
        errorSoft(context)
        break
      case 'winSmall':
        winSmall(context)
        break
      case 'winBig':
        winBig(context)
        break
      case 'countdownTick':
        tick(context)
        break
      case 'bingoNumber':
        bingoNumber(context)
        break
      case 'call':
        callSound(context)
        break
      case 'accept':
        acceptSound(context)
        break
    }
  } catch {
    // Audio must never block gameplay or navigation.
  }
}

function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (audioContext && masterGain) return audioContext

  const AudioContextConstructor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
  if (!AudioContextConstructor) return null

  audioContext = new AudioContextConstructor()
  masterGain = audioContext.createGain()
  masterGain.gain.value = getLbbSoundVolume()
  masterGain.connect(audioContext.destination)
  return audioContext
}

function click(context: AudioContext) {
  tone(context, 820, 0, 0.045, 'triangle', 0.16)
  tone(context, 1240, 0.018, 0.055, 'sine', 0.08)
}

function softBlip(context: AudioContext) {
  tone(context, 520, 0, 0.06, 'sine', 0.1)
  tone(context, 760, 0.035, 0.08, 'triangle', 0.08)
}

function primaryButton(context: AudioContext) {
  tone(context, 520, 0, 0.07, 'triangle', 0.13)
  tone(context, 780, 0.055, 0.09, 'triangle', 0.13)
  tone(context, 1180, 0.085, 0.11, 'sine', 0.07)
}

function cardFlip(context: AudioContext) {
  noise(context, 0, 0.16, 0.11, 1100)
  tone(context, 240, 0, 0.08, 'triangle', 0.05)
  tone(context, 980, 0.08, 0.09, 'sine', 0.06)
}

function cardDeal(context: AudioContext) {
  noise(context, 0, 0.105, 0.09, 800)
  tone(context, 140, 0.005, 0.1, 'triangle', 0.06)
}

function coinIn(context: AudioContext) {
  tone(context, 1040, 0, 0.075, 'sine', 0.12)
  tone(context, 1360, 0.052, 0.08, 'triangle', 0.12)
  tone(context, 1840, 0.105, 0.09, 'sine', 0.08)
}

function betPlace(context: AudioContext) {
  cardDeal(context)
  tone(context, 950, 0.12, 0.06, 'sine', 0.1)
  tone(context, 1280, 0.165, 0.08, 'triangle', 0.11)
}

function tableJoin(context: AudioContext) {
  primaryButton(context)
  tone(context, 1560, 0.14, 0.11, 'sine', 0.06)
}

function notification(context: AudioContext) {
  tone(context, 720, 0, 0.08, 'triangle', 0.1)
  tone(context, 980, 0.09, 0.11, 'triangle', 0.1)
}

function errorSoft(context: AudioContext) {
  tone(context, 330, 0, 0.1, 'sawtooth', 0.08)
  tone(context, 240, 0.09, 0.14, 'triangle', 0.09)
}

function winSmall(context: AudioContext) {
  ;[660, 880, 1100, 1320].forEach((frequency, index) => {
    tone(context, frequency, index * 0.075, 0.09, 'triangle', 0.1)
  })
  tone(context, 1760, 0.33, 0.12, 'sine', 0.08)
}

function winBig(context: AudioContext) {
  ;[523, 659, 784, 1046, 1318, 1568].forEach((frequency, index) => {
    tone(context, frequency, index * 0.08, 0.12, 'triangle', 0.11)
  })
  noise(context, 0.12, 0.55, 0.045, 3500)
}

function tick(context: AudioContext) {
  tone(context, 760, 0, 0.055, 'square', 0.08)
}

function bingoNumber(context: AudioContext) {
  tone(context, 392, 0, 0.08, 'triangle', 0.1)
  tone(context, 784, 0.065, 0.09, 'sine', 0.08)
  tone(context, 1174, 0.12, 0.08, 'sine', 0.055)
}

function callSound(context: AudioContext) {
  tone(context, 420, 0, 0.08, 'triangle', 0.11)
  tone(context, 880, 0.06, 0.1, 'sine', 0.09)
}

function acceptSound(context: AudioContext) {
  tone(context, 620, 0, 0.08, 'triangle', 0.1)
  tone(context, 980, 0.075, 0.1, 'sine', 0.09)
}

function tone(
  context: AudioContext,
  frequency: number,
  startOffset: number,
  duration: number,
  type: OscillatorType,
  volume: number,
) {
  if (!masterGain) return
  const start = context.currentTime + startOffset
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  oscillator.connect(gain)
  gain.connect(masterGain)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

function noise(context: AudioContext, startOffset: number, duration: number, volume: number, highCutFrequency = 1200) {
  if (!masterGain) return
  const start = context.currentTime + startOffset
  const frameCount = Math.max(1, Math.floor(context.sampleRate * duration))
  const buffer = context.createBuffer(1, frameCount, context.sampleRate)
  const data = buffer.getChannelData(0)

  for (let index = 0; index < frameCount; index += 1) {
    noiseSeed = (noiseSeed * 16807) % 2147483647
    data[index] = (noiseSeed / 2147483647) * 2 - 1
  }

  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()

  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(highCutFrequency, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  source.buffer = buffer
  source.connect(filter)
  filter.connect(gain)
  gain.connect(masterGain)
  source.start(start)
  source.stop(start + duration + 0.02)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
