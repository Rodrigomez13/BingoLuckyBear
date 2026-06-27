export class AudioManager {
  constructor({ basePath = 'sounds', enabled = true, master = 0.85, effects = 0.85, music = 0.18 } = {}) {
    this.basePath = basePath
    this.enabled = enabled
    this.master = master
    this.effects = effects
    this.music = music
    this.pool = new Map()
    this.context = null
    this.musicTimer = null
    this.extension = typeof Audio !== 'undefined' && new Audio().canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'wav'
  }

  preload(files) {
    if (typeof Audio === 'undefined') return
    Object.values(files).flat().forEach(name => {
      const audio = new Audio(`${this.basePath}/${name}.${this.extension}`)
      audio.preload = 'auto'
      this.pool.set(name, audio)
    })
  }

  setEnabled(enabled) {
    this.enabled = enabled
    if (!enabled) this.stopMusic()
  }

  setVolumes({ master = this.master, effects = this.effects, music = this.music } = {}) {
    this.master = clamp(master)
    this.effects = clamp(effects)
    this.music = clamp(music)
  }

  play(name, volume = 1, rate = 1) {
    if (!this.enabled || !name || typeof Audio === 'undefined') return
    const key = Array.isArray(name) ? name[0] : name
    const source = this.pool.get(key) ?? new Audio(`${this.basePath}/${key}.${this.extension}`)
    try {
      const audio = source.cloneNode()
      audio.volume = clamp(volume * this.effects * this.master)
      audio.playbackRate = rate
      audio.play().catch(() => {})
    } catch {}
  }

  ensureContext() {
    if (!this.enabled || typeof window === 'undefined') return null
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return null
    if (!this.context) this.context = new AudioContext()
    if (this.context.state === 'suspended') this.context.resume().catch(() => {})
    return this.context
  }

  tone(frequency, duration = 0.08, type = 'sine', volume = 0.045, delay = 0) {
    const context = this.ensureContext()
    if (!context) return
    const now = context.currentTime + delay
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, now)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * this.effects * this.master), now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + duration + 0.03)
  }

  noise(duration = 0.16, volume = 0.025) {
    const context = this.ensureContext()
    if (!context) return
    const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let index = 0; index < data.length; index++) data[index] = (Math.random() * 2 - 1) * (1 - index / data.length)
    const source = context.createBufferSource()
    const gain = context.createGain()
    source.buffer = buffer
    gain.gain.value = volume * this.effects * this.master
    source.connect(gain)
    gain.connect(context.destination)
    source.start()
  }

  startMusic() {
    if (!this.enabled || this.musicTimer) return
    this.playAmbientChord()
    this.musicTimer = window.setInterval(() => this.playAmbientChord(), 5200)
  }

  stopMusic() {
    if (this.musicTimer) window.clearInterval(this.musicTimer)
    this.musicTimer = null
  }

  playAmbientChord() {
    const context = this.ensureContext()
    if (!context || !this.music || document.hidden) return
    const now = context.currentTime
    const chord = [146.83, 185, 220]
    chord.forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = index === 0 ? 'sine' : 'triangle'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, this.master * this.music * 0.018), now + 0.8)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.8)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(now)
      oscillator.stop(now + 5)
    })
  }
}

export function createSfx(audio, files) {
  return {
    click: () => { audio.play(files.click, 0.45); audio.tone(760, 0.035, 'triangle', 0.028); audio.tone(1180, 0.045, 'sine', 0.014, 0.025) },
    spin: () => { audio.play(files.spin, 0.58); audio.play(files.blur, 0.28); audio.noise(0.42, 0.026); [160, 220, 310, 420, 540].forEach((f, i) => audio.tone(f, 0.085, 'triangle', 0.026, i * 0.055)) },
    reelStop: index => { audio.play(files.reelStop[index] ?? files.reelStop[0], 0.48, 1 + index * 0.015); audio.tone(290 + index * 46, 0.06, 'square', 0.018); audio.noise(0.04, 0.009) },
    stop: () => { audio.play(files.land, 0.38); audio.tone(310, 0.07, 'square', 0.018) },
    explode: () => { audio.play(files.explode, 0.58); audio.noise(0.18, 0.035); [190, 110].forEach((f, i) => audio.tone(f, 0.11, 'sawtooth', 0.018, i * 0.025)) },
    drop: () => { audio.play(files.drop, 0.55); [330, 410, 520].forEach((f, i) => audio.tone(f, 0.075, 'triangle', 0.018, i * 0.045)) },
    cascade: () => { audio.play(files.cascade, 0.55); [590, 740, 920, 1120].forEach((f, i) => audio.tone(f, 0.085, 'triangle', 0.03, i * 0.048)); audio.noise(0.11, 0.012) },
    multiplier: () => { audio.play(files.multiplier, 0.6); [760, 960, 1280].forEach((f, i) => audio.tone(f, 0.07, 'sine', 0.022, i * 0.05)) },
    lose: () => { audio.play(files.lose, 0.5); audio.tone(150, 0.13, 'sawtooth', 0.018); audio.tone(105, 0.16, 'sine', 0.012, 0.1) },
    win: ratio => {
      const big = ratio >= 15
      audio.play(ratio >= 15 ? files.big : ratio >= 5 ? files.medium : files.small, big ? 0.72 : 0.55)
      audio.play(files.coins, big ? 0.42 : 0.18)
      const notes = big ? [392, 523, 659, 784, 1046, 1318, 1568] : [660, 830, 990, 1240]
      notes.forEach((f, i) => audio.tone(f, 0.13, 'triangle', big ? 0.04 : 0.03, i * 0.07))
      if (big) audio.noise(0.38, 0.028)
    },
    bonus: () => { audio.play(files.bonus, 0.72); [523, 659, 784, 1046, 1318, 1568, 1975].forEach((f, i) => audio.tone(f, 0.16, 'triangle', 0.04, i * 0.075)); audio.noise(0.5, 0.04) },
  }
}

function clamp(value) {
  return Math.max(0, Math.min(1, Number(value) || 0))
}
