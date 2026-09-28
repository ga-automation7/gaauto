/**
 * Soundscape — the film's score, synthesised live (Web Audio; no audio files).
 *
 * An original ambient piece that follows the story as you scroll:
 *
 *   drone      two detuned low voices through a slowly breathing filter
 *   pad        a spread D minor 9 chord; as the being appears, its F and C rise
 *              a semitone and the harmony opens into D major 9 — the arrival
 *   shimmer    high partials that swell through the transformation
 *   air        filtered noise that rushes with scroll speed (the drone's flight)
 *   heartbeat  a soft sub "lub-dub" every 1.8 s, in step with the being's heart
 *
 * Everything runs through a generated reverb and a gentle compressor. The mood
 * is set from the film's position (setScene); after the film the score settles
 * to a quiet bed under the page. It never starts on its own: the visitor
 * turns it on (browsers only allow audio after a gesture anyway).
 */

/** Where the listener is in the story (0–1 values, smoothed internally). */
export interface SoundScene {
  /** 0 = city tension … 1 = cosmic revelation (the chord opens). */
  arrival: number;
  /** Brightness of the score: filter opening + shimmer. */
  light: number;
  /** The being's heartbeat. */
  heart: number;
  /** Overall level: 1 during the film, lower beneath the page. */
  level: number;
  /** Scroll speed, px per frame (the air rushes with it). */
  speed: number;
}

const HEARTBEAT = 1.8;
const D2 = 73.42;
const hz = (semitones: number) => D2 * Math.pow(2, semitones / 12);

type AudioContextCtor = typeof AudioContext;

export class Soundscape {
  private readonly ctx: AudioContext;
  private readonly master: GainNode;
  private readonly filter: BiquadFilterNode;
  private readonly shimmer: GainNode;
  private readonly air: GainNode;
  private readonly airFilter: BiquadFilterNode;
  private readonly minor: GainNode;
  private readonly major: GainNode;
  private readonly heartGain: GainNode;
  private readonly reverbIn: GainNode;
  private readonly nodes: AudioScheduledSourceNode[] = [];
  private beatTimer = 0;
  private nextBeat = 0;
  private heartLevel = 0;
  private on = false;

  /** Clock of the visuals (s): the heartbeat is kept in phase with the being's pulse. */
  clock: () => number = () => performance.now() / 1000;

  static supported(): boolean {
    return typeof window !== 'undefined' && !!(window.AudioContext || getWebkitAudio());
  }

  constructor() {
    const Ctor: AudioContextCtor = window.AudioContext || getWebkitAudio()!;
    const ctx = new Ctor({ latencyHint: 'playback' });
    this.ctx = ctx;

    // Output: master → soft compressor → speakers.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 18;
    comp.ratio.value = 3;
    comp.attack.value = 0.05;
    comp.release.value = 0.4;
    comp.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(comp);

    // A generated hall: stereo noise with a long exponential tail.
    const reverb = ctx.createConvolver();
    reverb.buffer = impulse(ctx, 3.4, 2.6);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    reverb.connect(wet).connect(this.master);
    this.reverbIn = ctx.createGain();
    this.reverbIn.connect(reverb);

    // Everything tonal passes one breathing low-pass: the score's "light".
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 520;
    this.filter.Q.value = 0.6;
    const tonal = ctx.createGain();
    tonal.gain.value = 1;
    this.filter.connect(tonal);
    tonal.connect(this.master);
    tonal.connect(this.reverbIn);
    const breath = this.lfo(0.045, 90);
    breath.connect(this.filter.frequency);

    // Drone: D1 + A1, slightly detuned, slowly swelling.
    const drone = ctx.createGain();
    drone.gain.value = 0.1;
    drone.connect(this.filter);
    for (const [f, det, type] of [
      [hz(-12), -5, 'sawtooth'],
      [hz(-12), 6, 'triangle'],
      [hz(-5), 3, 'triangle'],
    ] as const) {
      this.osc(type, f, det, drone);
    }
    this.lfo(0.03, 0.03).connect(drone.gain);

    // Pad: D minor 9 (D2 A2 F3 C4 E4) — F and C cross to F♯ and C♯ as the being arrives.
    const pad = ctx.createGain();
    pad.gain.value = 1;
    pad.connect(this.filter);
    const voice = (semi: number, level: number, dest: AudioNode, rate: number) => {
      const g = ctx.createGain();
      g.gain.value = level;
      g.connect(dest);
      this.osc('triangle', hz(semi), -4, g);
      this.osc('sine', hz(semi), 5, g);
      const lfo = this.lfo(rate, level * 0.45);
      lfo.connect(g.gain);
    };
    voice(0, 0.05, pad, 0.07); // D2
    voice(7, 0.04, pad, 0.05); // A2
    voice(26, 0.022, pad, 0.06); // E4
    this.minor = ctx.createGain();
    this.minor.gain.value = 1;
    this.minor.connect(pad);
    this.major = ctx.createGain();
    this.major.gain.value = 0;
    this.major.connect(pad);
    voice(15, 0.03, this.minor, 0.09); // F3
    voice(22, 0.024, this.minor, 0.08); // C4
    voice(16, 0.03, this.major, 0.09); // F♯3
    voice(23, 0.024, this.major, 0.08); // C♯4

    // Shimmer: high partials, mostly reverb.
    this.shimmer = ctx.createGain();
    this.shimmer.gain.value = 0;
    this.shimmer.connect(this.reverbIn);
    this.shimmer.connect(this.master);
    for (const [semi, rate] of [
      [31, 0.11],
      [38, 0.07],
      [43, 0.13],
    ] as const) {
      const g = ctx.createGain();
      g.gain.value = 0.006;
      g.connect(this.shimmer);
      this.osc('sine', hz(semi), 0, g);
      this.lfo(rate, 0.005).connect(g.gain);
    }

    // Air: noise through a band-pass, rushing with scroll speed.
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx, 2);
    noise.loop = true;
    this.airFilter = ctx.createBiquadFilter();
    this.airFilter.type = 'bandpass';
    this.airFilter.frequency.value = 480;
    this.airFilter.Q.value = 0.55;
    this.air = ctx.createGain();
    this.air.gain.value = 0;
    noise.connect(this.airFilter).connect(this.air);
    this.air.connect(this.master);
    this.air.connect(this.reverbIn);
    noise.start();
    this.nodes.push(noise);

