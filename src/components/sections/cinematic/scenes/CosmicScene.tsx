/**
 * 03 — EMERGENCE → REVEAL → INTELLIGENCE → CAPABILITIES → IDENTITY
 *
 * The film's energy gathers into a six-armed cosmic intelligence (the
 * FilmCompositor forms it over this render, from the heart outward). The camera
 * never stops moving forward: it glides in on the being's FACE — the eyes
 * ignite (the eye again, the film's first image) — and holds it as the focal
 * point while GA AUTOMATIONS appears beneath. It eases back to show all six
 * arms, then flies to each hand in turn (one GA Automations capability per
 * hand), and finally returns to the face as every arm gives its energy back to
 * the heart and the identity resolves.
 *
 * Framing: the plate always covers the frame (never letterboxed), and every
 * target is clamped to the plate before it is tweened, so the camera glides
 * continuously and never stalls against an edge.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { PlateMedia, type PlateMediaHandle } from '@/components/common/PlateMedia';
import { CAPABILITY_STEPS } from '@/config/cinematic';
import { media } from '@/config/media';
import { content } from '@/services/content';
import { SceneCamera } from '@/lib/camera';
import { smoothPath } from '@/lib/path';
import { useStageScene } from '@/hooks/useStageScene';
import { useTicker } from '@/hooks/useTicker';
import { pointer } from '@/hooks/usePointer';
import { byTier } from '@/lib/device';
import { debug } from '@/lib/debug';
import { CosmicRenderer } from '@/lib/webgl/CosmicRenderer';
import { CapabilityHUD, type CapabilityHUDHandle } from '../ui/CapabilityHUD';
import { BrandReveal } from '../ui/BrandReveal';
import { IdentityReveal } from '../ui/IdentityReveal';
import { StageCaption } from '../ui/StageCaption';
import { useFilmMode } from '../filmState';
import { useStage } from '../StageContext';
import styles from './CosmicScene.module.css';

const COSMIC = media.cosmicEntity;
const { core, eyes, arms } = COSMIC.anchors;
const PW = COSMIC.width;
const PH = COSMIC.height;
/** Between the eyes — what the camera frames whenever the face is in view. */
const FACE = { x: (eyes[0].x + eyes[1].x) / 2, y: (eyes[0].y + eyes[1].y) / 2 };

const services = content.services();
/** Services ordered by the hand that carries them. */
const byHand = [...services].sort((a, b) => a.visual.hand - b.visual.hand);

