/**
 * 03 — INTELLIGENCE → CAPABILITIES → IDENTITY
 *
 * The flight's light condenses into the heart of a six-armed cosmic
 * intelligence. The camera never stops moving forward: the vast entity grows
 * slowly out of the clearing light, blazes, settles into its living glow, its
 * eyes ignite (the eye again — the film's first image) and energy races down
 * all six arms.
 * Each arm carries one GA Automations capability: scrolling steps through
 * them, the camera leaning toward each hand as its panel docks alongside.
 * Finally every arm returns its energy to the core and the identity appears.
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
import { IdentityReveal } from '../ui/IdentityReveal';
import { StageCaption } from '../ui/StageCaption';
import { useFilmMode } from '../filmState';
import { useStage } from '../StageContext';
import styles from './CosmicScene.module.css';

const COSMIC = media.cosmicEntity;
const { core, eyes, arms } = COSMIC.anchors;
const PW = COSMIC.width;
const PH = COSMIC.height;

const services = content.services();
/** Services ordered by the hand that carries them. */
const byHand = [...services].sort((a, b) => a.visual.hand - b.visual.hand);

export function CosmicScene() {
  const { device, size, shared, chapters, director } = useStage();
  const layerRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const rushRef = useRef<HTMLDivElement>(null);
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
  const portrait = useRef(false);

  const camera = useMemo(
    () => new SceneCamera(PW, PH, { clamp: !device.isMobile, initial: { x: core.x, y: core.y, zoom: 1.75 } }),
    [device.isMobile],
  );
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
  const renderScale = byTier({ high: 1, medium: device.isMobile ? 0.75 : 0.85, low: 0.7 });
  useEffect(() => {
    const host = glHostRef.current;
    if (!host || !device.webgl2) return;
    const canvas = document.createElement('canvas');
    canvas.className = styles.glCanvas!;
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    let renderer: CosmicRenderer | null = null;
    try {
      // Desktop GPUs get the 2× upscaled plate so close camera moves stay crisp.
      const hiRes = !device.isMobile && device.tier !== 'low';
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
        portrait.current = width / height < 1.1;
        camera.resize(width, height);
        // Portrait: pull back so a hand + its object fill the width; the camera pans hand to hand.
        camera.zoomBase = portrait.current ? Math.min(1, width / camera.W / 0.46) : 1;
        // The rush flies outward from the heart (as framed at the reveal).
        if (rushRef.current) {
          const hx = width / 2 + (core.x - 0.5) * camera.W * camera.zoomBase;
          const hy = height / 2 + (core.y - 0.5) * camera.H * camera.zoomBase;
          rushRef.current.style.transformOrigin = `${hx.toFixed(1)}px ${hy.toFixed(1)}px`;
        }
        camera.layout(plate);
        camera.apply(plate);
        hudRef.current?.layout();
      }),
    [camera, size, renderScale],
  );

  const ticker = useTicker((time, dt) => {
    const plate = plateRef.current;
    if (!plate) return;
    const k = Math.min(1, dt * 2);
    camera.offset.x += (pointer.x * 0.007 - camera.offset.x) * k;
    camera.offset.y += (pointer.y * 0.005 - camera.offset.y) * k;
    camera.apply(plate);

    // One breath every 6.5 s — body, heart and aura breathe together.
    const breath = 0.5 - 0.5 * Math.cos((time / 6.5) * Math.PI * 2);
    if (coreBreathRef.current)
      coreBreathRef.current.style.transform = `scale(${(0.92 + breath * 0.2).toFixed(3)})`;
    const r = rendererRef.current;
    if (r?.ready) {
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
      const plate = plateRef.current!;
      const armGroups = [...(tracesRef.current?.querySelectorAll<SVGGElement>('[data-arm]') ?? [])];
      const drawn = (i: number) => [...armGroups[i]!.querySelectorAll<SVGPathElement>('[data-draw]')];
      const allDrawn = armGroups.flatMap((_, i) => drawn(i));
      const halos = [...(halosRef.current?.querySelectorAll<HTMLElement>('[data-halo]') ?? [])];
      const T = ch.spans.transition;
      const baked = mode === 'baked';
      // The moment the entity takes the screen: under the light's peak, or — baked — as the footage ends.
      const handoff = baked ? T.end : ch.peak;
      // Start rendering a little earlier, hidden beneath the light / the footage.
      const start = handoff - (baked ? 0.3 : 0.32);
      const step = K.length / CAPABILITY_STEPS;

      // ── The reveal: the camera keeps moving FORWARD ──────────────────
      // The flight's momentum carries through the light. The entity is vast and
      // far away, so it grows only slowly while the near atmosphere rushes past;
      // everything decelerates together. No pull-back, no reversal.
      tl.fromTo(
        camera.state,
        { x: 0.5, y: 0.5, zoom: 1, rotate: baked ? 0 : 0.7 },
        {
          x: 0.5,
          y: 0.47,
          zoom: 1.05,
          rotate: 0,
          ease: baked ? 'sine.inOut' : 'power2.out',
          duration: N.end - handoff,
        },
        handoff,
      );
      if (!baked) {
        tl.fromTo(
          rushRef.current,
          { opacity: 0.9, scale: 1 },
          { opacity: 0, scale: 2.6, ease: 'power2.out', duration: 1.05 },
          handoff - 0.08,
        );
      }
      // The light condenses into the heart; the whole being blazes, then settles to its living glow.
      tl.fromTo(
        coreRef.current,
        { opacity: 0, scale: 0.4 },
        { opacity: 1, scale: 1, ease: 'power3.out', duration: 0.8 },
        handoff - 0.05,
      );
      tl.fromTo(
        cfx,
        { glow: baked ? 1.35 : 2.4 },
        { glow: 1, ease: 'power2.out', duration: N.start + N.length * 0.7 - handoff },
        handoff,
      );
      // The eyes ignite as the light clears.
      tl.fromTo(
        cfx,
        { eyes: 0 },
        { eyes: 1, ease: 'power3.out', duration: N.length * 0.25 },
        N.start + N.length * 0.12,
      );

      // Energy races down all six arms, halos flare, then settle to standby.
      armGroups.forEach((group, i) => {
        const at = ch.frac('intelligence', 0.58) + i * 0.045;
        tl.fromTo(
          drawn(i),
          { drawSVG: '0% 0%' },
          { drawSVG: '0% 100%', ease: 'power2.inOut', duration: N.length * 0.28 },
          at,
        );
        // Opacity lives in a CSS variable so the active state (CSS) can override it cleanly.
        tl.fromTo(group, { '--o': 1 }, { '--o': 0.3, duration: 0.25 }, at + N.length * 0.28);
        const halo = halos[i];
        if (halo) {
          tl.fromTo(
            halo,
            { autoAlpha: 0, scale: 0.4 },
            { autoAlpha: 1, scale: 1.25, ease: 'power2.out', duration: 0.18 },
            at + N.length * 0.24,
          );
          tl.to(halo, { scale: 1, opacity: 0.55, duration: 0.3 }, at + N.length * 0.24 + 0.18);
        }
      });

      // ── Capabilities: the camera flies to each hand ─────────────────
      // Desktop: the hand's object is framed on one third of the screen and the
      // panel docks on the other. Between hands the camera eases out a little and
      // sweeps across the entity to the next one.
      const { width: vw, height: vh } = size.get();
      const mobile = device.isMobile;
      const ZOOM = mobile ? 1.45 : 2.1;
      const TRAVEL_ZOOM = mobile ? 1.15 : 1.55;
      // Visible width of the plate at zoom 1, as a fraction of the plate (cover-fit).
      const coverW = Math.min(1, vw / vh / (PW / PH));
      for (let s = 0; s < CAPABILITY_STEPS; s++) {
        const service = byHand[s];
        if (!service) continue;
        const hand = handPoint(service.visual.hand);
        const at = K.start + s * step;
        const leftHand = service.visual.hand % 2 === 0;
        // Where the hand should sit on screen (fraction of width): opposite the panel.
        const screenX = mobile ? 0.5 : leftHand ? 0.34 : 0.66;
        const x = hand.x + (0.5 - screenX) * (coverW / ZOOM);
        const y = mobile ? hand.y + 0.06 : hand.y + 0.05 / ZOOM;
        tl.to(camera.state, { x, y, ease: 'cinema', duration: step * 0.5 }, at);
        if (s === 0) {
          tl.to(camera.state, { zoom: ZOOM, ease: 'cinema', duration: step * 0.5 }, at);
        } else {
          tl.to(camera.state, { zoom: TRAVEL_ZOOM, ease: 'sine.inOut', duration: step * 0.25 }, at);
          tl.to(camera.state, { zoom: ZOOM, ease: 'sine.inOut', duration: step * 0.25 }, at + step * 0.25);
        }
      }

      // ── Identity: energy returns to the heart; the entity recedes ────
      tl.to(
        camera.state,
        { x: 0.5, y: 0.44, zoom: mobile ? 0.9 : 0.96, ease: 'cinema', duration: Y.length * 0.5 },
        Y.start,
      );
      tl.to(armGroups, { '--o': 1, '--flow': 1, duration: 0.2 }, Y.start);
      tl.to(halos, { opacity: 1, scale: 1.2, duration: 0.25 }, Y.start);
      // Energy returns to the heart: traces retract from the hands back to the core.
      tl.to(allDrawn, { drawSVG: '0% 0%', ease: 'power2.in', duration: Y.length * 0.35 }, Y.start + 0.25);
      tl.to(armGroups, { '--flow': 0, duration: 0.2 }, Y.start + 0.25 + Y.length * 0.3);
      tl.to(halos, { autoAlpha: 0, scale: 0.3, ease: 'power2.in', duration: Y.length * 0.3 }, Y.start + 0.3);
      tl.to(coreRef.current, { scale: 2.4, ease: 'power2.in', duration: Y.length * 0.35 }, Y.start + 0.25);
      tl.to([plate, glHostRef.current], { opacity: 0.3, duration: Y.length * 0.4 }, Y.start + 0.2);
      tl.to(
        [plate, coreRef.current, glHostRef.current],
        { opacity: 0, duration: Y.length * 0.3 },
        Y.end - Y.length * 0.3,
      );
      tl.to(cfx, { eyes: 1.6, duration: 0.3 }, Y.start + 0.2);

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
        start,
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
        {/* The last of the atmosphere, rushing past as we come out of the light */}
        <div ref={rushRef} className={styles.rush} aria-hidden="true" />
      </div>

      <StageCaption
        id="intelligence"
        from={N.start + N.length * 0.3}
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
