/**
 * WarpStreaks — light rushing outward from a vanishing point: the camera's
 * forward speed made visible. Streaks accelerate as they approach the frame
 * edge (perspective), so the motion reads as depth, not as a flat burst.
 *
 * Canvas 2D, additive, ~one line per streak per frame. An empty frame is not
 * redrawn (clearing an already clear canvas still re-uploads the layer).
 */
interface Streak {
  /** Direction from the vanishing point (radians). */
  a: number;
  /** Distance travelled, 0 (at the point) → 1 (frame corner). */
  d: number;
  /** Individual speed factor. */
  v: number;
  /** Weight: thickness + brightness. */
  w: number;
  /** Palette slot. */
  c: number;
}

/** Electric blue, ice white, soft violet — the site's light. */
const PALETTE = ['rgb(120 160 255)', 'rgb(225 235 255)', 'rgb(160 140 255)'];

export class WarpStreaks {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly canvas: HTMLCanvasElement;
  private readonly dpr: number;
  private readonly streaks: Streak[] = [];
  private width = 1;
  private height = 1;
  private blank = true;
  private seed = 1;

  constructor(canvas: HTMLCanvasElement, opts: { dpr: number; count: number }) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('2D canvas unavailable');
    this.ctx = ctx;
    this.canvas = canvas;
    this.dpr = opts.dpr;
    for (let i = 0; i < opts.count; i++) {
      const s: Streak = { a: 0, d: 0, v: 0, w: 0, c: 0 };
      this.spawn(s);
      s.d = this.rand() * 1.1; // start spread through the field
      this.streaks.push(s);
    }
  }

  private rand(): number {
    // Small deterministic LCG: identical fields on every load.
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  private spawn(s: Streak): void {
    s.a = this.rand() * Math.PI * 2;
    s.d = 0.02 + this.rand() * 0.12;
    s.v = 0.55 + this.rand() * 0.9;
    s.w = this.rand();
    const r = this.rand();
    s.c = r < 0.62 ? 0 : r < 0.86 ? 1 : 2;
  }

  resize(cssW: number, cssH: number): void {
    this.width = Math.max(1, Math.round(cssW * this.dpr));
    this.height = Math.max(1, Math.round(cssH * this.dpr));
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.blank = true;
  }

  clear(): void {
    if (this.blank) return;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.blank = true;
  }

  /**
   * @param dt        seconds since the last frame
   * @param origin    vanishing point, CSS px
   * @param speed     forward speed 0–1 (1 = light speed)
   * @param intensity overall brightness 0–1
   */
  render(dt: number, origin: { x: number; y: number }, speed: number, intensity: number): void {
    if (intensity < 0.004) {
      this.clear();
      return;
    }
    const { ctx, dpr } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    this.blank = false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    const w = this.width / dpr;
    const h = this.height / dpr;
    const reach = Math.hypot(Math.max(origin.x, w - origin.x), Math.max(origin.y, h - origin.y));
    const step = Math.min(dt, 0.05);

    for (let c = 0; c < PALETTE.length; c++) {
      ctx.strokeStyle = PALETTE[c]!;
      for (const s of this.streaks) {
        if (s.c !== c) continue;
        // Perspective: outward speed grows with distance from the vanishing point.
        s.d += step * s.v * (0.05 + speed * (0.12 + s.d * 1.5));
        if (s.d > 1.08) {
          this.spawn(s);
          continue;
        }
        const len = Math.min(0.42, speed * s.v * (0.012 + s.d * 0.3));
        const d0 = Math.max(0, s.d - len);
        const cos = Math.cos(s.a);
        const sin = Math.sin(s.a);
        // Born faint at the centre, brightest mid-flight, gone at the edge.
        const life = Math.min(1, (s.d - 0.03) * 6) * Math.min(1, (1.08 - s.d) * 5);
        const alpha = intensity * life * (0.24 + 0.7 * s.w);
        if (alpha <= 0.003) continue;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = (0.6 + s.w * 1.6) * (0.35 + s.d * 1.2);
        ctx.beginPath();
        ctx.moveTo(origin.x + cos * d0 * reach, origin.y + sin * d0 * reach);
        ctx.lineTo(origin.x + cos * s.d * reach, origin.y + sin * s.d * reach);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}