    // Heartbeat bus.
    this.heartGain = ctx.createGain();
    this.heartGain.gain.value = 0;
    this.heartGain.connect(this.master);
    this.heartGain.connect(this.reverbIn);
  }

  private osc(type: OscillatorType, freq: number, detune: number, dest: AudioNode): OscillatorNode {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    o.connect(dest);
    o.start();
    this.nodes.push(o);
    return o;
  }

  /** A slow sine modulator scaled to ±depth. */
  private lfo(rate: number, depth: number): GainNode {
    const o = this.ctx.createOscillator();
    o.frequency.value = rate;
    const g = this.ctx.createGain();
    g.gain.value = depth;
    o.connect(g);
    o.start(this.ctx.currentTime + Math.random() * 2);
    this.nodes.push(o);
    return g;
  }

  get playing(): boolean {
    return this.on;
  }

  /** Fade in (call from a user gesture). */
  async start(): Promise<void> {
    await this.ctx.resume();
    this.on = true;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0.85, t + 2.2);
    this.nextBeat = 0;
    window.clearInterval(this.beatTimer);
    this.beatTimer = window.setInterval(() => this.scheduleBeats(), 120);
  }

  /** Fade out, then suspend the audio clock (no CPU while silent). */
  stop(): void {
    this.on = false;
    window.clearInterval(this.beatTimer);
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 0.9);
    window.setTimeout(() => {
      if (!this.on) void this.ctx.suspend();
    }, 1000);
  }

  /** Pause/resume with the page's visibility without changing the visitor's choice. */
  setHidden(hidden: boolean): void {
    if (!this.on) return;
    void (hidden ? this.ctx.suspend() : this.ctx.resume());
  }

  /** Follow the story. Cheap: parameter ramps only. */
  setScene(s: SoundScene): void {
    if (!this.on) return;
    const t = this.ctx.currentTime;
    const ramp = (p: AudioParam, v: number, tc = 0.35) => p.setTargetAtTime(v, t, tc);
    ramp(this.filter.frequency, 380 + 2600 * s.light * s.light, 0.6);
    ramp(this.shimmer.gain, 0.25 + 1.4 * s.light, 0.8);
    ramp(this.minor.gain, 1 - s.arrival, 1.2);
    ramp(this.major.gain, s.arrival, 1.2);
    const rush = Math.min(1, Math.abs(s.speed) / 70);
    ramp(this.air.gain, (0.012 + 0.07 * rush) * (1 - s.arrival * 0.6), 0.25);
    ramp(this.airFilter.frequency, 380 + 900 * rush, 0.3);
    this.heartLevel = s.heart;
    ramp(this.heartGain.gain, 0.9 * s.heart, 0.6);
    ramp(this.master.gain, 0.85 * s.level, 1.4);
  }

  /** Lub-dub, scheduled slightly ahead, in phase with the visuals' clock. */
  private scheduleBeats(): void {
    if (!this.on || this.heartLevel < 0.02) return;
    const now = this.ctx.currentTime;
    const visual = this.clock();
    // Audio time of the next beat on the visual clock.
    const toNext = HEARTBEAT - (visual % HEARTBEAT);
    const at = now + toNext;
    if (at - this.nextBeat < HEARTBEAT * 0.5) return; // already scheduled
    if (toNext > 0.45) return; // schedule only a little ahead
    this.nextBeat = at;
    this.thump(at, 1);
    this.thump(at + 0.3, 0.55);
  }

  private thump(at: number, strength: number): void {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(72, at);
    o.frequency.exponentialRampToValueAtTime(42, at + 0.22);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.32 * strength, at + 0.018);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.42);
    o.connect(g).connect(this.heartGain);
    o.start(at);
    o.stop(at + 0.45);
  }

  destroy(): void {
    window.clearInterval(this.beatTimer);
    for (const n of this.nodes) {
      try {
        n.stop();
      } catch {
        /* already stopped */
      }
    }
    void this.ctx.close();
  }
}

function getWebkitAudio(): AudioContextCtor | undefined {
  return (window as Window & { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
}

function noiseBuffer(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buf.getChannelData(0);
  // Pinkish: a running average softens the hiss.
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = last * 0.86 + (Math.random() * 2 - 1) * 0.14;
    data[i] = last * 3;
  }
  return buf;
}

function impulse(ctx: BaseAudioContext, seconds: number, decay: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}
