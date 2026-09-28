export const clamp = (v: number, min = 0, max = 1): number => (v < min ? min : v > max ? max : v);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Map v from [a,b] to [0,1], clamped. */
export const progressIn = (v: number, a: number, b: number): number => (b === a ? (v >= b ? 1 : 0) : clamp((v - a) / (b - a)));

export const mapRange = (v: number, inA: number, inB: number, outA: number, outB: number): number =>
  lerp(outA, outB, progressIn(v, inA, inB));

export const smoothstep = (a: number, b: number, v: number): number => {
  const t = progressIn(v, a, b);
  return t * t * (3 - 2 * t);
};

/** Frame-rate independent exponential smoothing factor. */
export const damp = (lambda: number, dt: number): number => 1 - Math.exp(-lambda * dt);

export const easeInCubic = (t: number): number => t * t * t;
export const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;
export const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/** Deterministic pseudo-random generator (mulberry32) — stable layouts across renders. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const hexToRgbUnit = (hex: string): [number, number, number] => {
  const [r, g, b] = hexToRgb(hex);
  return [r / 255, g / 255, b / 255];
};
