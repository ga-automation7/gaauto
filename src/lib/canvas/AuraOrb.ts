/**
 * AuraOrb — AURA's presence: a living orb of light, in the spirit of a voice
 * assistant's orb, drawn in the site's palette.
 *
 * Inside a glass sphere, soft blobs of electric blue, cyan, violet and white
 * drift on slow Lissajous paths and mix additively like light in liquid; thin
 * energy ribbons turn through it; a specular sheen and a fine rim give it
 * glass. `energy` (0–1) shapes it: a calm breath when idle, faster, brighter
 * and wider when AURA speaks or someone hovers.
 *
 * Canvas 2D; a handful of gradients per frame.
 */
interface Blob {
  color: [number, number, number];
  /** Radius as a fraction of the orb radius. */
  size: number;
  ax: number;
  ay: number;
  fx: number;
  fy: number;
  phase: number;
}

const BLOBS: Blob[] = [
  { color: [91, 140, 255], size: 0.95, ax: 0.42, ay: 0.36, fx: 0.31, fy: 0.23, phase: 0 },
  { color: [111, 216, 255], size: 0.7, ax: 0.5, ay: 0.44, fx: 0.19, fy: 0.29, phase: 1.7 },
  { color: [139, 107, 255], size: 0.85, ax: 0.46, ay: 0.5, fx: 0.25, fy: 0.17, phase: 3.1 },
  { color: [201, 214, 255], size: 0.45, ax: 0.3, ay: 0.3, fx: 0.37, fy: 0.33, phase: 4.4 },
  { color: [59, 91, 255], size: 0.8, ax: 0.52, ay: 0.4, fx: 0.14, fy: 0.21, phase: 5.2 },
];

export class AuraOrb {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly canvas: HTMLCanvasElement;
  private readonly dpr: number;
  private width = 1;
  private height = 1;
  /** Smoothed energy (eases toward the target so changes never jump). */
  private energy = 0.3;
  private clock = 0;

  constructor(canvas: HTMLCanvasElement, opts: { dpr: number }) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('2D canvas unavailable');
    this.ctx = ctx;
    this.canvas = canvas;
    this.dpr = opts.dpr;
  }

  resize(cssW: number, cssH: number): void {
    this.width = Math.max(1, Math.round(cssW * this.dpr));
    this.height = Math.max(1, Math.round(cssH * this.dpr));
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  /**
   * @param dt      seconds since the last frame
   * @param target  desired energy 0 (calm) → 1 (speaking)
   */
  render(dt: number, target: number): void {
    const { ctx, dpr } = this;
    const step = Math.min(dt, 0.05);
    this.energy += (target - this.energy) * Math.min(1, step * 2.4);
    const e = this.energy;
    // Time runs faster when AURA is active: the light swirls quicker.
    this.clock += step * (0.55 + e * 1.3);
    const t = this.clock;

    const w = this.width / dpr;
    const h = this.height / dpr;
    const cx = w / 2;
    const cy = h / 2;
    const breath = 1 + Math.sin(t * 1.6) * (0.012 + e * 0.022);
    const R = Math.min(w, h) * 0.3 * breath;
    // The glow must end inside the canvas (a clipped gradient shows as a square).
    const reach = Math.min(w, h) * 0.5;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // ── Outer glow: the orb lights the space around it ──
    ctx.globalCompositeOperation = 'lighter';
    const halo = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, reach);
    halo.addColorStop(0, `rgba(96, 128, 255, ${0.34 + e * 0.22})`);
    halo.addColorStop(0.4, `rgba(110, 90, 255, ${0.1 + e * 0.1})`);
    halo.addColorStop(1, 'rgba(80, 60, 200, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);

    // ── The sphere ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalCompositeOperation = 'source-over';
    const base = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.25, R * 0.1, cx, cy, R);
    base.addColorStop(0, '#1b2376');
    base.addColorStop(1, '#070824');
    ctx.fillStyle = base;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

    // Light in liquid: blobs drifting and mixing additively.
    ctx.globalCompositeOperation = 'lighter';
    for (const b of BLOBS) {
      const amp = 0.8 + e * 0.35;
      const x = cx + Math.sin(t * b.fx * 2.2 + b.phase) * b.ax * R * amp;
      const y = cy + Math.cos(t * b.fy * 2.2 + b.phase * 1.3) * b.ay * R * amp;
      const r = b.size * R * (0.9 + 0.1 * Math.sin(t * 1.3 + b.phase));
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const [cr, cg, cb] = b.color;
      g.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${0.78 + e * 0.22})`);
      g.addColorStop(0.5, `rgba(${cr}, ${cg}, ${cb}, ${0.26 + e * 0.14})`);
      g.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // A luminous heart that swells when AURA speaks.
    const heart = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * (0.55 + e * 0.2));
    heart.addColorStop(0, `rgba(235, 242, 255, ${0.35 + e * 0.35})`);
    heart.addColorStop(0.4, `rgba(150, 180, 255, ${0.14 + e * 0.14})`);
    heart.addColorStop(1, 'rgba(120, 140, 255, 0)');
    ctx.fillStyle = heart;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

    // Energy ribbons: thin rings of light, wavering, turning through the sphere.
    ctx.lineWidth = 1.4;
    for (let k = 0; k < 3; k++) {
      const spin = t * (0.35 + k * 0.12) * (k % 2 ? -1 : 1);
      const tilt = 0.35 + k * 0.18 + Math.sin(t * 0.4 + k) * 0.08;
      ctx.beginPath();
      for (let i = 0; i <= 96; i++) {
        const a = (i / 96) * Math.PI * 2;
        const wave = 1 + Math.sin(a * (3 + k) + t * (1.5 + e * 2)) * (0.04 + e * 0.08);
        const rx = R * (0.62 + k * 0.1) * wave;
        const ry = rx * tilt;
        const px = Math.cos(a) * rx;
        const py = Math.sin(a) * ry;
        const x = cx + px * Math.cos(spin) - py * Math.sin(spin);
        const y = cy + px * Math.sin(spin) + py * Math.cos(spin);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(215, 226, 255, ${0.24 + e * 0.26 - k * 0.04})`;
      ctx.stroke();
    }

    // Depth: the edge falls into shadow…
    ctx.globalCompositeOperation = 'source-over';
    const shade = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R);
    shade.addColorStop(0, 'rgba(5, 6, 20, 0)');
    shade.addColorStop(1, 'rgba(5, 6, 20, 0.45)');
    ctx.fillStyle = shade;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    // …and glass catches the light.
    ctx.globalCompositeOperation = 'lighter';
    const sheen = ctx.createRadialGradient(cx - R * 0.36, cy - R * 0.48, 0, cx - R * 0.36, cy - R * 0.48, R * 0.42);
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    sheen.addColorStop(0.35, 'rgba(255, 255, 255, 0.12)');
    sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.restore();

    // A fine rim.
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(190, 206, 255, ${0.28 + e * 0.2})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }
}
