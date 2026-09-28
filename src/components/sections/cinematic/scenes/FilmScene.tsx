/**
 * 02 — THE FILM: one continuous flight.
 *
 * A drone skims low through the city; the light it is flying toward builds
 * (see LightBridge) and the city gives way to the Cosmic God without a cut.
 * The city exists only here.
 *
 * Footage (media.film.footage) is scrubbed frame-accurately by scroll at one
 * constant rate, so the camera's speed follows the scroll and never jumps —
 * not even at the join into the transition. Until footage exists (or on
 * devices that should not download it) the still is flown instead: a slow
 * forward push toward the city's glowing ring on a single speed curve —
 * cruise, then a smooth acceleration into the light — with a gentle bank and
 * haze passing at three depths.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { PlateMedia } from '@/components/common/PlateMedia';
import { media } from '@/config/media';
import { SceneCamera } from '@/lib/camera';
import { footageSource, whenIdle } from '@/lib/loading';
import { ScrubVideo } from '@/lib/video/ScrubVideo';
import { useStageScene } from '@/hooks/useStageScene';
import { useTicker } from '@/hooks/useTicker';
import { pointer } from '@/hooks/usePointer';
import { cruiseThenAccelerate, pushFor } from '@/animations/easing';
import { StageCaption } from '../ui/StageCaption';
import { useFilmMode } from '../filmState';
import { useStage } from '../StageContext';
import styles from './FilmScene.module.css';

const FILM = media.film;
const FOOTAGE = FILM.footage;
/** Haze layers: how strongly each one follows the push (parallax depth, far → near). */
const HAZE_DEPTHS = [0.6, 1.4, 2.6] as const;
/** The still's push: start (slight overscan for the bank) and where the cruise part arrives. */
const STILL_FROM = 1.03;
const STILL_CRUISE_TO = 1.2;

