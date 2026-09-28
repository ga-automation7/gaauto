import type { RefObject } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

/**
 * Scroll-linked depth inside a section:
 *   data-speed="0.8"  moves slower than the page (backgrounds, fog); >1 moves faster (floating panels)
 *   data-zoom         settles from 1.06 → 1 as it travels into view (cinematic images)
 * Transform-only, scrubbed on the shared ticker; lighter on small screens.
 * Reduced motion: nothing moves.
 */
export function useParallax<T extends HTMLElement>(ref: RefObject<T | null>): void {
  useGSAP(
    () => {
      const root = ref.current;
      if (!root || document.documentElement.dataset.motion === 'reduced') return;
      const depth = window.matchMedia('(max-width: 767px)').matches ? 110 : 220;
      for (const el of gsap.utils.toArray<HTMLElement>('[data-speed]', root)) {
        const travel = (1 - Number(el.dataset.speed ?? 1)) * depth;
        gsap.fromTo(
          el,
          { y: -travel / 2 },
          {
            y: travel / 2,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      }
      for (const el of gsap.utils.toArray<HTMLElement>('[data-zoom]', root)) {
        gsap.fromTo(
          el,
          { scale: 1.06 },
          {
            scale: 1,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'center center', scrub: true },
          },
        );
      }
    },
    { scope: ref },
  );
}
