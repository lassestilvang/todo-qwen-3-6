'use client'

/**
 * High-quality synthesized sound effects using the Web Audio API.
 * No external assets required.
 */
class SoundManager {
  private ctx: AudioContext | null = null
  private muted: boolean = false

  private ambientSource: AudioBufferSourceNode | null = null
  private ambientGain: GainNode | null = null
  private lfo: OscillatorNode | null = null
  private filter: BiquadFilterNode | null = null
  private activeSoundscape: 'brown' | 'ocean' | 'rain' | null = null
  private soundscapeVolume: number = 0.5

  private getCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    return this.ctx
  }

  setMuted(muted: boolean) {
    this.muted = muted
    if (muted) {
      this.stopSoundscape()
    }
  }

  playSuccess() {
    if (this.muted) return
    const ctx = this.getCtx()
    if (!ctx) return

    const now = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc1.type = 'sine'
    osc2.type = 'triangle'

    // High quality sweet success sound (two rising chords)
    osc1.frequency.setValueAtTime(523.25, now) // C5
    osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.3) // C6
    
    osc2.frequency.setValueAtTime(659.25, now) // E5
    osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.3) // E6

    gainNode.gain.setValueAtTime(0.1, now)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

    osc1.connect(gainNode)
    osc2.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.4)
    osc2.stop(now + 0.4)
  }

  playClick() {
    if (this.muted) return
    const ctx = this.getCtx()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)
    
    gainNode.gain.setValueAtTime(0.03, now)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
    
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    osc.start(now)
    osc.stop(now + 0.05)
  }

  playPop() {
    if (this.muted) return
    const ctx = this.getCtx()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1)
    
    gainNode.gain.setValueAtTime(0.05, now)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
    
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    osc.start(now)
    osc.stop(now + 0.1)
  }

  playLevelUp() {
    if (this.muted) return
    const ctx = this.getCtx()
    if (!ctx) return

    const now = ctx.currentTime
    // Ascending arpeggio chords C4 -> E4 -> G4 -> C5 -> E5 -> G5 -> C6
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]
    
    notes.forEach((freq, index) => {
      const time = now + index * 0.08
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      osc.type = index % 2 === 0 ? 'sine' : 'triangle'
      osc.frequency.setValueAtTime(freq, time)
      
      gainNode.gain.setValueAtTime(0.08, time)
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.35)
      
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      osc.start(time)
      osc.stop(time + 0.35)
    })
  }

  // --- FOCUS SOUNDSCAPE SYNTHESIZER ---

  private createNoiseBuffer(type: 'pink' | 'brown'): AudioBuffer {
    const ctx = this.getCtx()!
    const bufferSize = 4 * ctx.sampleRate
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    if (type === 'brown') {
      let lastOut = 0.0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        data[i] = (lastOut + (0.02 * white)) / 1.02
        lastOut = data[i]
        data[i] *= 3.5 // gain compensation
      }
    } else {
      // Pink Noise generator (Kellet's refined method)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
        data[i] *= 0.11 // gain adjustment
        b6 = white * 0.115926
      }
    }

    return buffer
  }

  getActiveSoundscape() {
    return this.activeSoundscape
  }

  getSoundscapeVolume() {
    return this.soundscapeVolume
  }

  setSoundscapeVolume(vol: number) {
    this.soundscapeVolume = vol
    if (this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(vol * 0.12, this.getCtx()!.currentTime)
    }
  }

  startSoundscape(type: 'brown' | 'ocean' | 'rain') {
    if (this.muted) return
    const ctx = this.getCtx()
    if (!ctx) return

    // Stop current soundscape if running
    this.stopSoundscape()

    // Resume context if suspended (browser security)
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    this.activeSoundscape = type

    const noiseType = type === 'rain' ? 'pink' : 'brown'
    const buffer = this.createNoiseBuffer(noiseType)

    this.ambientSource = ctx.createBufferSource()
    this.ambientSource.buffer = buffer
    this.ambientSource.loop = true

    this.ambientGain = ctx.createGain()
    this.ambientGain.gain.setValueAtTime(this.soundscapeVolume * 0.12, ctx.currentTime)

    this.filter = ctx.createBiquadFilter()

    if (type === 'brown') {
      // Warm, deep rumble
      this.filter.type = 'lowpass'
      this.filter.frequency.setValueAtTime(320, ctx.currentTime)
      this.ambientSource.connect(this.filter)
      this.filter.connect(this.ambientGain)
    } else if (type === 'ocean') {
      // Modulated lowpass sweeping slowly for waves
      this.filter.type = 'lowpass'
      this.filter.frequency.setValueAtTime(450, ctx.currentTime)
      this.filter.Q.setValueAtTime(1.5, ctx.currentTime)

      // Slow wave modulation LFO
      this.lfo = ctx.createOscillator()
      this.lfo.type = 'sine'
      this.lfo.frequency.setValueAtTime(0.12, ctx.currentTime) // 8 second wave cycle

      const lfoGain = ctx.createGain()
      lfoGain.gain.setValueAtTime(250, ctx.currentTime) // modulate filter up to 250Hz

      this.lfo.connect(lfoGain)
      lfoGain.connect(this.filter.frequency)
      this.lfo.start()

      // Connect source -> filter -> gain
      this.ambientSource.connect(this.filter)
      this.filter.connect(this.ambientGain)
    } else if (type === 'rain') {
      // High-passed/band-passed pink noise for sizzling rain
      this.filter.type = 'bandpass'
      this.filter.frequency.setValueAtTime(1000, ctx.currentTime)
      this.filter.Q.setValueAtTime(0.7, ctx.currentTime)

      // Light wind gust LFO modulation
      this.lfo = ctx.createOscillator()
      this.lfo.type = 'sine'
      this.lfo.frequency.setValueAtTime(0.07, ctx.currentTime) // 14 second gust cycle

      const lfoGain = ctx.createGain()
      lfoGain.gain.setValueAtTime(200, ctx.currentTime)

      this.lfo.connect(lfoGain)
      lfoGain.connect(this.filter.frequency)
      this.lfo.start()

      this.ambientSource.connect(this.filter)
      this.filter.connect(this.ambientGain)
    }

    this.ambientGain.connect(ctx.destination)
    this.ambientSource.start()
  }

  stopSoundscape() {
    this.activeSoundscape = null

    if (this.ambientSource) {
      try {
        this.ambientSource.stop()
        this.ambientSource.disconnect()
      } catch {}
      this.ambientSource = null
    }

    if (this.lfo) {
      try {
        this.lfo.stop()
        this.lfo.disconnect()
      } catch {}
      this.lfo = null
    }

    if (this.filter) {
      try {
        this.filter.disconnect()
      } catch {}
      this.filter = null
    }

    if (this.ambientGain) {
      try {
        this.ambientGain.disconnect()
      } catch {}
      this.ambientGain = null
    }
  }
}

export const sounds = new SoundManager()
