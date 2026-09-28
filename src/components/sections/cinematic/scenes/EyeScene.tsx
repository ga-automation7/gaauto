/**
 * 01 — PERCEPTION → THE IRIS
 *
 * The camera pushes into the iris. Amber orbiters spiral into the pupil, the
 * pupil opens into a tunnel built from the iris's own fibres, the light turns
 * from human amber to machine blue, and we surface — in a flash — into the city.
 *
 * Layers (back → front): eye plate + reticle · WebGL (tunnel, particles) ·
 * vignette · flash · hero lockup UI.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { PlateMedia } from '@/components/common/PlateMedia';
import { CircleArrow } from '@/components/ui/CircleArrow';
import { Logo } from '@/components/ui/Logo';
import { media } from '@/config/media';
import { SceneCamera } from '@/lib/camera';
import { useStageScene } from '@/hooks/useStageScene';
import { useTicker } from '@/hooks/useTicker';
import { pointer, usePointerTracking } from '@/hooks/usePointer';
import { createHeroFxState, HeroRenderer, type IrisScreen } from '@/lib/webgl/HeroRenderer';
import { byTier } from '@/lib/device';
import { debug } from '@/lib/debug';
import { cruise, expoZoom } from '@/animations/easing';
import { scrollToTarget } from '@/lib/smoothScroll';
import { useStage } from '../StageContext';
import styles from './EyeScene.module.css';

const EYE = media.heroEye;
const IRIS = EYE.anchors.iris;

export function EyeScene() {
  const { device, size, shared, chapters } = useStage();
  usePointerTracking();

  const layerRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const uiRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLHeadingElement>(null);
  const lookRef = useRef<HTMLSpanElement>(null);
  const closerRef = useRef<HTMLSpanElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<HeroRenderer | null>(null);

  const camera = useMemo(
    () => new SceneCamera(EYE.width, EYE.height, { initial: { x: IRIS.x, y: IRIS.y, zoom: 1.06 } }),
    [],
  );
  const fx = useMemo(createHeroFxState, []);
  const iris = useMemo<IrisScreen>(() => ({ x: 0, y: 0, irisR: 0, pupilR: 0 }), []);
  const words = useRef({ lookW: 0, lookH: 0, closerW: 0, closerH: 0, brandW: 0, brandH: 0 });
  const layoutMode = useRef<'side' | 'stack'>('side');

  // Share the camera so later scenes can match-cut from it.
  useLayoutEffect(() => {
    if (debug.enabled) Object.assign(window, { __eye: { fx, camera, iris, renderer: rendererRef } });
    shared.cameras.eye = camera;
    return () => {
      delete shared.cameras.eye;
    };
  }, [camera, shared, fx, iris]);

  // WebGL: particles + tunnel. Falls back silently (CSS-only dive) when unavailable.
  // Each run owns a fresh canvas so a re-mount never inherits a lost context.
  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host || !device.webgl2) return;
    const canvas = document.createElement('canvas');
    canvas.className = styles.canvas!;
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    try {
      rendererRef.current = new HeroRenderer(canvas, {
        dust: byTier({ high: 1900, medium: device.isMobile ? 650 : 1150, low: 0 }),
        orbiters: byTier({ high: 380, medium: device.isMobile ? 140 : 240, low: 0 }),
        dpr: device.dpr,
        textureUrl: EYE.image.webp,
        iris: {
          x: IRIS.x,
          y: IRIS.y,
          irisRadius: EYE.anchors.irisRadius,
          pupilRadius: EYE.anchors.pupilRadius,
          plateAspect: EYE.width / EYE.height,
        },
      });
    } catch {
      rendererRef.current = null;
    }
    const { width, height } = size.get();
    rendererRef.current?.resize(width, height);
    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
      canvas.remove();
    };
  }, [device, size]);

  // Layout on resize (the only place we read layout).
  useEffect(() => {
    const layout = () => {
      const plate = plateRef.current;
      const layer = layerRef.current;
      if (!plate || !layer) return;
      const { width, height } = size.get();
      const mode = width / height >= 1.25 ? 'side' : 'stack';
      layoutMode.current = mode;
      layer.dataset.layout = mode;

      camera.resize(width, height);
      camera.layout(plate);
      rendererRef.current?.resize(width, height);

      const w = words.current;
      w.lookW = lookRef.current?.offsetWidth ?? 0;
      w.lookH = lookRef.current?.offsetHeight ?? 0;
      w.closerW = closerRef.current?.offsetWidth ?? 0;
      w.closerH = closerRef.current?.offsetHeight ?? 0;
      w.brandW = brandRef.current?.offsetWidth ?? 0;
      w.brandH = brandRef.current?.offsetHeight ?? 0;

      // Frame the eye: the largest iris that leaves room for the lockup.
      const defaultR = EYE.anchors.irisRadius * camera.H * 1.06;
      const gutter = Math.max(20, width * 0.042);
      let maxR: number;
      const header = 76;
      if (mode === 'side') {
        const room = (width - 2 * gutter - w.lookW - w.closerW - 2 * 28) / 2;
        const above = height / 2 - header - w.brandH - 44;
        maxR = Math.min(room / 1.1, above / 1.1, height * 0.32);
      } else {
        const bottom = 112;
        const room = (height - header - bottom - w.lookH - w.closerH - w.brandH - 64) / 2;
        maxR = Math.min(room / 1.1, width * 0.42);
      }
      camera.zoomBase = Math.min(1, Math.max(0.4, maxR / defaultR));
      frame(0, 0);
    };
    const unsubscribe = size.subscribe(layout);
    // Word widths change once the display fonts arrive.
    let alive = true;
    void document.fonts.ready.then(() => alive && layout());
    return () => {
      alive = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, size]);

  /** Per-frame: camera, iris-locked typography, WebGL. */
  function frame(time: number, dt: number) {
    const plate = plateRef.current;
    if (!plate) return;

    // Handheld parallax: the eye drifts a hair against the cursor.
    const k = Math.min(1, dt * 2.5);
    camera.offset.x += (pointer.x * -0.006 - camera.offset.x) * k;
    camera.offset.y += (pointer.y * -0.005 - camera.offset.y) * k;
    camera.apply(plate);

    const c = camera.project(IRIS);
    const unit = camera.unitScale();
    iris.x = c.x;
    iris.y = c.y;
    iris.irisR = EYE.anchors.irisRadius * unit;
    iris.pupilR = EYE.anchors.pupilRadius * unit;

    // Typography rides the edge of the iris: as the camera pushes in, the iris pushes the words out.
    const w = words.current;
    const gap = Math.max(18, iris.irisR * 0.12);
    const ring = iris.irisR * 1.1;
    const look = lookRef.current;
    const closer = closerRef.current;
    const brand = brandRef.current;
    if (look && closer && brand) {
      if (layoutMode.current === 'side') {
        look.style.transform = `translate3d(${(iris.x - ring - gap - w.lookW).toFixed(1)}px, ${(iris.y - w.lookH * 0.5).toFixed(1)}px, 0)`;
        closer.style.transform = `translate3d(${(iris.x + ring + gap).toFixed(1)}px, ${(iris.y - w.closerH * 0.5).toFixed(1)}px, 0)`;
        brand.style.transform = `translate3d(${(iris.x - w.brandW * 0.5).toFixed(1)}px, ${(iris.y - ring - 40 - w.brandH).toFixed(1)}px, 0)`;
      } else {
        const lookY = iris.y - ring - gap * 0.5 - w.lookH;
        look.style.transform = `translate3d(${(iris.x - w.lookW * 0.5).toFixed(1)}px, ${lookY.toFixed(1)}px, 0)`;
        closer.style.transform = `translate3d(${(iris.x - w.closerW * 0.5).toFixed(1)}px, ${(iris.y + ring + gap * 0.3).toFixed(1)}px, 0)`;
        brand.style.transform = `translate3d(${(iris.x - w.brandW * 0.5).toFixed(1)}px, ${(lookY - w.brandH - 22).toFixed(1)}px, 0)`;
      }
    }

    const r = rendererRef.current;
    if (r) {
      r.setPointer(pointer.x, pointer.y);
      r.render(time, dt, fx, iris);
    }
  }

  const ticker = useTicker(frame);

  useStageScene('eye', (tl, { chapters: ch }) => {
    const P = ch.spans.perception;
    const I = ch.spans.iris;
    const layer = layerRef.current!;
    const plate = plateRef.current!;

    // ── Camera: one continuous dive at constant perceived speed ──────
    // Exponential zoom = every equal slice of scroll magnifies by the same factor.
    const diveEnd = I.start + I.length * 0.55;
    tl.fromTo(camera.state, { zoom: 1.06 }, { zoom: 10, ease: expoZoom(1.06, 10), duration: diveEnd }, 0);
    tl.fromTo(camera.state, { rotate: 0 }, { rotate: -6, ease: cruise, duration: diveEnd }, 0);

    // ── Particles: drift → approach → warp ───────────────────────────
    tl.fromTo(fx, { travel: 0 }, { travel: 13, ease: 'power2.in', duration: I.end }, 0);
    tl.fromTo(
      fx,
      { suck: 0 },
      { suck: 1, ease: 'power1.in', duration: P.length * 0.75 },
      P.start + P.length * 0.3,
    );
    tl.fromTo(
      fx,
      { warm: 1 },
      { warm: 0, ease: 'power1.inOut', duration: I.length * 0.55 },
      I.start + I.length * 0.1,
    );

    // ── The pupil opens into the tunnel ──────────────────────────────
    tl.fromTo(
      fx,
      { portal: 0 },
      { portal: 1, ease: 'power1.inOut', duration: I.length * 0.5 + 0.3 },
      P.end - 0.3,
    );
    tl.fromTo(
      fx,
      { reveal: 0 },
      { reveal: 1, ease: 'power1.inOut', duration: I.length * 0.5 },
      I.start - 0.05,
    );
    tl.fromTo(
      fx,
      { tunnelTravel: 0 },
      { tunnelTravel: 9, ease: 'power2.in', duration: I.length + 0.3 },
      P.end - 0.3,
    );
    tl.fromTo(
      fx,
      { shift: 0.35 },
      { shift: 1, ease: 'power1.inOut', duration: I.length * 0.45 },
      P.end - 0.3,
    );

    // ── Light at the end: flash, surface into the city ───────────────
    tl.fromTo(
      fx,
      { flash: 0 },
      { flash: 1, ease: 'power3.in', duration: I.length * 0.22 },
      I.end - I.length * 0.23,
    );
    tl.fromTo(
      flashRef.current,
      { opacity: 0 },
      { opacity: 1, ease: 'power2.in', duration: 0.14 },
      I.end - 0.14,
    );
    tl.set(fx, { portal: 0, reveal: 0 }, I.end + 0.001);
    tl.to(flashRef.current, { opacity: 0, ease: 'power2.out', duration: 0.62 }, I.end + 0.002);
    tl.fromTo(fx, { burst: 0 }, { burst: 1, ease: 'power2.out', duration: 0.8 }, I.end - 0.05);
    tl.fromTo(fx, { particles: 1 }, { particles: 0, ease: 'power1.in', duration: 0.75 }, I.end + 0.05);

    // ── Eye plate leaves once the portal fills the frame ─────────────
    tl.set(plate, { autoAlpha: 1 }, 0);
    tl.set(plate, { autoAlpha: 0 }, I.start + I.length * 0.62);
    tl.fromTo(vignetteRef.current, { opacity: 0.55 }, { opacity: 1, duration: P.length }, P.start);
    // As the iris fills the frame (and softens from magnification), sink it toward the dark.
    tl.fromTo(
      shadeRef.current,
      { opacity: 0 },
      { opacity: 0.62, ease: 'power1.in', duration: P.length * 0.55 + 0.5 },
      P.start + P.length * 0.45,
    );
    tl.set(shadeRef.current, { opacity: 0 }, I.end);
    tl.set(vignetteRef.current, { opacity: 0 }, I.end);

    // ── Hero typography and HUD dissolve as we fall ──────────────────
    tl.fromTo(uiRef.current, { autoAlpha: 1 }, { autoAlpha: 0, ease: 'power1.in', duration: 0.75 }, 0.08);
    tl.fromTo(bottomRef.current, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: 24, duration: 0.3 }, 0.02);
    tl.fromTo(reticleRef.current, { opacity: 1 }, { opacity: 0, ease: 'power1.in', duration: 0.9 }, 0.45);

    return {
      start: 0,
      end: I.end + 0.9,
      onActive(active) {
        layer.style.visibility = active ? 'visible' : 'hidden';
        if (active) ticker.start();
        else {
          ticker.stop();
          rendererRef.current?.clear();
        }
      },
    };
  });

  const skipTarget = `#chapter-${chapters.spans.capabilities.id}`;

  return (
    <div ref={layerRef} className={styles.layer} data-layout="side">
      <div ref={plateRef} className={styles.plate}>
        <PlateMedia asset={EYE} />
        <div
          ref={reticleRef}
          className={styles.reticle}
          style={{
            left: `${IRIS.x * 100}%`,
            top: `${IRIS.y * 100}%`,
            ['--iris-r' as string]: EYE.anchors.irisRadius,
          }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 300 300" className={styles.reticleSvg}>
            <circle cx="150" cy="150" r="104" className={styles.ring} />
            <circle cx="150" cy="150" r="118" className={styles.ringDash} />
            {[0, 90, 180, 270].map((a) => (
              <line
                key={a}
                x1="150"
                y1="24"
                x2="150"
                y2="34"
                className={styles.tick}
                transform={`rotate(${a} 150 150)`}
              />
            ))}
            <path d="M 150 30 A 120 120 0 0 1 234.9 65.1" className={styles.arc} />
          </svg>
          <span className={`${styles.hudLabel} ${styles.hudA} t-data`}>Input · Visual</span>
          <span className={`${styles.hudLabel} ${styles.hudB} t-data`}>Pattern · Human</span>
        </div>
      </div>

      <div ref={shadeRef} className={styles.shade} aria-hidden="true" />
      <div ref={canvasHostRef} className={styles.canvasHost} />
      <div ref={vignetteRef} className={styles.vignette} aria-hidden="true" />
      <div ref={flashRef} className={styles.flash} aria-hidden="true" />

      <div ref={uiRef} className={styles.ui}>
        <h1 ref={brandRef} className={styles.brand}>
          <Logo size="xl" wordmarkOnly />
        </h1>
        <p className={styles.lockup}>
          <span ref={lookRef} className={`${styles.word} ${styles.look}`}>
            Look
          </span>{' '}
          <span ref={closerRef} className={`${styles.word} ${styles.closer}`}>
            closer
          </span>
        </p>
      </div>

      <div ref={bottomRef} className={styles.bottom}>
        <div className={styles.cue}>
          <CircleArrow
            direction="down"
            label="Enter the experience"
            onClick={() => scrollToTarget(`#chapter-${chapters.spans.iris.id}`, { duration: 2.6 })}
          />
          <span className={`${styles.cueLabel} t-meta t-meta--dim`}>Scroll to enter</span>
        </div>
        <a
          className={`${styles.skip} t-meta`}
          href={skipTarget}
          onClick={(e) => {
            e.preventDefault();
            scrollToTarget(skipTarget, { duration: 2.2 });
          }}
        >
          Skip intro
        </a>
      </div>
    </div>
  );
}
