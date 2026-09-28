/**
 * Smooth scrolling — one clock for everything.
 *
 * Lenis interpolates the scroll position; it is advanced from the GSAP ticker,
 * which also drives ScrollTrigger, the cinematic director and every canvas.
 * One requestAnimationFrame loop per frame, in a fixed order:
 *
 *   gsap.ticker ─► lenis.raf ─► 'scroll' ─► ScrollTrigger.update ─► director/scenes
 *              └─► canvas renderers (registered later in the same tick)
 *
 * With reduced motion Lenis is not created; native scrolling still feeds the
 * same velocity/position state so effects stay consistent.
 */
import Lenis from 'lenis';
import { debug } from './debug';
import { gsap, ScrollTrigger } from './gsap';

export interface ScrollState {
  /** Current (smoothed) scroll position in px. */
  y: number;
  /** Signed velocity in px per frame (≈60fps). */
  velocity: number;
  direction: 1 | -1 | 0;
}

const state: ScrollState = { y: 0, velocity: 0, direction: 0 };
let lenis: Lenis | null = null;

export const getScrollState = (): Readonly<ScrollState> => state;
export const getLenis = (): Lenis | null => lenis;

export function startSmoothScroll({ smooth }: { smooth: boolean }): () => void {
  if (!smooth) {
    let last = window.scrollY;
    const tick = () => {
      const y = window.scrollY;
      const v = y - last;
      last = y;
      state.y = y;
      state.velocity += (v - state.velocity) * 0.3;
      state.direction = v > 0 ? 1 : v < 0 ? -1 : state.direction;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }

  lenis = new Lenis({
    // Heavy, weighted feel without lag: interpolation rather than fixed duration.
    lerp: 0.085,
    smoothWheel: true,
    wheelMultiplier: 0.92,
    // Native momentum on touch devices — smoother and cheaper than emulating it.
    syncTouch: false,
    touchMultiplier: 1,
    autoRaf: false,
    anchors: false,
    stopInertiaOnNavigate: true,
  });

  lenis.on('scroll', (l: Lenis) => {
    state.y = l.scroll;
    state.velocity = l.velocity;
    state.direction = l.direction === 1 ? 1 : l.direction === -1 ? -1 : 0;
    ScrollTrigger.update();
  });

  if (debug.enabled) Object.assign(window, { __lenis: lenis });

  const raf = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(raf);
  // Never "catch up" after a long frame — that reads as a jump. Stay continuous.
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(raf);
    lenis?.destroy();
    lenis = null;
  };
}

export interface ScrollToOptions {
  offset?: number;
  immediate?: boolean;
  duration?: number;
}

/** Scroll to an element, selector, hash or pixel position through the active scroller. */
export function scrollToTarget(target: string | number | HTMLElement, opts: ScrollToOptions = {}): void {
  const el =
    typeof target === 'string' ? document.querySelector<HTMLElement>(target.startsWith('#') ? target : `#${target}`) : target;
  if (el === null) return;
  if (lenis) {
    lenis.scrollTo(el, {
      offset: opts.offset ?? 0,
      immediate: opts.immediate,
      duration: opts.duration ?? 1.8,
      easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
    });
    return;
  }
  const top = typeof el === 'number' ? el : el.getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0);
  window.scrollTo({ top, behavior: opts.immediate ? 'auto' : 'smooth' });
}

export const lockScroll = (): void => lenis?.stop();
export const unlockScroll = (): void => lenis?.start();
