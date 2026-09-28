/**
 * NeuralStars — stars forming a neural network.
 *
 * A deep field of stars at three depths; near neighbours are joined by faint
 * filaments so the sky reads as a mind. Signals travel along the filaments,
 * a few stars breathe, and the whole field turns very slowly and drifts with
 * scroll (nearer stars more — parallax). Canvas 2D; the filaments are one
 * batched path per frame.
 */
interface Star {
  /** Position in a unit square around the field centre (-0.5 … 0.5). */
  x: number;
  y: number;
  /** Depth 0 (far) → 1 (near). */
  z: number;
  r: number;
  phase: number;
}

interface Signal {
  edge: number;
  t: number;
  speed: number;
}

export interface NeuralStarsOptions {
  dpr: number;
  count: number;
  /** Join neighbours into a network (false: a plain celestial field). */
  links?: boolean;
  /** Signals travelling at once. */
  signals?: number;
  /** Where the field is brightest (fractions of the canvas); it fades toward every edge. */
  focus?: { x: number; y: number };
}

export class NeuralStars {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly canvas: HTMLCanvasElement;
  private readonly dpr: number;
  private readonly stars: Star[] = [];
  private readonly edges: [number, number][] = [];
  private readonly signals: Signal[] = [];
  private readonly glow: HTMLCanvasElement;
  /** Projected positions, reused every frame (no per-frame garbage). */
  private px = new Float32Array(0);
  private py = new Float32Array(0);
  private width = 1;
  private height = 1;
  private seed = 5;
  private readonly focus: { x: number; y: number };
  /** Per-star visibility from the edge falloff (0 at the canvas edge). */
  private fade = new Float32Array(0);

  constructor(canvas: HTMLCanvasElement, opts: NeuralStarsOptions) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('2D canvas unavailable');
    this.ctx = ctx;
    this.canvas = canvas;
    this.dpr = opts.dpr;
    for (let i = 0; i < opts.count; i++) {
      const z = this.rand() ** 1.8;
      this.stars.push({
        x: this.rand() - 0.5,
        y: this.rand() - 0.5,
        z,
        r: 0.5 + z * 1.6 + (this.rand() > 0.94 ? 1.2 : 0),
        phase: this.rand() * Math.PI * 2,
      });
    }
    if (opts.links !== false) this.link();
    for (let i = 0; i < (opts.signals ?? 10) && this.edges.length; i++) this.signals.push(this.newSignal());
    this.glow = NeuralStars.sprite();
    this.px = new Float32Array(this.stars.length);
    this.py = new Float32Array(this.stars.length);
    this.fade = new Float32Array(this.stars.length);
    this.focus = opts.focus ?? { x: 0.5, y: 0.5 };
  }

  private rand(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  /** Join each star to its two nearest neighbours at a similar depth. */
  private link(): void {
    const s = this.stars;
    for (let i = 0; i < s.length; i++) {
      const a = s[i]!;
      const near: { j: number; d: number }[] = [];
      for (let j = 0; j < s.length; j++) {
        if (j === i) continue;
        const b = s[j]!;
        if (Math.abs(a.z - b.z) > 0.35) continue;
        const d = Math.hypot(a.x - b.x, (a.y - b.y) * 0.7);
        if (d < 0.11) near.push({ j, d });
      }
      near.sort((p, q) => p.d - q.d);
      for (const { j } of near.slice(0, 2)) {
        if (!this.edges.some(([p, q]) => (p === i && q === j) || (p === j && q === i))) this.edges.push([i, j]);
      }
    }
  }

  private newSignal(): Signal {
    return { edge: Math.floor(this.rand() * this.edges.length), t: 0, speed: 0.35 + this.rand() * 0.5 };
  }

  private static sprite(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(235, 240, 255, 1)');
    grad.addColorStop(0.2, 'rgba(160, 182, 255, 0.55)');
    grad.addColorStop(0.55, 'rgba(120, 110, 255, 0.12)');
    grad.addColorStop(1, 'rgba(120, 110, 255, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return c;
  }

  resize(cssW: number, cssH: number): void {
    this.width = Math.max(1, Math.round(cssW * this.dpr));
    this.height = Math.max(1, Math.round(cssH * this.dpr));
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  /**
   * @param time    seconds
   * @param dt      seconds since the last frame
   * @param drift   scroll progress through the section (-1 … 1) — parallax by depth
   */
  render(time: number, dt: number, drift: number): void {
    const { ctx, dpr } = this;
    const w = this.width / dpr;
    const h = this.height / dpr;
    const span = Math.max(w, h) * 1.15;
    const cx = w / 2;
    const cy = h / 2;
    const turn = time * 0.006;
    const cos = Math.cos(turn);
    const sin = Math.sin(turn);
    const step = Math.min(dt, 0.05);

    const { px, py, fade } = this;
    const fx = this.focus.x * w;
    const fy = this.focus.y * h;
    this.stars.forEach((s, i) => {
      const x = s.x * cos - s.y * sin;
      const y = s.x * sin + s.y * cos;
      px[i] = cx + x * span;
      py[i] = cy + y * span - drift * (40 + s.z * 140);
      // Soft elliptical falloff toward the edges: the field melts into the page.
      const dx = (px[i]! - fx) / (w * 0.62);
      const dy = (py[i]! - fy) / (h * 0.6);
      fade[i] = Math.max(0, 1 - Math.pow(Math.min(1, Math.hypot(dx, dy)), 2.2));
    });

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Filaments: one batched path.
    if (this.edges.length) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = 0.7;
      // Two batches: the heart of the field, and its fading outskirts.
      for (const [band, alpha] of [[0.5, 0.13], [0, 0.05]] as const) {
        ctx.strokeStyle = `rgba(132, 150, 255, ${alpha})`;
        ctx.beginPath();
        for (const [a, b] of this.edges) {
          const f = Math.min(fade[a]!, fade[b]!);
          if (f <= 0.02 || (band > 0 ? f < band : f >= 0.5)) continue;
          ctx.moveTo(px[a]!, py[a]!);
          ctx.lineTo(px[b]!, py[b]!);
        }
        ctx.stroke();
      }
    }

    ctx.globalCompositeOperation = 'lighter';
    // Stars (the brightest few carry a soft glow and breathe).
    ctx.fillStyle = 'rgb(226, 232, 255)';
    this.stars.forEach((s, i) => {
      const tw = 0.6 + 0.4 * Math.sin(time * (0.5 + s.z * 1.4) + s.phase);
      if (fade[i]! <= 0.01) return;
      ctx.globalAlpha = (0.25 + s.z * 0.6) * tw * fade[i]!;
      if (s.r > 2) {
        const g = s.r * 7;
        ctx.drawImage(this.glow, px[i]! - g, py[i]! - g, g * 2, g * 2);
      } else {
        ctx.beginPath();
        ctx.arc(px[i]!, py[i]!, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Signals travelling the network.
    for (const sig of this.signals) {
      sig.t += step * sig.speed;
      if (sig.t >= 1) Object.assign(sig, this.newSignal());
      const [a, b] = this.edges[sig.edge]!;
      const x = px[a]! + (px[b]! - px[a]!) * sig.t;
      const y = py[a]! + (py[b]! - py[a]!) * sig.t;
      ctx.globalAlpha = Math.sin(sig.t * Math.PI) * 0.9 * Math.min(fade[a]!, fade[b]!);
      ctx.drawImage(this.glow, x - 12, y - 12, 24, 24);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}
