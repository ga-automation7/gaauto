/**
 * Device capability profile. Decides how much spectacle a device can afford:
 * particle counts, canvas resolution, whether to run WebGL, which media variant.
 *
 * Motion preference: defaults to the OS "reduce motion" setting, can be
 * overridden by the visitor (Motion toggle → localStorage) or by URL:
 *   ?motion=full | ?motion=reduce      ?tier=low|medium|high
 */
export type DeviceTier = 'high' | 'medium' | 'low';

export interface DeviceProfile {
  tier: DeviceTier;
  /** Narrow viewport or coarse primary pointer. */
  isMobile: boolean;
  isTouch: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  /** Device pixel ratio, capped per tier — canvases never render above this. */
  dpr: number;
  webgl2: boolean;
  /** Serve the `lite` image variants. */
  liteMedia: boolean;
}

interface NavigatorExtras {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

function detectWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    const ok = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

export type MotionPreference = 'full' | 'reduced';
const MOTION_KEY = 'ga-motion';

/** Explicit visitor choice, if any (URL beats storage). */
export function getMotionOverride(): MotionPreference | null {
  const q = new URLSearchParams(window.location.search).get('motion');
  if (q === 'full') return 'full';
  if (q === 'reduce' || q === 'reduced') return 'reduced';
  try {
    const stored = window.localStorage.getItem(MOTION_KEY);
    if (stored === 'full' || stored === 'reduced') return stored;
  } catch {
    /* storage unavailable (private mode) — fall through to the OS setting */
  }
  return null;
}

export function prefersReducedMotion(): boolean {
  const override = getMotionOverride();
  if (override) return override === 'reduced';
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Persist the visitor's choice and reload so every system re-initialises cleanly. */
export function setMotionPreference(pref: MotionPreference): void {
  try {
    window.localStorage.setItem(MOTION_KEY, pref);
  } catch {
    /* ignore */
  }
  const url = new URL(window.location.href);
  url.searchParams.delete('motion');
  window.location.replace(url.toString());
}

let cached: DeviceProfile | null = null;

export function getDeviceProfile(): DeviceProfile {
  if (cached) return cached;
  const params = new URLSearchParams(window.location.search);
  const nav = navigator as Navigator & NavigatorExtras;

  const cores = navigator.hardwareConcurrency || 4;
  const memory = nav.deviceMemory ?? 8;
  const saveData = !!nav.connection?.saveData || /(^|-)2g$/.test(nav.connection?.effectiveType ?? '');
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const isMobile = isTouch || window.innerWidth < 768;
  const reducedMotion = prefersReducedMotion();

  let tier: DeviceTier = 'high';
  if (saveData || memory <= 2 || cores <= 2 || (isMobile && cores <= 4)) tier = 'low';
  else if (isMobile || cores <= 4 || memory <= 4) tier = 'medium';

  const forced = params.get('tier');
  if (forced === 'low' || forced === 'medium' || forced === 'high') tier = forced;

  const webgl2 = !reducedMotion && tier !== 'low' ? detectWebGL2() : false;
  const rawDpr = window.devicePixelRatio || 1;
  const dprCap = tier === 'high' ? 2 : tier === 'medium' ? 1.5 : 1;

  cached = {
    tier,
    isMobile,
    isTouch,
    reducedMotion,
    saveData,
    dpr: Math.min(rawDpr, dprCap),
    webgl2,
    liteMedia: tier === 'low' || saveData,
  };
  return cached;
}

/** Scale a quantity (particle count etc.) by tier. */
export function byTier<T>(values: Record<DeviceTier, T>): T {
  return values[getDeviceProfile().tier];
}
