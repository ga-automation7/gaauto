/**
 * OrbitSystem — six disciplines around one core.
 *
 * A luminous core; six tilted orbits in perspective, each carrying a node in
 * its capability's colour. Nodes pass in front of and behind the core (depth
 * sorted, nearer = larger and brighter), trailing a short arc of light. A
 * faint star field sits behind. Canvas 2D.
 */
export interface OrbitNode {
  /** Hex colour of the capability. */
  color: string;
}

interface Orbit {
  radius: number;
  tilt: number;
  spin: number;
  speed: number;
  phase: number;
  rgb: [number, number, number];
}

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export class OrbitSystem {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly canvas: HTMLCanvasElement;
  private readonly dpr: number;
  private readonly orbits: Orbit[];
  private readonly stars: { x: number; y: number; r: number; p: number }[] = [];
  private width = 1;
  private height = 1;

  constructor(canvas: HTMLCanvasElement, opts: { dpr: number; nodes: OrbitNode[] }) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('2D canvas unavailable');
    this.ctx = ctx;
    this.canvas = canvas;
    this.dpr = opts.dpr;
    this.orbits = opts.nodes.map((n, i) => ({
      radius: 0.34 + i * 0.1,
      tilt: 0.2 + (i % 3) * 0.1,
      spin: -0.5 + i * 0.21,
      speed: 0.16 - i * 0.015,
      phase: i * 1.05,
      rgb: hexToRgb(n.color),
    }));
    let seed = 9;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < 160; i++) this.stars.push({ x: rand(), y: rand(), r: 0.4 + rand() * 1.1, p: rand() * 6.3 });
  }

  resize(cssW: number, cssH: number): void {
    this.width = Math.max(1, Math.round(cssW * this.dpr));
    this.height = Math.max(1, Math.round(cssH * this.dpr));
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  /** @param open 0 → 1: the system unfolds as it arrives (orbits grow from the core). */
  render(time: number, open: number): void {
    const { ctx, dpr } = this;
    const w = this.width / dpr;
    const h = this.height / dpr;
    const cx = w / 2;
    const cy = h * 0.46;
    const unit = Math.min(w * 0.5, h * 0.85);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Stars, fading toward every edge so the field melts into the page.
    ctx.fillStyle = 'rgb(220, 228, 255)';
    for (const s of this.stars) {
      const edge = Math.max(0, 1 - Math.pow(Math.hypot((s.x - 0.5) / 0.55, (s.y - 0.46) / 0.52), 2.4));
      if (edge <= 0.01) continue;
      ctx.globalAlpha = (0.18 + 0.22 * (0.5 + 0.5 * Math.sin(time * 0.7 + s.p))) * edge;
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const ease = 1 - Math.pow(1 - Math.min(1, Math.max(0, open)), 3);
    type P = { x: number; y: number; z: number; o: Orbit };
    const points: P[] = [];
    // Orbit paths (thin ellipses in perspective).
    for (const o of this.orbits) {
      const R = o.radius * unit * ease;
      const cos = Math.cos(o.spin);
      const sin = Math.sin(o.spin);
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const a = (i / 120) * Math.PI * 2;
        const x = Math.cos(a) * R;
        const y = Math.sin(a) * R * o.tilt;
        const px = cx + x * cos - y * sin;
        const py = cy + x * sin + y * cos;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      const [r, g, b] = o.rgb;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.16)`;
      ctx.lineWidth = 1;
      ctx.stroke();
      const a = o.phase + time * o.speed;
      const x = Math.cos(a) * R;
      const y = Math.sin(a) * R * o.tilt;
      points.push({ x: cx + x * cos - y * sin, y: cy + x * sin + y * cos, z: Math.sin(a), o });
    }

    const drawNode = (p: P) => {
      const [r, g, b] = p.o.rgb;
      const near = 0.5 + 0.5 * p.z;
      const size = (3 + near * 5) * ease;
      const g1 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 6);
      g1.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.5 * (0.5 + near)})`);
      g1.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = g1;
      ctx.fillRect(p.x - size * 6, p.y - size * 6, size * 12, size * 12);
      ctx.fillStyle = `rgba(245, 247, 255, ${0.6 + near * 0.4})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 0.45, 0, Math.PI * 2);
      ctx.fill();
    };

    ctx.globalCompositeOperation = 'lighter';
    // Behind the core first, then the core, then the nodes in front of it.
    points.filter((p) => p.z < 0).forEach(drawNode);
    const breath = 0.9 + 0.1 * Math.sin(time * 1.2);
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, unit * 0.3 * breath);
    core.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    core.addColorStop(0.08, 'rgba(200, 214, 255, 0.8)');
    core.addColorStop(0.3, 'rgba(110, 130, 255, 0.28)');
    core.addColorStop(1, 'rgba(110, 90, 255, 0)');
    ctx.fillStyle = core;
    ctx.globalAlpha = ease;
    ctx.fillRect(cx - unit * 0.3, cy - unit * 0.3, unit * 0.6, unit * 0.6);
    ctx.globalAlpha = 1;
    points.filter((p) => p.z >= 0).forEach(drawNode);
    ctx.globalCompositeOperation = 'source-over';
  }
}
