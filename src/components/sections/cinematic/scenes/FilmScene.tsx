/**
 * 02 — THE FILM: the drone flight, and the city becoming the Cosmic God.
 *
 * The footage is a frame sequence scrubbed by scroll (FrameSequence): scrolling
 * slowly is a slow cinematic glide — two neighbouring frames are blended along
 * the camera's measured motion — scrolling faster simply flies faster. It plays
 * across the city and transition chapters at one constant rate.
 *
 * The transformation is composited on the same canvas (FilmCompositor): the
 * lights brighten and blur into abstraction, violet fog creeps in from the
 * edges, motes stream past, lights stretch into trails, the architecture
 * breaks up into energy, the energy gathers into the being's silhouette and
 * becomes the being — the living render (CosmicScene) is already beneath and
 * shows through. No cut, no flash, no white frame: the camera keeps moving
 * forward the whole way, into the heart it was flying toward.
 *
 * Without WebGL2 the frames are drawn on a 2D canvas and a layered
 * atmosphere carries the transformation instead.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { media } from '@/config/media';
import { byTier } from '@/lib/device';
import { gsap } from '@/lib/gsap';
import { whenIdle } from '@/lib/loading';
import { FrameSequence } from '@/lib/video/FrameSequence';
import { FilmCompositor, type CosmicMapping, type FilmLook, type FrameTap } from '@/lib/webgl/FilmCompositor';
import { useStageScene } from '@/hooks/useStageScene';
import { useTicker } from '@/hooks/useTicker';
import { FilmTitles } from '../ui/FilmTitles';
import { useFilmMode } from '../filmState';
import { useStage } from '../StageContext';
import styles from './FilmScene.module.css';

const FILM = media.film;
const FRAMES = FILM.frames;
const COSMIC = media.cosmicEntity;
const pad = (i: number) => String(i).padStart(FRAMES.digits, '0');

export function FilmScene() {
  const { device, size, shared, film, director } = useStage();
  const mode = useFilmMode();
  const set = device.isMobile ? FRAMES.mobile : FRAMES.desktop;
  const layerRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef<FrameSequence | null>(null);
  const glRef = useRef<FilmCompositor | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [drawn, setDrawn] = useState(false);
  const drawnRef = useRef(false);
  /** Playhead: fractional frame index. */
  const playhead = useRef(0);
  const dirty = useRef(true);
  /** 2D path: what was drawn last (skip identical frames). */
  const lastDraw = useRef({ index: -1, f: -1 });
  const heading = useMemo(() => ({ x: 0, y: 0 }), []);
  const heart = useMemo(() => ({ x: 0, y: 0 }), []);
  const cosmic = useMemo<CosmicMapping>(
    () => ({ centerX: 0, centerY: 0, focusX: 0.5, focusY: 0.5, plateW: 1, plateH: 1, rotation: 0 }),
    [],
  );
  const fx = useMemo(
    () => ({
      push: 1,
      night: 1,
      lights: 0,
      fog: 0.16,
      particles: 0,
      streak: 0,
      dissolve: 0,
      energy: 0,
      form: 0,
      reveal: 0,
      alpha: 1,
      travel: 0,
      toHeart: 0,
    }),
    [],
  );

  // Camera motion between frames, in this set's own coordinates (phones get a crop).
  const motion = useMemo(
    () =>
      FRAMES.motion.map(([s, bx, by]) => ({
        s,
        bx: (s * set.cropX + bx - set.cropX) / set.cropW,
        by,
      })),
    [set],
  );
  // Where the flight is heading, in this set's frame coordinates.
  const headingUv = useMemo(
    () => ({ x: (FILM.anchors.heading.x - set.cropX) / set.cropW, y: FILM.anchors.heading.y }),
    [set],
  );

  // The frame sequence: downloaded once the first screen has settled (it is several MB).
  useEffect(() => {
    const seq = new FrameSequence({
      count: FRAMES.count,
      url: (i) => `${set.path}${pad(i)}.webp`,
      // Save-Data: every 4th frame; low-tier devices: every other frame.
      stride: device.saveData ? 4 : device.tier === 'low' ? 2 : 1,
      concurrency: device.isMobile ? 3 : 5,
      budget: device.isMobile ? 26 : 22,
    });
    seq.onDecoded = () => (dirty.current = true);
    seqRef.current = seq;
    let cancelled = false;
    void whenIdle().then(() => !cancelled && seq.start());
    return () => {
      cancelled = true;
      seq.destroy();
      seqRef.current = null;
    };
  }, [set, device]);

  // Renderer: the WebGL compositor, or a 2D canvas.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = document.createElement('canvas');
    canvas.className = styles.canvas!;
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    if (mode === 'gl') {
      try {
        glRef.current = new FilmCompositor(canvas, {
          maskUrl: '/assets/images/cosmic/cosmic-mask.webp',
          core: COSMIC.anchors.core,
          plateAspect: COSMIC.width / COSMIC.height,
          pixelRatio: Math.min(device.dpr, 1.5),
          maxPixels: byTier({ high: 1.9e6, medium: device.isMobile ? 0.75e6 : 1.3e6, low: 0.6e6 }),
          streakTaps: byTier({ high: 9, medium: device.isMobile ? 5 : 7, low: 5 }),
        });
      } catch (err) {
        console.warn('[film] compositor unavailable — plain film', err);
        canvas.remove();
        film.setMode('plain');
        return;
      }
    } else {
      ctxRef.current = canvas.getContext('2d', { alpha: true });
    }
    const resize = ({ width, height }: { width: number; height: number }) => {
      if (glRef.current) glRef.current.resize(width, height);
      else {
        const k = Math.min(device.dpr, 1.5);
        canvas.width = Math.round(width * k);
        canvas.height = Math.round(height * k);
      }
      dirty.current = true;
    };
    const unsubscribe = size.subscribe(resize);
    return () => {
      unsubscribe();
      glRef.current?.destroy();
      glRef.current = null;
      ctxRef.current = null;
      canvas.remove();
      drawnRef.current = false;
      setDrawn(false);
    };
  }, [mode, device, size, film]);

  /** Where a frame-uv point lands on screen (cover fit). */
  const toScreen = (u: number, v: number, out: { x: number; y: number }) => {
    const { width, height } = size.get();
    const k = Math.max(width / set.width, height / set.height);
    out.x = width / 2 + (u - 0.5) * set.width * k;
    out.y = height / 2 + (v - 0.5) * set.height * k;
    return out;
  };

  const tap = useMemo(
    () => ({
      a: { index: 0, image: null as unknown as ImageBitmap, s: 1, bx: 0, by: 0 } as FrameTap,
      b: { index: 0, image: null as unknown as ImageBitmap, s: 1, bx: 0, by: 0 } as FrameTap,
    }),
    [],
  );

  const ticker = useTicker((time) => {
    const seq = seqRef.current;
    if (!seq) return;
    const pos = playhead.current;
    seq.seek(pos);
    const last = FRAMES.count - 1;
    const i = Math.min(last, Math.floor(pos));
    let f = pos - i;
    let A = seq.get(i);
    let B = i < last ? seq.get(i + 1) : A;
    let ai = i;
    let bi = Math.min(last, i + 1);
    if (!A || !B) {
      // Not decoded yet: hold the nearest frame we have (never a blank).
      const near = seq.nearest(pos);
      if (!near) return;
      A = B = near.image;
      ai = bi = near.index;
      f = 0;
    }

    const gl = glRef.current;
    if (gl) {
      const m = motion[Math.min(motion.length - 1, ai)] ?? { s: 1, bx: 0, by: 0 };
      if (ai === bi) {
        Object.assign(tap.a, { index: ai, image: A, s: 1, bx: 0, by: 0 });
        Object.assign(tap.b, { index: bi, image: B, s: 1, bx: 0, by: 0 });
      } else {
        // Motion-compensated in-between: A carried forward by f, B carried back by 1 − f.
        const sf = Math.pow(m.s, f);
        const g = Math.abs(m.s - 1) > 1e-5 ? (sf - 1) / (m.s - 1) : f;
        const bfx = m.bx * g;
        const bfy = m.by * g;
        Object.assign(tap.a, { index: ai, image: A, s: 1 / sf, bx: -bfx / sf, by: -bfy / sf });
        Object.assign(tap.b, {
          index: bi,
          image: B,
          s: m.s / sf,
          bx: m.bx - (m.s * bfx) / sf,
          by: m.by - (m.s * bfy) / sf,
        });
      }
      // The heading: where the flight goes — gliding into the heart as the being forms.
      toScreen(headingUv.x, headingUv.y, heading);
      const cam = shared.cameras.cosmic;
      let mapping: CosmicMapping | null = null;
      if (cam && (fx.toHeart > 0 || fx.form > 0 || fx.reveal > 0)) {
        cam.update();
        const focus = cam.focus;
        cosmic.centerX = cam.vw / 2;
        cosmic.centerY = cam.vh / 2;
        cosmic.focusX = focus.x;
        cosmic.focusY = focus.y;
        cosmic.plateW = cam.W * cam.zoom;
        cosmic.plateH = cam.H * cam.zoom;
        cosmic.rotation = cam.rotation;
        mapping = cosmic;
        cam.project(COSMIC.anchors.core, heart);
        heading.x += (heart.x - heading.x) * fx.toHeart;
        heading.y += (heart.y - heading.y) * fx.toHeart;
      }
      gl.render({ time, a: tap.a, b: tap.b, mix: f, look: fx as FilmLook, heading, cosmic: mapping });
      // Until the being starts to form, nothing beneath the energy can be seen.
      shared.filmCovers = fx.reveal <= 0.001 && fx.alpha >= 0.999;
    } else {
      const ctx = ctxRef.current;
      if (!ctx) return;
      if (!dirty.current && ai === lastDraw.current.index && Math.abs(f - lastDraw.current.f) < 0.02) return;
      dirty.current = false;
      lastDraw.current.index = ai;
      lastDraw.current.f = f;
      const cw = ctx.canvas.width;
      const ch = ctx.canvas.height;
      const k = Math.max(cw / A.width, ch / A.height);
      const dw = A.width * k;
      const dh = A.height * k;
      ctx.globalAlpha = 1;
      ctx.drawImage(A, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      if (f > 0.02 && B !== A) {
        ctx.globalAlpha = f;
        ctx.drawImage(B, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
        ctx.globalAlpha = 1;
      }
    }
    if (!drawnRef.current) {
      drawnRef.current = true;
      setDrawn(true);
    }
  });

  useLayoutEffect(() => {
    layerRef.current?.setAttribute('data-mode', mode);
  }, [mode]);

  useStageScene(
    'film',
    (tl, { chapters: ch }) => {
      const I = ch.spans.iris;
      const F = ch.footage;
      const E = ch.spans.emergence;
      const S = ch.seq;
      const layer = layerRef.current!;
      const gl = mode === 'gl';
      const span = (a: number, b: number) => S(b) - S(a);

      // Forward travel through the energy keeps the footage's pace, then slows as the being forms.
      const travelRate = 0.55;
      const travelAtEnd = (F.end - F.start) * travelRate;
      tl.fromTo(fx, { travel: 0 }, { travel: travelAtEnd, ease: 'none', duration: F.end - F.start }, F.start);
      tl.to(
        fx,
        { travel: travelAtEnd + E.length * travelRate * 0.5, ease: 'power2.out', duration: E.length },
        F.end,
      );

      if (gl) {
        // 1 · Violet-blue atmosphere creeps in from the edges (it is always faintly there).
        tl.fromTo(fx, { fog: 0.16 }, { fog: 0.42, ease: 'sine.inOut', duration: span(0.5, 0.62) }, S(0.5));
        tl.to(fx, { fog: 0.62, ease: 'sine.in', duration: span(0.62, 0.72) }, S(0.62));
        tl.to(fx, { fog: 0.26, ease: 'sine.inOut', duration: span(0.75, 0.88) }, S(0.75));
        // 2 · The lights brighten and lose their edges.
        tl.fromTo(fx, { lights: 0 }, { lights: 1, ease: 'sine.in', duration: span(0.59, 0.69) }, S(0.59));
        // 3 · Motes stream past the lens.
        tl.fromTo(
          fx,
          { particles: 0 },
          { particles: 1, ease: 'sine.inOut', duration: span(0.61, 0.7) },
          S(0.61),
        );
        tl.to(fx, { particles: 0.3, ease: 'sine.inOut', duration: span(0.78, 0.9) }, S(0.78));
        // 4 · Lights stretch into data trails.
        tl.fromTo(fx, { streak: 0 }, { streak: 1, ease: 'sine.in', duration: span(0.63, 0.71) }, S(0.63));
        tl.to(fx, { streak: 0.3, ease: 'sine.out', duration: span(0.71, 0.78) }, S(0.71));
        tl.to(fx, { streak: 0, ease: 'sine.inOut', duration: span(0.78, 0.86) }, S(0.78));
        // 5 · Energy rises through the frame; the architecture dissolves into it.
        tl.fromTo(fx, { energy: 0 }, { energy: 1, ease: 'sine.in', duration: span(0.64, 0.74) }, S(0.64));
        tl.fromTo(
          fx,
          { dissolve: 0 },
          { dissolve: 1, ease: 'sine.inOut', duration: span(0.665, 0.755) },
          S(0.665),
        );
        // The camera keeps pushing forward past the footage.
        tl.fromTo(fx, { push: 1 }, { push: 1.14, ease: 'sine.in', duration: span(0.6, 0.75) }, S(0.6));
        tl.to(fx, { push: 1.2, ease: 'power2.out', duration: span(0.75, 0.9) }, S(0.75));
        // 6 · Where we were heading becomes the heart…
        tl.fromTo(fx, { toHeart: 0 }, { toHeart: 1, ease: 'sine.inOut', duration: span(0.7, 0.8) }, S(0.7));
        // 7 · …the energy gathers into the being's silhouette…
        tl.fromTo(fx, { form: 0 }, { form: 1, ease: 'sine.inOut', duration: span(0.755, 0.845) }, S(0.755));
        // 8 · …and becomes the being, from the heart outward.
        tl.fromTo(fx, { reveal: 0 }, { reveal: 1, ease: 'sine.inOut', duration: span(0.8, 0.9) }, S(0.8));
        tl.fromTo(fx, { alpha: 1 }, { alpha: 0, ease: 'sine.in', duration: span(0.875, 0.915) }, S(0.875));
      } else {
        // Plain: the atmosphere closes in, the lights flare into energy and the being shows through.
        const q = gsap.utils.selector(layer);
        tl.fromTo(
          q('[data-plain="fog"]'),
          { opacity: 0.25 },
          { opacity: 1, ease: 'sine.inOut', duration: span(0.5, 0.72) },
          S(0.5),
        );
        tl.fromTo(
          q('[data-plain="energy"]'),
          { opacity: 0, scale: 0.6 },
          { opacity: 1, scale: 1.1, ease: 'sine.in', duration: span(0.62, 0.76) },
          S(0.62),
        );
        tl.fromTo(
          hostRef.current,
          { opacity: 1 },
          { opacity: 0, ease: 'sine.inOut', duration: span(0.7, 0.8) },
          S(0.7),
        );
        tl.to(
          q('[data-plain="energy"]'),
          { opacity: 0, scale: 1.5, ease: 'sine.out', duration: span(0.78, 0.9) },
          S(0.78),
        );
        tl.to(q('[data-plain="fog"]'), { opacity: 0, ease: 'sine.out', duration: span(0.8, 0.9) }, S(0.8));
      }

      const range = F.end - F.start;
      return {
        start: I.end - 0.16,
        end: S(0.92),
        render: (pos) => {
          const t = Math.min(1, Math.max(0, (pos - F.start) / range));
          playhead.current = t * (FRAMES.count - 1);
        },
        onActive(active) {
          layer.style.visibility = active ? 'visible' : 'hidden';
          if (active) {
            dirty.current = true;
            ticker.start();
          } else {
            ticker.stop();
            glRef.current?.clear();
            shared.filmCovers = false;
          }
        },
      };
    },
    [mode],
  );

  // Keep the director's current position applied once the frames can draw.
  useEffect(() => {
    if (drawn) director.refresh();
  }, [drawn, director]);

  return (
    <>
      <div ref={layerRef} className={styles.layer} data-mode={mode} data-drawn={drawn || undefined}>
        <img
          className={styles.poster}
          src={set.poster}
          alt=""
          width={set.width}
          height={set.height}
          decoding="async"
          aria-hidden="true"
          style={FILM.lqip ? { backgroundImage: `url(${FILM.lqip})` } : undefined}
        />
        <div ref={hostRef} className={styles.host} />
        {mode === 'plain' && (
          <>
            <div className={styles.plainFog} data-plain="fog" aria-hidden="true" />
            <div className={styles.plainEnergy} data-plain="energy" aria-hidden="true" />
          </>
        )}
      </div>
      <FilmTitles />
    </>
  );
}
