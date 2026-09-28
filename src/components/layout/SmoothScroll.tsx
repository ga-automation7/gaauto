import { useEffect, type ReactNode } from 'react';
import { getDeviceProfile } from '@/lib/device';
import { ScrollTrigger } from '@/lib/gsap';
import { startSmoothScroll } from '@/lib/smoothScroll';

/**
 * Owns the scroll engine for the app lifetime. Lenis on desktop pointers,
 * native scrolling for reduced motion; touch devices keep native momentum.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const { reducedMotion } = getDeviceProfile();
    const stop = startSmoothScroll({ smooth: !reducedMotion });

    // Layout can shift when fonts and late media arrive — re-measure triggers once settled.
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);

    return () => {
      cancelled = true;
      window.removeEventListener('load', onLoad);
      stop();
    };
  }, []);

  return <>{children}</>;
}
