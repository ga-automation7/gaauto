/**
 * AmbientField — the quiet life behind every section after the film:
 * a few dozen soft blue motes at three depths, drifting slowly and shifting
 * with scroll (nearer motes move more), and every few seconds a tiny light
 * pulse somewhere in the dark; very rarely a shooting star crosses the sky.
 * Never an explosion — atmosphere, not effect.
 *
 * Canvas 2D with pre-rendered sprites (one drawImage per mote).
 */
interface Mote {
  x: number;
  y: number;
  /** Depth 0 (far) → 1 (near): size, brightness and parallax. */
  z: number;
  vx: number;
  vy: number;
  phase: number;
}

interface Pulse {
  x: number;
  y: number;
  age: number;
}

interface Meteor {
  x: number;
  y: number;
  /** Direction of travel (unit vector, screen space). */
  dx: number;
  dy: number;
  age: number;
}

const METEOR_LIFE = 1.1;

function sprite(radius: number, rgb: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = radius * 2;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(radius, radius, 0, radius, radius, radius);
  grad.addColorStop(0, `rgba(${rgb}, 1)`);
  grad.addColorStop(0.18, `rgba(${rgb}, 0.55)`);
  grad.addColorStop(0.5, `rgba(${rgb}, 0.12)`);
  grad.addColorStop(1, `rgba(${rgb}, 0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, radius * 2, radius * 2);
  return c;
}

export class AmbientField {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly canvas: HTMLCanvasElement;
  private readonly dpr: number;
  private readonly motes: Mote[] = [];
  private readonly pulses: Pulse[] = [];
  private readonly blue = sprite(32, '140, 170, 255');
  private readonly violet = sprite(32, '170, 150, 255');
  private width = 1;
  private height = 1;
  private nextPulse = 2;
  private readonly meteors: Meteor[] = [];
  private nextMeteor = 7;
  private seed = 3;

  constructor(canvas: HTMLCanvasElement, opts: { dpr: number; count: number }) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('2D canvas unavailable');
    this.ctx = ctx;
    this.canvas = canvas;
    this.dpr = opts.dpr;
    for (let i = 0; i < opts.count; i++) {
      this.motes.push({
        x: this.rand(),
        y: this.rand(),
        z: this.rand() ** 1.6,
        vx: (this.rand() - 0.5) * 0.004,
        vy: -0.002 - this.rand() * 0.004,
        phase: this.rand() * Math.PI * 2,
      });
    }
  }

  private rand(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  resize(cssW: number, cssH: number): void {
    this.width = Math.max(1, Math.round(cssW * this.dpr));
    this.height = Math.max(1, Math.round(cssH * this.dpr));
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  /**
   * @param time      seconds
   * @param dt        seconds since the last frame
   * @param scrollV   scroll velocity (px per frame) — nearer motes shift more
   */
  render(time: number, dt: number, scrollV: number): void {
    const { ctx, dpr } = this;
    const w = this.width / dpr;
    const h = this.height / dpr;
    const step = Math.min(dt, 0.05);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'lighter';

    const shift = Math.max(-40, Math.min(40, scrollV)) / h;
    for (const m of this.motes) {
      m.x += m.vx * step;
      m.y += m.vy * step - shift * (0.15 + m.z * 0.85) * 0.35;
      if (m.y < -0.05) m.y += 1.1;
      if (m.y > 1.05) m.y -= 1.1;
      if (m.x < -0.05) m.x += 1.1;
      if (m.x > 1.05) m.x -= 1.1;
      const size = 3 + m.z * 9;
      const twinkle = 0.55 + 0.45 * Math.sin(time * (0.6 + m.z) + m.phase);
      ctx.globalAlpha = (0.08 + m.z * 0.32) * twinkle;
      ctx.drawImage(m.z > 0.7 ? this.violet : this.blue, m.x * w - size, m.y * h - size, size * 2, size * 2);
    }

    // A rare, tiny light pulse: a point swells and fades somewhere in the dark.
    this.nextPulse -= step;
    if (this.nextPulse <= 0) {
      this.pulses.push({ x: 0.1 + this.rand() * 0.8, y: 0.1 + this.rand() * 0.8, age: 0 });
      this.nextPulse = 3.5 + this.rand() * 4;
    }
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i]!;
      p.age += step;
      const t = p.age / 2.4;
      if (t >= 1) {
        this.pulses.splice(i, 1);
        continue;
      }
      const size = 6 + t * 38;
      ctx.globalAlpha = Math.sin(t * Math.PI) * 0.4;
      ctx.drawImage(this.blue, p.x * w - size, p.y * h - size, size * 2, size * 2);
    }

    // A shooting star, every 10–20 s: a thin streak with a bright head, gone in a second.
    this.nextMeteor -= step;
    if (this.nextMeteor <= 0) {
      const a = (this.rand() < 0.5 ? 0.18 : Math.PI - 0.18) + (this.rand() - 0.5) * 0.3;
      this.meteors.push({
        x: 0.15 + this.rand() * 0.7,
        y: 0.04 + this.rand() * 0.3,
        dx: Math.cos(a),
        dy: Math.sin(a),
        age: 0,
      });
      this.nextMeteor = 10 + this.rand() * 10;
    }
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i]!;
      m.age += step;
      const t = m.age / METEOR_LIFE;
      if (t >= 1) {
        this.meteors.splice(i, 1);
        continue;
      }
      const travel = Math.min(w, h) * 0.55 * t;
      const hx = m.x * w + m.dx * travel;
      const hy = m.y * h + m.dy * travel;
      const len = Math.min(w, h) * 0.16 * Math.sin(t * Math.PI);
      const fade = Math.sin(t * Math.PI);
      const grad = ctx.createLinearGradient(hx, hy, hx - m.dx * len, hy - m.dy * len);
      grad.addColorStop(0, `rgba(230, 236, 255, ${0.85 * fade})`);
      grad.addColorStop(1, 'rgba(160, 170, 255, 0)');
      ctx.globalAlpha = 1;
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx - m.dx * len, hy - m.dy * len);
      ctx.stroke();
      ctx.globalAlpha = 0.7 * fade;
      ctx.drawImage(this.blue, hx - 7, hy - 7, 14, 14);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  clear(): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}
