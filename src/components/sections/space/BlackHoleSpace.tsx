/**
 * 09 — EVENT HORIZON: a scrollymation.
 * A black hole ray-traced live, and scroll is the camera: from deep space the
 * view glides toward the event horizon, sinking toward the disk plane as it
 * slowly orbits; the disk flares as you close in; three beats of type surface
 * on the way; at the end you fall into the dark, and the final call rises out
 * of it. The renderer is its own chunk, loaded as the section approaches, and
 * renders only while on screen. Without WebGL2 (or with reduced motion) a
 * still rendition stands in.
 */
import { useEffect, useRef, useState } from 'react';
import type { BlackHoleRenderer, BlackHoleView } from '@/lib/webgl/BlackHoleRenderer';
import { byTier, getDeviceProfile } from '@/lib/device';
import { gsap, useGSAP } from '@/lib/gsap';
import { useTicker } from '@/hooks/useTicker';
import styles from './BlackHoleSpace.module.css';

/** Camera distance (Schwarzschild radii) across the scroll: far → at the horizon's edge. */
const FAR = 46;
const NEAR = 3.3;

export function BlackHoleSpace() {
  const device = getDeviceProfile(); // cached profile
  const live = device.webgl2 && !device.reducedMotion;
  const sectionRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<BlackHoleRenderer | null>(null);
  const progress = useRef(0);
  /** The camera, moved by scroll every frame (a ref: mutated outside React's render). */
  const view = useRef<BlackHoleView>({ azimuth: -0.6, elevation: 0.3, distance: FAR, fov: 46, flare: 0 });
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);

  // Load the renderer as the section approaches.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !live) return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setNear(true), { rootMargin: '140% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [live]);

  useEffect(() => {
    const host = hostRef.current;
    if (!near || !host) return;
    let disposed = false;
    let dispose: (() => void) | undefined;
    import('@/lib/webgl/BlackHoleRenderer')
      .then(({ BlackHoleRenderer }) => {
        if (disposed) return;
        const canvas = document.createElement('canvas');
        canvas.className = styles.canvas!;
        canvas.setAttribute('aria-hidden', 'true');
        host.appendChild(canvas);
        try {
          const renderer = new BlackHoleRenderer(canvas, {
            dpr: Math.min(device.dpr, 1.5),
            maxScale: byTier({ high: 0.75, medium: device.isMobile ? 0.45 : 0.52, low: 0.4 }),
            steps: byTier({ high: 160, medium: device.isMobile ? 100 : 125, low: 85 }),
          });
          const resize = () => renderer.resize(host.clientWidth, host.clientHeight);
          resize();
          const ro = new ResizeObserver(resize);
          ro.observe(host);
          rendererRef.current = renderer;
          // The shader compiles in the background; show the scene once it can draw.
          let poll = 0;
          const waitReady = () => {
            if (disposed) return;
            try {
              if (renderer.ready) {
                renderer.render(0, 0, view.current);
                setReady(true);
                return;
              }
            } catch (err) {
              console.warn('[space] black hole unavailable', err);
              return;
            }
            poll = requestAnimationFrame(waitReady);
          };
          poll = requestAnimationFrame(waitReady);
          dispose = () => {
            cancelAnimationFrame(poll);
            ro.disconnect();
            renderer.destroy();
            rendererRef.current = null;
            canvas.remove();
          };
        } catch (err) {
          console.warn('[space] black hole unavailable', err);
          canvas.remove();
        }
      })
      .catch((err: unknown) => console.warn('[space] renderer failed to load', err));
    return () => {
      disposed = true;
      dispose?.();
    };
  }, [near, device]);

  // Scroll is the camera.
  const ticker = useTicker((time, dt) => {
    const r = rendererRef.current;
    if (!r) return;
    const p = progress.current;
    const v = view.current;
    // Exponential approach: constant perceived speed all the way in.
    v.distance = FAR * Math.pow(NEAR / FAR, p);
    v.elevation = 0.3 - 0.24 * p * p;
    v.azimuth = -0.6 + p * 0.9 + time * 0.02;
    v.flare = Math.max(0, Math.sin(Math.min(1, Math.max(0, (p - 0.58) / 0.3)) * Math.PI)) * 0.42;
    r.render(time, dt, v);
  });

  // Render only while the section is on screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !ready) return;
    const io = new IntersectionObserver(([e]) => (e?.isIntersecting ? ticker.start() : ticker.stop()));
    io.observe(el);
    return () => {
      io.disconnect();
      ticker.stop();
    };
  }, [ready, ticker]);

  // Scroll → progress, and the beats of type along the way.
  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section || !live) return;
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => (progress.current = self.progress),
        },
      });
      tl.to('[data-beat="hint"]', { autoAlpha: 0, y: 12, duration: 0.06 }, 0.02);
      tl.fromTo('[data-beat="one"]', { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -40, duration: 0.12 }, 0.24);
      tl.fromTo('[data-beat="two"]', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.34);
      tl.to('[data-beat="two"]', { autoAlpha: 0, y: -40, duration: 0.1 }, 0.56);
      tl.fromTo('[data-beat="three"]', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.8);
      // Falling in: the whole scene dissolves into the page's own dark at the very end,
      // so the final call rises out of the same atmosphere (no painted edge, no seam).
      tl.fromTo('[data-beat="scene"]', { opacity: 1 }, { opacity: 0, duration: 0.13, ease: 'power1.in' }, 0.87);
      tl.set({}, {}, 1);
    },
    { scope: sectionRef, dependencies: [live] },
  );

  return (
    <section
      ref={sectionRef}
      id="space"
      className={styles.section}
      data-live={live || undefined}
      aria-labelledby="space-title"
    >
      <div className={styles.sticky}>
        <div className={styles.scene} data-beat="scene">
          <div ref={hostRef} className={styles.stage} data-ready={ready || undefined}>
            {!live && <div className={styles.still} aria-hidden="true" />}
          </div>
          <div className={styles.glow} aria-hidden="true" />
        </div>

        <div className={`container ${styles.beat} ${styles.one}`} data-beat="one">
          <p className={styles.kicker}>
            <span className="t-num">09</span>
            <span className={styles.rule} />
            <span>Event horizon</span>
          </p>
          <h2 id="space-title" className={styles.lockup}>
            <span className={styles.bold}>Where light</span>
            <span className={styles.serif}>bends</span>
          </h2>
          <p className={`${styles.support} t-lead`}>
            A black hole, ray traced live in your browser, with light itself curving around it.
          </p>
        </div>

        <div className={`container ${styles.beat} ${styles.two}`} data-beat="two">
          <p className={styles.statement}>
            <span className={styles.bold}>Every system has</span>
            <span className={styles.serif}>a centre of gravity.</span>
          </p>
          <p className={`${styles.support} t-lead`}>Ours is intelligence. Everything we build turns around it.</p>
        </div>

        <div className={`container ${styles.beat} ${styles.three}`} data-beat="three">
          <p className={styles.small}>Beyond the horizon…</p>
        </div>

        <p className={styles.hint} data-beat="hint" aria-hidden="true">
          <span>Scroll to experience</span>
          <svg viewBox="0 0 16 24" className={styles.arrow}>
            <path d="M8 2v18M2 14l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </p>
      </div>
    </section>
  );
}
