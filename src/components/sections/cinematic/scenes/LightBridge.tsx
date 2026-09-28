/**
 * THE LIGHT BRIDGE — city to Cosmic God, without a cut.
 *
 * As the flight nears its end, light builds exactly where it is heading:
 * exposure swells (screen-blended, so the city's own lights bloom), an
 * anamorphic streak stretches across the lens and warp streaks accelerate
 * outward — the forward motion never stops. At the peak the frame is pure
 * electric light and the city dissolves beneath it; as it clears, the light
 * glides into the entity's heart (the same place on screen) and the warp
 * decays: the camera is still moving forward, only slowing down.
 *
 * With baked footage (the transition is in the video itself) the bridge only
 * lends a breath of light to the hand-over from footage to living entity.
 */
import { useEffect, useMemo, useRef } from 'react';
import { media } from '@/config/media';
import { WarpStreaks } from '@/lib/canvas/WarpStreaks';
import { byTier } from '@/lib/device';
import { useStageScene } from '@/hooks/useStageScene';
import { useTicker } from '@/hooks/useTicker';
import { useFilmMode } from '../filmState';
import { useStage } from '../StageContext';
import styles from './LightBridge.module.css';

const HEART = media.cosmicEntity.anchors.core;

export function LightBridge() {
  const { device, size, shared, film } = useStage();
  const mode = useFilmMode();
  const layerRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const exposureRef = useRef<HTMLDivElement>(null);
  const streakRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const warpRef = useRef<WarpStreaks | null>(null);
  /** speed/intensity drive the warp; toHeart glides the light from the heading into the heart. */
  const fx = useMemo(() => ({ speed: 0, intensity: 0, toHeart: 0 }), []);
  const origin = useMemo(() => ({ x: 0, y: 0 }), []);
  const heart = useMemo(() => ({ x: 0, y: 0 }), []);

  // Warp field (fresh canvas per mount).
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = document.createElement('canvas');
    canvas.className = styles.canvas!;
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    try {
      warpRef.current = new WarpStreaks(canvas, {
        dpr: Math.min(device.dpr, 1.5),
        count: byTier({ high: 170, medium: device.isMobile ? 90 : 140, low: 70 }),
      });
      const { width, height } = size.get();
      warpRef.current.resize(width, height);
    } catch {
      warpRef.current = null;
    }
    return () => {
      warpRef.current = null;
      canvas.remove();
    };
  }, [device, size]);

  useEffect(() => size.subscribe(({ width, height }) => warpRef.current?.resize(width, height)), [size]);

  const ticker = useTicker((_, dt) => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const cam = shared.cameras.cosmic;
    if (cam && fx.toHeart > 0) {
      cam.update();
      cam.project(HEART, heart);
    } else {
      heart.x = film.heading.x;
      heart.y = film.heading.y;
    }
    origin.x = film.heading.x + (heart.x - film.heading.x) * fx.toHeart;
    origin.y = film.heading.y + (heart.y - film.heading.y) * fx.toHeart;
    anchor.style.transform = `translate3d(${origin.x.toFixed(1)}px, ${origin.y.toFixed(1)}px, 0)`;
    warpRef.current?.render(dt, origin, fx.speed, fx.intensity);
  });

  useStageScene(
    'light',
    (tl, { chapters: ch }) => {
      const C = ch.spans.city;
      const T = ch.spans.transition;
      const peak = ch.peak;
      const layer = layerRef.current!;
      const exposure = exposureRef.current!;
      const streak = streakRef.current!;
      const veil = veilRef.current!;
      let start: number;
      const end = T.end + 0.5;

      if (mode === 'baked') {
        // The footage carries the transition: a breath of light as the living entity takes over.
        tl.set(fx, { toHeart: 1 }, 0);
        tl.fromTo(
          exposure,
          { opacity: 0, scale: 0.55 },
          { opacity: 0.38, scale: 0.85, ease: 'sine.in', duration: 0.2 },
          T.end - 0.2,
        );
        tl.to(exposure, { opacity: 0, scale: 1.35, ease: 'sine.out', duration: 0.5 }, T.end);
        start = T.end - 0.25;
      } else {
        const build = peak - T.start;
        // The still is flown slowly: a few motes pass the lens so the motion reads.
        if (mode === 'still') {
          tl.fromTo(
            fx,
            { intensity: 0, speed: 0.1 },
            { intensity: 0.2, speed: 0.2, ease: 'sine.inOut', duration: 0.8 },
            C.start + 0.1,
          );
        }
        // Speed builds into the light and never stops — it decays as we come out the other side.
        tl.to(fx, { intensity: 1, speed: 1, ease: 'power2.in', duration: build }, T.start);
        tl.to(fx, { intensity: 0, speed: 0.22, ease: 'power2.out', duration: T.end - peak + 0.45 }, peak);
        tl.fromTo(fx, { toHeart: 0 }, { toHeart: 1, ease: 'sine.inOut', duration: 0.5 }, peak - 0.12);
        // Exposure swells from where the flight is heading, then clears outward as we pass through.
        tl.fromTo(
          exposure,
          { opacity: 0, scale: 0.14 },
          { opacity: 1, scale: 1.05, ease: 'power2.in', duration: build },
          T.start,
        );
        tl.to(exposure, { opacity: 0, scale: 1.9, ease: 'power2.out', duration: T.end - peak + 0.35 }, peak);
        // An anamorphic streak across the lens.
        tl.fromTo(
          streak,
          { opacity: 0, scaleX: 0.25 },
          { opacity: 0.85, scaleX: 1.15, ease: 'power2.in', duration: build * 0.85 },
          T.start + build * 0.15,
        );
        tl.to(streak, { opacity: 0, scaleX: 2.4, ease: 'power2.out', duration: 0.6 }, peak);
        // The white-out that carries the hand-over — only near the peak.
        tl.fromTo(
          veil,
          { opacity: 0 },
          { opacity: 0.94, ease: 'power3.in', duration: build * 0.5 },
          peak - build * 0.5,
        );
        tl.to(veil, { opacity: 0, ease: 'power2.out', duration: (T.end - peak) * 0.85 }, peak);
        start = mode === 'still' ? C.start : T.start - 0.05;
      }

      return {
        start,
        end,
        onActive(active) {
          layer.style.visibility = active ? 'visible' : 'hidden';
          if (active) ticker.start();
          else {
            ticker.stop();
            warpRef.current?.clear();
          }
        },
      };
    },
    [mode],
  );

  return (
    <div ref={layerRef} className={styles.layer} aria-hidden="true">
      <div ref={hostRef} className={styles.warp} />
      <div ref={anchorRef} className={styles.anchor}>
        <div ref={exposureRef} className={styles.exposure} />
        <div ref={streakRef} className={styles.streak} />
      </div>
      <div ref={veilRef} className={styles.veil} />
    </div>
  );
}
