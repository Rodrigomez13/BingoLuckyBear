'use client'

export type TrucoVoicePreference = 'auto' | 'male' | 'female'

const VOICE_KEY = 'lbb_truco_player_voice'

export function getStoredTrucoVoicePreference(): TrucoVoicePreference {
  if (typeof window === 'undefined') return 'auto'
  const value = window.localStorage.getItem(VOICE_KEY)
  return value === 'male' || value === 'female' || value === 'auto' ? value : 'auto'
}

export function setStoredTrucoVoicePreference(value: TrucoVoicePreference) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(VOICE_KEY, value)
}

export function speakTrucoLine(text: string, actor: 'player' | 'bot' = 'player') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve()

  return new Promise<void>((resolve) => {
    try {
      const synth = window.speechSynthesis
      synth.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'es-AR'
      utterance.rate = actor === 'bot' ? 0.92 : 0.98
      utterance.pitch = actor === 'bot' ? 0.78 : getPlayerPitch()
      const voice = chooseSpanishVoice(actor)
      if (voice) utterance.voice = voice

      const fallback = window.setTimeout(resolve, Math.max(650, text.length * 115))
      utterance.onend = () => {
        window.clearTimeout(fallback)
        resolve()
      }
      utterance.onerror = () => {
        window.clearTimeout(fallback)
        resolve()
      }
      synth.speak(utterance)
    } catch {
      resolve()
    }
  })
}

function getPlayerPitch() {
  const preference = getStoredTrucoVoicePreference()
  if (preference === 'female') return 1.16
  if (preference === 'male') return 0.82
  return 1
}

function chooseSpanishVoice(actor: 'player' | 'bot') {
  try {
    const voices = window.speechSynthesis.getVoices()
    if (!voices.length) return null
    const pool = voices.filter((voice) => voice.lang.toLowerCase().startsWith('es'))
    const usable = pool.length ? pool : voices
    const preference = actor === 'bot' ? 'male' : getStoredTrucoVoicePreference()
    if (preference === 'female') return usable.find((voice) => /paulina|monica|lucia|helena|sabina|sofia|maria/i.test(voice.name)) ?? usable[0]
    if (preference === 'male') return usable.find((voice) => /diego|jorge|carlos|juan|pablo|miguel/i.test(voice.name)) ?? usable[0]
    return usable[0]
  } catch {
    return null
  }
}
