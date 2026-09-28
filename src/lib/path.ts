import type { NormPoint } from '@/types/media';

/**
 * Smooth SVG path through points (Catmull-Rom → cubic Bézier).
 * Points are normalized; `w`/`h` scale them into the SVG's coordinate space.
 */
export function smoothPath(points: NormPoint[], w: number, h: number, tension = 0.5): string {
  if (points.length < 2) return '';
  const p = points.map((pt) => ({ x: pt.x * w, y: pt.y * h }));
  const first = p[0]!;
  let d = `M${first.x.toFixed(1)},${first.y.toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i]!;
    const p1 = p[i]!;
    const p2 = p[i + 1]!;
    const p3 = p[i + 2] ?? p2;
    const t = tension / 3;
    const c1x = p1.x + (p2.x - p0.x) * t;
    const c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t;
    const c2y = p2.y - (p3.y - p1.y) * t;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

/** Sample a polyline (normalized) at arc-length fraction t ∈ [0,1]. */
export function samplePolyline(points: NormPoint[], t: number, aspect = 1): NormPoint {
  if (points.length === 1) return points[0]!;
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const len = Math.hypot((b.x - a.x) * aspect, b.y - a.y);
    segs.push(len);
    total += len;
  }
  let target = Math.min(Math.max(t, 0), 1) * total;
  for (let i = 0; i < segs.length; i++) {
    const len = segs[i]!;
    if (target <= len || i === segs.length - 1) {
      const a = points[i]!;
      const b = points[i + 1]!;
      const k = len === 0 ? 0 : target / len;
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }
    target -= len;
  }
  return points[points.length - 1]!;
}