export function FilmScene() {
  const { size, chapters, film } = useStage();
  const mode = useFilmMode();
  const src = useMemo(() => footageSource(FOOTAGE), []);
  const layerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const pushRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tintRef = useRef<HTMLDivElement>(null);
  const hazeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrubRef = useRef<ScrubVideo | null>(null);
  const activeRef = useRef(false);
  /** Footage became ready while the film was on screen: switch once it is not. */
  const switchLater = useRef(false);

  const camera = useMemo(() => new SceneCamera(FILM.width, FILM.height), []);

  // Footage: fetched once the page is idle (it is large), then scrubbed.
  useEffect(() => {
    const video = videoRef.current;
    if (!src || !FOOTAGE || !video) return;
    const scrub = new ScrubVideo(video, FOOTAGE.fps);
    scrubRef.current = scrub;
    let cancelled = false;
    void whenIdle()
      .then(() => (cancelled ? undefined : scrub.load(src)))
      .then(() => {
        if (cancelled || !scrub.ready) return;
        // Never swap still → footage mid-flight.
        if (activeRef.current) switchLater.current = true;
        else film.setFootage(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) console.warn('[film] footage unavailable — flying the still', err);
      });
    return () => {
      cancelled = true;
      scrub.destroy();
      scrubRef.current = null;
      film.setFootage(false);
    };
  }, [src, film]);

  // Framing: the still covers the frame; publish where the flight is heading (the light builds there).
  useEffect(
    () =>
      size.subscribe(({ width, height }) => {
        const plate = plateRef.current;
        if (!plate) return;
        camera.resize(width, height);
        camera.layout(plate);
        camera.apply(plate);
        let x: number;
        let y: number;
        if (mode !== 'still' && FOOTAGE) {
          const video = videoRef.current;
          const vw = video?.videoWidth || 1920;
          const vh = video?.videoHeight || 1080;
          const s = Math.max(width / vw, height / vh); // object-fit: cover
          x = width / 2 + (FOOTAGE.heading.x - 0.5) * vw * s;
          y = height / 2 + (FOOTAGE.heading.y - 0.5) * vh * s;
        } else {
          const p = camera.project(FILM.anchors.heading);
          x = p.x;
          y = p.y;
        }
        film.heading.x = x;
        film.heading.y = y;
        const origin = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
        if (pushRef.current) pushRef.current.style.transformOrigin = origin;
        layerRef.current?.style.setProperty('--hx', `${x.toFixed(1)}px`);
        layerRef.current?.style.setProperty('--hy', `${y.toFixed(1)}px`);
        hazeRefs.current.forEach((el) => el && (el.style.transformOrigin = origin));
      }),
    [camera, size, film, mode],
  );

  // The still, flown: a faint handheld float on top of the push (the footage needs none).
  const ticker = useTicker((time, dt) => {
    const plate = plateRef.current;
    if (!plate) return;
    const k = Math.min(1, dt * 2);
    const floatX = Math.sin(time * 0.5) * 0.0012 + Math.sin(time * 0.21) * 0.0008;
    const floatY = Math.cos(time * 0.43) * 0.001;
    camera.offset.x += (pointer.x * 0.006 + floatX - camera.offset.x) * k;
    camera.offset.y += (pointer.y * 0.004 + floatY - camera.offset.y) * k;
    camera.apply(plate);
  });

  useLayoutEffect(() => {
    layerRef.current?.setAttribute('data-mode', mode);
  }, [mode]);

  useStageScene(
    'film',
    (tl, { chapters: ch }) => {
      const I = ch.spans.iris;
      const C = ch.spans.city;
      const T = ch.spans.transition;
      const peak = ch.peak;
      const layer = layerRef.current!;
      const frame = frameRef.current!;
      const push = pushRef.current!;
      const baked = mode === 'baked';
      const enter = I.end - 0.16;
      // Where the footage (or the still's flight) ends: under the light's peak, or — baked — with the transition.
      const flightEnd = baked ? T.end : peak;
      const leave = baked ? T.end + 0.34 : peak + 0.04;

      if (mode === 'still') {
        // One speed curve from the iris to the light: cruise, then accelerate into it.
        const a = Math.min(0.9, (T.start - C.start) / (peak - C.start));
        const to = pushFor(STILL_FROM, STILL_CRUISE_TO, a);
        const ease = cruiseThenAccelerate(STILL_FROM, to, a);
        tl.fromTo(push, { scale: STILL_FROM }, { scale: to, ease, duration: peak - C.start }, C.start);
        // Haze follows at its own depth: near wisps rush past, far mist barely moves.
        hazeRefs.current.forEach((el, i) => {
          if (!el) return;
          const depth = HAZE_DEPTHS[i]!;
          const hazeTo = 1 + (to / STILL_FROM - 1) * depth;
          tl.fromTo(
            el,
            { scale: 1 },
            { scale: hazeTo, ease: cruiseThenAccelerate(1, hazeTo, a), duration: peak - C.start },
            C.start,
          );
        });
        // A drone banks as it glides.
        tl.fromTo(
          push,
          { rotation: -0.35 },
          { rotation: 0.3, ease: 'sine.inOut', duration: peak - C.start },
          C.start,
        );
      } else if (!baked) {
        // The footage flies; under the building light the camera pushes on into it.
        tl.fromTo(push, { scale: 1 }, { scale: 1.12, ease: 'power2.in', duration: peak - T.start }, T.start);
      }

      if (!baked) {
        // The city's air turns to the cosmos' as the light builds…
        tl.fromTo(
          tintRef.current,
          { opacity: 0 },
          { opacity: 1, ease: 'power1.in', duration: peak - T.start },
          T.start,
        );
        // …and it dissolves beneath the light's peak; the entity is already there underneath.
        tl.fromTo(frame, { opacity: 1 }, { opacity: 0, ease: 'power1.in', duration: 0.2 }, peak - 0.17);
      } else {
        // The footage's last frame is the entity itself: dissolve into the living render.
        tl.fromTo(frame, { opacity: 1 }, { opacity: 0, ease: 'sine.inOut', duration: 0.32 }, T.end - 0.02);
      }

      const footageClock =
        mode !== 'still'
          ? (pos: number) => scrubRef.current?.seek((pos - C.start) / (flightEnd - C.start))
          : undefined;

      return {
        start: enter,
        end: leave,
        render: footageClock,
        onActive(active) {
          activeRef.current = active;
          layer.style.visibility = active ? 'visible' : 'hidden';
          if (mode === 'still' && active) ticker.start();
          else ticker.stop();
          if (!active && switchLater.current) {
            switchLater.current = false;
            film.setFootage(true);
          }
        },
      };
    },
    [mode],
  );

  const C = chapters.spans.city;
  const T = chapters.spans.transition;

  return (
    <>
      <div ref={layerRef} className={styles.layer} data-mode={mode}>
        <div ref={frameRef} className={styles.frame}>
          <div ref={pushRef} className={styles.push}>
            <div ref={plateRef} className={styles.plate}>
              <PlateMedia asset={FILM} />
            </div>
            {src && <video ref={videoRef} className={styles.video} muted playsInline aria-hidden="true" />}
          </div>
          {HAZE_DEPTHS.map((_, i) => (
            <div
              key={i}
              ref={(el) => {
                hazeRefs.current[i] = el;
              }}
              className={`${styles.haze} ${styles[`haze${i}` as 'haze0']}`}
              aria-hidden="true"
            >
              <div className={styles.hazeDrift} />
            </div>
          ))}
          <div className={styles.grade} aria-hidden="true" />
          <div ref={tintRef} className={styles.tint} aria-hidden="true" />
        </div>
      </div>
      <StageCaption
        id="city"
        from={C.start + C.length * 0.14}
        to={C.start + C.length * 0.56}
        kicker="GA Automations"
        bold="Work that"
        serif="runs itself"
        support="Like this city, a business can run on intelligence. We build the AI that captures leads, answers customers and moves work forward — day and night."
      />
      <StageCaption
        id="network"
        from={C.start + C.length * 0.66}
        to={T.start + T.length * 0.12}
        kicker="Integration"
        bold="Every tool"
        serif="connected"
        support="CRM, WhatsApp, email, forms and data — wired into one system with intelligence at its core."
      />
    </>
  );
}