export function CosmicScene() {
  const { device, size, shared, chapters, director } = useStage();
  const layerRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const glHostRef = useRef<HTMLDivElement>(null);
  const coreBreathRef = useRef<HTMLSpanElement>(null);
  const rendererRef = useRef<CosmicRenderer | null>(null);
  const [living, setLiving] = useState(false);
  /** Hand framing depends on the screen's shape — rebuild the choreography when it changes. */
  const [aspectKey, setAspectKey] = useState(0);
  const cfx = useMemo(() => ({ eyes: 0, life: 1, glow: 1 }), []);
  const mode = useFilmMode();
  const eyesRef = useRef<HTMLDivElement>(null);
  const tracesRef = useRef<SVGGElement>(null);
  const halosRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<CapabilityHUDHandle>(null);
  const mediaRef = useRef<PlateMediaHandle>(null);
  const [active, setActive] = useState(-1);
  const activeRef = useRef(-1);

  const camera = useMemo(() => new SceneCamera(PW, PH, { initial: { x: FACE.x, y: 0.4, zoom: 1.3 } }), []);
  const armPaths = useMemo(() => arms.map((pts) => smoothPath(pts, PW, PH, 0.55)), []);
  const handPoint = (i: number) => arms[i]![arms[i]!.length - 1]!;

  useLayoutEffect(() => {
    if (debug.enabled) Object.assign(window, { __cosmic: { camera } });
    shared.cameras.cosmic = camera;
    return () => {
      delete shared.cameras.cosmic;
    };
  }, [camera, shared]);

  // The living entity (WebGL). Falls back to the still plate + DOM overlays.
  const renderScale = byTier({ high: 1, medium: device.isMobile ? 0.8 : 0.85, low: 0.7 });
  useEffect(() => {
    const host = glHostRef.current;
    if (!host || !device.webgl2) return;
    const canvas = document.createElement('canvas');
    canvas.className = styles.glCanvas!;
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    let renderer: CosmicRenderer | null = null;
    try {
      // The 2× plate keeps the face sharp in close-up — on phones too (a portrait
      // close-up magnifies the plate even more than a desktop one).
      const hiRes = device.tier !== 'low';
      renderer = new CosmicRenderer(
        canvas,
        hiRes ? '/assets/images/cosmic/cosmic-entity@2x.webp' : COSMIC.image.webp,
        { core, head: { x: core.x, y: 0.165 }, eyes, aspect: PW / PH },
        Math.min(device.dpr, 1.5),
        '/assets/images/cosmic/cosmic-mask.webp',
      );
      renderer.onReady = () => setLiving(true);
      const { width, height } = size.get();
      renderer.resize(width, height, renderScale);
      rendererRef.current = renderer;
    } catch (err) {
      console.warn('[cosmic] living entity unavailable', err);
    }
    return () => {
      renderer?.destroy();
      rendererRef.current = null;
      canvas.remove();
      setLiving(false);
    };
  }, [device, size, renderScale]);

  useEffect(
    () =>
      size.subscribe(({ width, height }) => {
        const plate = plateRef.current;
        if (!plate) return;
        rendererRef.current?.resize(width, height, renderScale);
        setAspectKey(Math.round((width / height) * 4));
        camera.resize(width, height);
        camera.layout(plate);
        camera.apply(plate);
        hudRef.current?.layout();
      }),
    [camera, size, renderScale],
  );

  const ticker = useTicker((time, dt) => {
    const plate = plateRef.current;
    if (!plate) return;
    // A slow, organic float on top of the choreography (a camera operator's breath,
    // never stabiliser jitter), plus a hair of pointer parallax.
    const k = Math.min(1, dt * 1.6);
    const floatX = Math.sin(time * 0.23) * 0.0016 + Math.sin(time * 0.071 + 1.3) * 0.0011;
    const floatY = Math.cos(time * 0.19) * 0.0012;
    camera.offset.x += (pointer.x * 0.005 + floatX - camera.offset.x) * k;
    camera.offset.y += (pointer.y * 0.0035 + floatY - camera.offset.y) * k;
    camera.apply(plate);

    // One breath every 6.5 s — body, heart and aura breathe together.
    const breath = 0.5 - 0.5 * Math.cos((time / 6.5) * Math.PI * 2);
    if (coreBreathRef.current)
      coreBreathRef.current.style.transform = `scale(${(0.92 + breath * 0.2).toFixed(3)})`;
    const r = rendererRef.current;
    if (r?.ready && !shared.filmCovers) {
      const focus = camera.focus;
      r.render(time, {
        centerX: camera.vw / 2,
        centerY: camera.vh / 2,
        focusX: focus.x,
        focusY: focus.y,
        plateW: camera.W * camera.zoom,
        plateH: camera.H * camera.zoom,
        rotation: camera.rotation,
        breath,
        life: cfx.life,
        eyes: cfx.eyes,
        glow: cfx.glow,
        zoom: camera.zoom,
      });
    } else if (eyesRef.current) {
      eyesRef.current.style.opacity = String(Math.min(1, cfx.eyes));
    }

    // Leader line from the active panel to its hand.
    const i = activeRef.current;
    if (i >= 0) {
      const service = byHand[i];
      if (service) hudRef.current?.frame(camera.project(handPoint(service.visual.hand)));
    }
  });

  useStageScene(
    'cosmic',
    (tl, { chapters: ch }) => {
      const N = ch.spans.intelligence;
      const K = ch.spans.capabilities;
      const Y = ch.spans.identity;
      const layer = layerRef.current!;
      const armGroups = [...(tracesRef.current?.querySelectorAll<SVGGElement>('[data-arm]') ?? [])];
      const drawn = (i: number) => [...armGroups[i]!.querySelectorAll<SVGPathElement>('[data-draw]')];
      const allDrawn = armGroups.flatMap((_, i) => drawn(i));
      const halos = [...(halosRef.current?.querySelectorAll<HTMLElement>('[data-halo]') ?? [])];
      const E = ch.spans.emergence;
      const R = ch.spans.reveal;
      const S = ch.seq;
      const gl = mode === 'gl';
      const step = K.length / CAPABILITY_STEPS;
      const { width: vw, height: vh } = size.get();
      const mobile = device.isMobile;

      // ── Framing helpers ───────────────────────────────────────────────
      // Share of the plate visible at zoom 1 (cover fit), per axis.
      const aspectV = vw / vh;
      const aspectP = PW / PH;
      const visW = Math.min(1, aspectV / aspectP);
      const visH = Math.min(1, aspectP / aspectV);
      const clampX = (x: number, z: number) => Math.min(1 - visW / (2 * z), Math.max(visW / (2 * z), x));
      const clampY = (y: number, z: number) => Math.min(1 - visH / (2 * z), Math.max(visH / (2 * z), y));
      /** The face centred horizontally, its eyes at `v` of the screen height (as close as the plate allows). */
      const onFace = (zoom: number, v: number) => ({
        x: clampX(FACE.x, zoom),
        y: clampY(FACE.y - ((v - 0.5) * visH) / zoom, zoom),
        zoom,
      });

      // ── Emergence: the being forms around the heart we were flying toward ──
      // Hidden beneath the energy until it forms; the camera is already moving
      // forward at the flight's pace, gliding in on the face.
      const formFrom = gl ? S(0.72) : S(0.68);
      const wide = onFace(mobile ? 1.24 : 1.3, 0.4);
      const near = onFace(mobile ? 1.56 : 1.62, 0.38);
      const close = onFace(mobile ? 1.72 : 1.8, 0.36);
      tl.set(camera.state, { ...wide, rotate: 0 }, 0);
      tl.fromTo(camera.state, wide, { ...near, ease: 'sine.out', duration: E.end - formFrom }, formFrom);
      // Reveal: an extremely slow push while GA AUTOMATIONS appears beneath the face.
      tl.to(camera.state, { ...close, ease: 'sine.inOut', duration: R.length + N.length * 0.2 }, E.end);

      // The being blazes as it forms, then settles into its living glow.
      tl.fromTo(
        cfx,
        { glow: gl ? 1.75 : 1.4 },
        { glow: 1, ease: 'sine.out', duration: R.end - S(0.78) },
        S(0.78),
      );
      // The eyes ignite as the face forms.
      tl.fromTo(cfx, { eyes: 0 }, { eyes: 1, ease: 'power2.out', duration: S(0.9) - S(0.83) }, S(0.83));
      tl.fromTo(
        coreRef.current,
        { opacity: 0, scale: 0.4 },
        { opacity: 1, scale: 1, ease: 'power3.out', duration: 0.6 },
        S(0.8),
      );

      // ── Intelligence: ease back to show all six arms (the face still leads) ──
      const whole = onFace(mobile ? 1.06 : 1.1, 0.3);
      tl.to(
        camera.state,
        { ...whole, ease: 'sine.inOut', duration: N.length * 0.72 },
        N.start + N.length * 0.2,
      );

      // Energy races down all six arms, halos flare, then settle to standby.
      armGroups.forEach((group, i) => {
        const at = N.start + N.length * 0.42 + i * 0.045;
        tl.fromTo(
          drawn(i),
          { drawSVG: '0% 0%' },
          { drawSVG: '0% 100%', ease: 'power2.inOut', duration: N.length * 0.3 },
          at,
        );
        // Opacity lives in a CSS variable so the active state (CSS) can override it cleanly.
        tl.fromTo(group, { '--o': 1 }, { '--o': 0.3, duration: 0.25 }, at + N.length * 0.3);
        const halo = halos[i];
        if (halo) {
          tl.fromTo(
            halo,
            { autoAlpha: 0, scale: 0.4 },
            { autoAlpha: 1, scale: 1.25, ease: 'power2.out', duration: 0.18 },
            at + N.length * 0.26,
          );
          tl.to(halo, { scale: 1, opacity: 0.55, duration: 0.3 }, at + N.length * 0.26 + 0.18);
        }
      });

      // ── Capabilities: the camera flies to each hand ─────────────────
      // Desktop: the hand's object is framed on one third of the screen and the
      // panel docks on the other. Phones: the hand sits in the upper part of the
      // frame, above the docked panel. Between hands the camera eases out a
      // little and sweeps across the entity to the next one.
      const ZOOM = mobile ? 1.5 : 2.1;
      const TRAVEL_ZOOM = mobile ? 1.22 : 1.55;
      for (let s = 0; s < CAPABILITY_STEPS; s++) {
        const service = byHand[s];
        if (!service) continue;
        const hand = handPoint(service.visual.hand);
        const at = K.start + s * step;
        const leftHand = service.visual.hand % 2 === 0;
        let x: number;
        let y: number;
        if (mobile) {
          x = clampX(hand.x, ZOOM);
          y = clampY(hand.y + ((0.5 - 0.34) * visH) / ZOOM, ZOOM);
        } else {
          // Where the hand should sit on screen (fraction of width): opposite the panel.
          const screenX = leftHand ? 0.34 : 0.66;
          x = hand.x + (0.5 - screenX) * (visW / ZOOM);
          y = hand.y + 0.05 / ZOOM;
        }
        tl.to(camera.state, { x, y, ease: 'cinema', duration: step * 0.5 }, at);
        if (s === 0) {
          tl.to(camera.state, { zoom: ZOOM, ease: 'cinema', duration: step * 0.5 }, at);
        } else {
          tl.to(camera.state, { zoom: TRAVEL_ZOOM, ease: 'sine.inOut', duration: step * 0.25 }, at);
          tl.to(camera.state, { zoom: ZOOM, ease: 'sine.inOut', duration: step * 0.25 }, at + step * 0.25);
        }
      }

      // ── Identity: energy returns to the heart; the camera returns to the face ──
      const finale = onFace(mobile ? 1.5 : 1.52, 0.33);
      tl.to(camera.state, { ...finale, ease: 'cinema', duration: Y.length * 0.55 }, Y.start);
      tl.to(
        camera.state,
        { zoom: finale.zoom * 1.06, ease: 'sine.inOut', duration: Y.length * 0.45 },
        Y.start + Y.length * 0.55,
      );
      tl.to(armGroups, { '--o': 1, '--flow': 1, duration: 0.2 }, Y.start);
      tl.to(halos, { opacity: 1, scale: 1.2, duration: 0.25 }, Y.start);
      // Energy returns to the heart: traces retract from the hands back to the core.
      tl.to(allDrawn, { drawSVG: '0% 0%', ease: 'power2.in', duration: Y.length * 0.32 }, Y.start + 0.25);
      tl.to(armGroups, { '--flow': 0, duration: 0.2 }, Y.start + 0.25 + Y.length * 0.28);
      tl.to(halos, { autoAlpha: 0, scale: 0.3, ease: 'power2.in', duration: Y.length * 0.28 }, Y.start + 0.3);
      tl.to(coreRef.current, { scale: 2.4, ease: 'power2.in', duration: Y.length * 0.35 }, Y.start + 0.25);
      // The heart flares as the energy arrives; then the being gives way to the page's own atmosphere.
      tl.to(cfx, { glow: 1.7, ease: 'sine.in', duration: Y.length * 0.3 }, Y.start + 0.25);
      tl.to(cfx, { glow: 1.2, ease: 'sine.out', duration: Y.length * 0.3 }, Y.start + 0.25 + Y.length * 0.3);
      tl.to(cfx, { eyes: 1.6, duration: 0.3 }, Y.start + 0.2);
      tl.fromTo(
        layer,
        { opacity: 1 },
        { opacity: 0, ease: 'sine.inOut', duration: Y.length * 0.42 },
        Y.end - Y.length * 0.42,
      );

      const group = tracesRef.current;
      const updateActive = (pos: number) => {
        const flowing = String(pos >= Y.start && pos < Y.end);
        if (group && group.dataset.flowing !== flowing) group.dataset.flowing = flowing;
        let next = -1;
        if (pos >= K.start && pos < K.end)
          next = Math.min(CAPABILITY_STEPS - 1, Math.floor((pos - K.start) / step));
        if (next !== activeRef.current) {
          activeRef.current = next;
          setActive(next);
          halos.forEach((h, i) => (h.dataset.active = String(byHand[next]?.visual.hand === i)));
          armGroups.forEach((g, i) => g.setAttribute('data-active', String(byHand[next]?.visual.hand === i)));
        }
      };

      return {
        start: formFrom - 0.05,
        end: director.total + 0.01,
        preload: 4,
        onPreload: () => mediaRef.current?.load(),
        render: updateActive,
        onActive(isActive) {
          layer.style.visibility = isActive ? 'visible' : 'hidden';
          mediaRef.current?.setPlaying(isActive);
          if (isActive) ticker.start();
          else ticker.stop();
        },
      };
    },
    [aspectKey, mode],
  );

  const N = chapters.spans.intelligence;
  const K = chapters.spans.capabilities;

  return (
    <>
      <div ref={layerRef} className={styles.layer}>
        <div ref={glHostRef} className={styles.glHost} />
        <div ref={plateRef} className={styles.plate} data-living={living || undefined}>
          <PlateMedia ref={mediaRef} asset={COSMIC} className={styles.still} />

          <svg
            className={styles.traces}
            viewBox={`0 0 ${PW} ${PH}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              {byHand.map((s) => (
                <linearGradient
                  key={s.id}
                  id={`trace-${s.visual.hand}`}
                  gradientUnits="userSpaceOnUse"
                  x1={core.x * PW}
                  y1={core.y * PH}
                  x2={handPoint(s.visual.hand).x * PW}
                  y2={handPoint(s.visual.hand).y * PH}
                >
                  <stop offset="0" stopColor="#e8ecff" />
                  <stop offset="1" stopColor={s.accent} />
                </linearGradient>
              ))}
            </defs>
            <g ref={tracesRef}>
              {armPaths.map((d, i) => (
                <g key={i} data-arm={i} className={styles.arm}>
                  <path d={d} data-draw className={styles.traceGlow} stroke={`url(#trace-${i})`} />
                  <path d={d} data-draw className={styles.trace} stroke={`url(#trace-${i})`} />
                  <path d={d} className={styles.flow} />
                </g>
              ))}
            </g>
          </svg>

          <div ref={halosRef} aria-hidden="true">
            {arms.map((_, i) => {
              const p = handPoint(i);
              const service = services.find((s) => s.visual.hand === i);
              return (
                <div
                  key={i}
                  data-halo
                  className={styles.halo}
                  style={{
                    left: `${p.x * 100}%`,
                    top: `${p.y * 100}%`,
                    ['--accent' as string]: service?.accent ?? '#8b9dff',
                  }}
                >
                  <span className={styles.haloGlow} />
                  <span className={styles.haloRing} />
                  <span className={styles.haloDash} />
                </div>
              );
            })}
          </div>

          <div
            ref={coreRef}
            className={styles.core}
            style={{ left: `${core.x * 100}%`, top: `${core.y * 100}%` }}
            aria-hidden="true"
          >
            {/* Still-plate fallback only: the living render beats its own heart inside the chest. */}
            <span ref={coreBreathRef} className={styles.coreInner} />
          </div>
          <div ref={eyesRef} className={styles.eyes} aria-hidden="true">
            {eyes.map((e, i) => (
              <span key={i} className={styles.eye} style={{ left: `${e.x * 100}%`, top: `${e.y * 100}%` }} />
            ))}
          </div>
        </div>
        <div className={styles.fog} aria-hidden="true" />
        <div className={styles.grade} aria-hidden="true" />
      </div>

      <BrandReveal />
      <StageCaption
        id="intelligence"
        from={N.start + N.length * 0.56}
        to={K.start + 0.3}
        kicker="Intelligence"
        bold="One intelligence"
        serif="six hands"
        support="Every system we build is one hand of the same intelligence."
        placement="bottom-center"
      />
      <CapabilityHUD
        ref={hudRef}
        services={byHand}
        active={active}
        range={{ start: K.start, step: K.length / CAPABILITY_STEPS }}
      />
      <IdentityReveal />
    </>
  );
}
