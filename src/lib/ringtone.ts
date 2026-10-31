// Web Audio API & Audio Element Ringtone Engine for Driver Job Dispatch

class RingtoneManager {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private intervalId: any = null;
  private isMuted = false;
  private fallbackAudio: HTMLAudioElement | null = null;

  constructor() {
    // Pre-create fallback audio
    try {
      this.fallbackAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      this.fallbackAudio.loop = true;
    } catch (e) {
      console.warn('Fallback audio creation failed:', e);
    }
  }

  private initAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  // Synthesize a punchy, Uber/DoorDash-style dispatch double-ping
  private playDispatchChime() {
    if (this.isMuted) return;

    try {
      this.initAudioContext();
      if (!this.audioCtx) {
        this.playFallback();
        return;
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Note 1: 784 Hz (G5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(784, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Note 2: 1046 Hz (C6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, now + 0.12);
      gain2.gain.setValueAtTime(0.35, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.48);

      // Note 3: Harmonic accent at 1318 Hz (E6)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1318.5, now + 0.24);
      gain3.gain.setValueAtTime(0.4, now + 0.24);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.24);
      osc3.stop(now + 0.7);

      // Vibrate if supported (dispatch haptic pattern)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 300]);
      }
    } catch (err) {
      console.warn('Web Audio synthesis error, falling back:', err);
      this.playFallback();
    }
  }

  private playFallback() {
    if (this.isMuted || !this.fallbackAudio) return;
    this.fallbackAudio.currentTime = 0;
    this.fallbackAudio.play().catch(e => console.warn('Fallback audio blocked:', e));
  }

  public startRinging() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    // Immediately play first chime
    this.playDispatchChime();

    // Repeat every 1.1s for urgency
    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        this.playDispatchChime();
      }
    }, 1100);
  }

  public stopRinging() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.fallbackAudio) {
      this.fallbackAudio.pause();
      this.fallbackAudio.currentTime = 0;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.fallbackAudio) {
      this.fallbackAudio.pause();
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const ringtoneManager = new RingtoneManager();
