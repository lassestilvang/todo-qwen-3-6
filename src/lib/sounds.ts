'use client'

/**
 * High-quality synthesized sound effects using the Web Audio API.
 * No external assets required.
 */
class SoundManager {
  private ctx: AudioContext | null = null
  private muted: boolean = false

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
}

export const sounds = new SoundManager()
