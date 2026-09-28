import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';

interface MagneticOptions {
  /** Fraction of the pointer offset the element follows (0–1). */
  strength?: number;
  /** Extra activation radius around the element, px. */
  radius?: number;
}

/**
 * Magnetic hover: the element leans toward the cursor, then settles back with a
 * heavy ease. Fine pointers only; no-op for touch and reduced motion.
 */
export function useMagnetic<T extends HTMLElement>({ strength = 0.3, radius = 24 }: MagneticOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (document.documentElement.dataset.motion === 'reduced') return;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3.out' });
    let rect: DOMRect | null = null;
    let engaged = false;

    const onMove = (e: PointerEvent) => {
      if (!rect) rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const within =
        Math.abs(dx) < rect.width / 2 + radius && Math.abs(dy) < rect.height / 2 + radius;
      if (within) {
        engaged = true;
        xTo(dx * strength);
        yTo(dy * strength);
      } else if (engaged) {
        engaged = false;
        xTo(0);
        yTo(0);
      }
    };
    const invalidate = () => {
      rect = null;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', invalidate);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', invalidate);
      window.removeEventListener('resize', invalidate);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [strength, radius]);

  return ref;
}
