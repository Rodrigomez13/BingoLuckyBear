'use client'

import { useEffect, useState } from 'react'
import {
  getStoredTrucoVoicePreference,
  setStoredTrucoVoicePreference,
  speakTrucoLine,
  type TrucoVoicePreference,
} from './truco-speech'

const BOT_PHRASE_HINTS = [
  'Quiero',
  'No quiero',
  'Envido',
  'Real Envido',
  'Falta Envido',
  'Truco',
  'Te subo',
  'Flor',
  'mazo',
]

export function TrucoSpeechRuntime() {
  const [preference, setPreference] = useState<TrucoVoicePreference>('auto')

  useEffect(() => {
    setPreference(getStoredTrucoVoicePreference())
  }, [])

  useEffect(() => {
    let lastText = ''
    let lastAt = 0

    const readBotPhrase = () => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>('[class*="text-sky-100"]'))
      const text = nodes
        .map((node) => node.textContent?.trim() ?? '')
        .filter(Boolean)
        .find((value) => BOT_PHRASE_HINTS.some((hint) => value.toLowerCase().includes(hint.toLowerCase())))

      if (!text || text === lastText) return
      const now = Date.now()
      if (now - lastAt < 350) return
      lastText = text
      lastAt = now
      void speakTrucoLine(text, 'bot')
    }

    const observer = new MutationObserver(readBotPhrase)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    readBotPhrase()
    return () => observer.disconnect()
  }, [])

  const onChange = (value: TrucoVoicePreference) => {
    setPreference(value)
    setStoredTrucoVoicePreference(value)
    void speakTrucoLine(value === 'female' ? 'Voz femenina activada' : value === 'male' ? 'Voz masculina activada' : 'Voz automática activada', 'player')
  }

  return (
    <label className="fixed right-2 top-[5.35rem] z-[74] flex items-center gap-1 rounded-full border border-amber-300/25 bg-[#06140e]/92 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-100 shadow-xl shadow-black/35 backdrop-blur-xl sm:right-4 sm:top-[6.1rem]">
      <span className="hidden sm:inline">Voz</span>
      <select
        value={preference}
        onChange={(event) => onChange(event.target.value as TrucoVoicePreference)}
        className="max-w-[92px] rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-black text-emerald-50 outline-none"
        aria-label="Voz del jugador"
      >
        <option value="auto">Auto</option>
        <option value="male">Masculina</option>
        <option value="female">Femenina</option>
      </select>
    </label>
  )
}
