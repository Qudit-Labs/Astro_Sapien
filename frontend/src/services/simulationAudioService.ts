/**
 * FIRELINE / IGNIS-G — Spaceflight Audio Synthesizer
 *
 * Procedural Web Audio API sound effects for spaceflight simulation immersion:
 * - Ambient cabin ventilation hum
 * - Flame ignition whoosh
 * - Radiative extinction quench hiss
 * - Flight safety master warning alarm
 * - CapCom radio communication transmit clicks
 *
 * All sounds are synthesized procedurally with zero external asset dependencies.
 */

class SimulationAudioService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private cabinHumGain: GainNode | null = null;
  private cabinHumOsc: OscillatorNode | null = null;
  private cabinHumNoise: AudioBufferSourceNode | null = null;
  private isHumming: boolean = false;

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopCabinHum();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Procedural Spacecraft Cabin Ambient Ventilation Hum (55 Hz low rumble + filtered air noise)
   */
  public startCabinHum() {
    if (this.isMuted || this.isHumming) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      this.cabinHumGain = ctx.createGain();
      this.cabinHumGain.gain.setValueAtTime(0.04, ctx.currentTime);

      // Low frequency ventilation drone
      this.cabinHumOsc = ctx.createOscillator();
      this.cabinHumOsc.type = 'sine';
      this.cabinHumOsc.frequency.setValueAtTime(58, ctx.currentTime);

      // Filtered air rush noise buffer
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.cabinHumNoise = ctx.createBufferSource();
      this.cabinHumNoise.buffer = noiseBuffer;
      this.cabinHumNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.015, ctx.currentTime);

      this.cabinHumNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.cabinHumGain);

      this.cabinHumOsc.connect(this.cabinHumGain);
      this.cabinHumGain.connect(ctx.destination);

      this.cabinHumOsc.start();
      this.cabinHumNoise.start();
      this.isHumming = true;
    } catch (e) {
      console.warn('[SimulationAudio] Failed to start cabin hum:', e);
    }
  }

  public stopCabinHum() {
    if (!this.isHumming) return;
    try {
      if (this.cabinHumOsc) {
        this.cabinHumOsc.stop();
        this.cabinHumOsc.disconnect();
        this.cabinHumOsc = null;
      }
      if (this.cabinHumNoise) {
        this.cabinHumNoise.stop();
        this.cabinHumNoise.disconnect();
        this.cabinHumNoise = null;
      }
      if (this.cabinHumGain) {
        this.cabinHumGain.disconnect();
        this.cabinHumGain = null;
      }
      this.isHumming = false;
    } catch (e) {
      console.warn('[SimulationAudio] Error stopping cabin hum:', e);
    }
  }

  /**
   * Flame Ignition Whoosh Sound
   */
  public playIgnitionSound() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('[SimulationAudio] Ignition sound error:', e);
    }
  }

  public playIgnitionWhoosh() {
    this.playIgnitionSound();
  }

  /**
   * Radiative Extinction Quench Hiss Sound
   */
  public playExtinctionHiss() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.45;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.45);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
    } catch (e) {
      console.warn('[SimulationAudio] Extinction hiss error:', e);
    }
  }

  /**
   * Flight Safety Master Alarm Beep (Dual-tone alert)
   */
  public playHazardAlarm() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc2.frequency.setValueAtTime(1100, now);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.28);
      osc2.stop(now + 0.28);
    } catch (e) {
      console.warn('[SimulationAudio] Hazard alarm error:', e);
    }
  }

  public playWarningAlarm() {
    this.playHazardAlarm();
  }

  /**
   * Radio Transmission Click
   */
  public playRadioClick() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(2400, now);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn('[SimulationAudio] Radio click error:', e);
    }
  }
}

export const simulationAudio = new SimulationAudioService();
