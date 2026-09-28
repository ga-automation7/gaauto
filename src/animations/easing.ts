/**
 * Perceptual easing helpers for camera moves.
 */

/**
 * Exponential zoom. Linear interpolation of a zoom factor feels slow at first
 * and violently fast at the end, because the eye perceives zoom as a ratio.
 * This ease makes every equal slice of scroll multiply the zoom by the same
 * factor — a constant-speed dive with no lurch.
 *
 *   gsap.to(camera.state, { zoom: to, ease: expoZoom(from, to) })
 */
export function expoZoom(from: number, to: number): (t: number) => number {
  const ratio = to / from;
  if (Math.abs(ratio - 1) < 1e-6) return (t) => t;
  return (t) => (Math.pow(ratio, t) - 1) / (ratio - 1);
}

/**
 * A flight that cruises, then accelerates — as ONE curve, so the speed never
 * jumps. In log space (perceived zoom) the push moves at constant speed until
 * `a` (0–1), then speeds up smoothly to `boost`× that speed at the end.
 *
 *   gsap.to(el, { scale: to, ease: cruiseThenAccelerate(from, to, 0.7) })
 *
 * `pushFor` gives the end scale that makes the cruise part reach `cruiseTo`.
 */
export function cruiseThenAccelerate(from: number, to: number, a: number, boost = 3): (t: number) => number {
  const { k, c } = accelerateTerms(a, boost);
  const logT = (t: number) => k * t + (t > a ? c * (t - a) ** 3 : 0);
  const ratio = to / from;
  if (Math.abs(ratio - 1) < 1e-6) return (t) => t;
  return (t) => (Math.pow(ratio, logT(t)) - 1) / (ratio - 1);
}

export function pushFor(from: number, cruiseTo: number, a: number, boost = 3): number {
  const { k } = accelerateTerms(a, boost);
  return from * Math.pow(cruiseTo / from, 1 / (k * a));
}

function accelerateTerms(a: number, boost: number): { k: number; c: number } {
  const rest = Math.max(1e-3, 1 - a);
  const k = 1 / (1 + ((boost - 1) * rest) / 3);
  return { k, c: ((boost - 1) * k) / (3 * rest * rest) };
}

/** Gentle start + end with a long linear middle — for long scrubbed camera drifts. */
export const cruise = (t: number): number => {
  const a = 0.18;
  if (t < a) return (t * t) / (2 * a * (1 - a));
  if (t > 1 - a) return 1 - ((1 - t) * (1 - t)) / (2 * a * (1 - a));
  return (t - a / 2) / (1 - a);
};
