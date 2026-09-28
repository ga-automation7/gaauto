/**
 * The atmosphere every section after the film lives in: violet nebula fog
 * drifting at the corners of the viewport (atmospheric — never a purple page),
 * a few soft blue motes at three depths and the occasional tiny light pulse.
 * One fixed layer behind transparent sections, so they melt into each other
 * instead of stacking as blocks.
 *
 * It rises out of the film's last moments — fading in with scroll as the
 * entity recedes — so film and page are one continuous piece. Paused when the
 * tab is hidden. Reduced motion: the fog stays, still; no motes.
 */
import { useEffect, useRef } from 'react';
import { AmbientField } from '@/lib/canvas/AmbientField';
import { getDeviceProfile } from '@/lib/device';
import { gsap } from '@/lib/gsap';
import { getScrollState } from '@/lib/smoothScroll';
import { useTicker } from '@/hooks/useTicker';
import styles from './AmbientCosmos.module.css';

export function AmbientCosmos() {
  const layerRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<AmbientField | null>(null);
  const device = getDeviceProfile();
  const animate = !device.reducedMotion;

  // 30 fps is plenty for slow motes; every other frame is free for the page.
  const frame = useRef(0);
  const ticker = useTicker((time, dt) => {
    if (frame.current++ % 2) return;
    fieldRef.current?.render(time, dt * 2, getScrollState().velocity);
  });

  // Motes (fresh canvas per mount).
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !animate) return;
    const canvas = document.createElement('canvas');
    canvas.className = styles.canvas!;
    host.appendChild(canvas);
    const field = new AmbientField(canvas, {
      // Soft sprites: half resolution looks identical and uploads a quarter of the pixels.
      dpr: 0.5,
      count: device.isMobile ? 22 : device.tier === 'high' ? 54 : 40,
    });
    fieldRef.current = field;
    const resize = () => field.resize(window.innerWidth, window.innerHeight);
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      fieldRef.current = null;
      canvas.remove();
    };
  }, [animate, device]);

  // Fades in through the film's final screens (scrubbed); paused when invisible or the tab is hidden.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const film = document.getElementById('film');
    let on = !film; // no film (reduced motion): always there
    const apply = () => {
      if (on && animate && !document.hidden) ticker.start();
      else {
        ticker.stop();
        fieldRef.current?.clear();
      }
    };
    const tween = film
      ? gsap.fromTo(
          layer,
          { opacity: 0 },
          {
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: film,
              start: 'bottom 190%',
              end: 'bottom 92%',
              scrub: true,
              onUpdate: (self) => {
                const next = self.progress > 0.001;
                if (next !== on) {
                  on = next;
                  apply();
                }
              },
            },
          },
        )
      : null;
    if (!film) gsap.set(layer, { opacity: 1 });
    document.addEventListener('visibilitychange', apply);
    apply();
    return () => {
      tween?.scrollTrigger?.kill();
      tween?.kill();
      document.removeEventListener('visibilitychange', apply);
      ticker.stop();
    };
  }, [animate, ticker]);

  return (
    <div ref={layerRef} className={styles.ambient} aria-hidden="true">
      <div className={styles.fog} />
      <div ref={hostRef} className={styles.motes} />
    </div>
  );
}
