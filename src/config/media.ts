/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MEDIA MANIFEST — the single source of truth for cinematic assets.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Components never hard-code file names. They ask for `media.heroEye`,
 *  `media.film`, … and this file decides what is served.
 *
 *  Replacing / adding assets (full guide: docs/assets.md)
 *   • Still image → drop into /public/assets/references with the same prefix,
 *     run `npm run assets:images`.
 *   • The film → put the master clip in /media-source and run
 *     `npm run assets:frames -- media-source/<clip>.mp4`: it writes the frame
 *     sequence, posters and src/data/generated/film-frames.json (read below).
 *   • If a new plate has a different composition, update its `anchors` and
 *     check the framing at desktop and phone sizes (`?debug` exposes each
 *     scene's camera as window.__eye / window.__cosmic).
 *
 *  Anchors are expressed in the plate's own pixel grid and normalised here,
 *  so they stay correct at every viewport size and crop.
 */
import meta from '@/data/generated/media-meta.json';
import frames from '@/data/generated/film-frames.json';
import type { FilmAsset, FilmFrames, MediaAsset, NormPoint, VideoSources } from '@/types/media';

type Plate = { width: number; height: number };
const norm = (plate: Plate, x: number, y: number): NormPoint => ({ x: x / plate.width, y: y / plate.height });
const normPath = (plate: Plate, pts: [number, number][]): NormPoint[] =>
  pts.map(([x, y]) => norm(plate, x, y));

/* ── Composition anchor types ───────────────────────────────────────────── */

export interface EyeAnchors extends Record<string, unknown> {
  /** Centre of the iris / pupil — the portal. */
  iris: NormPoint;
  /** Radii as a fraction of plate height. */
  irisRadius: number;
  pupilRadius: number;
}

export interface FilmAnchors extends Record<string, unknown> {
  /** Where the drone is flying (the footage's focus of expansion, full frame) — the transformation gathers here. */
  heading: NormPoint;
}

export interface CosmicAnchors extends Record<string, unknown> {
  /** Chest core — where the transition's light condenses into the entity's heart. */
  core: NormPoint;
  eyes: [NormPoint, NormPoint];
  /**
   * The six hands, ordered by capability slot 0–5:
   * upper-left, upper-right, middle-left, middle-right, lower-left, lower-right.
   * Each arm is a polyline from the core to the object held in the hand.
   */
  arms: NormPoint[][];
}

/* ── Plates ─────────────────────────────────────────────────────────────── */

const EYE = meta.heroEye;
const COSMIC = meta.cosmic;

/* ── The film's frame sequence ──────────────────────────────────────────── */

const FRAMES: FilmFrames = {
  count: frames.count,
  fps: frames.fps,
  digits: frames.digits,
  desktop: {
    path: `${frames.base}/frames/desktop/`,
    width: frames.desktop.width,
    height: frames.desktop.height,
    poster: `${frames.base}/poster.webp`,
    cropX: 0,
    cropW: 1,
  },
  mobile: {
    path: `${frames.base}/frames/mobile/`,
    width: frames.mobile.width,
    height: frames.mobile.height,
    poster: `${frames.base}/poster-mobile.webp`,
    cropX: frames.mobile.cropX,
    cropW: frames.mobile.cropW,
  },
  motion: frames.motion as [number, number, number][],
  light: frames.light as [number, number, number][],
};

/** The focus of expansion of the camera's forward motion (where the flight is heading), full-frame uv. */
function flightHeading(): NormPoint {
  let x = 0;
  let y = 0;
  let n = 0;
  for (const [s, bx, by] of FRAMES.motion) {
    if (s - 1 < 0.004) continue;
    x += bx / (1 - s);
    y += by / (1 - s);
    n++;
  }
  return n ? { x: x / n, y: y / n } : { x: 0.5, y: 0.5 };
}

/** Mirror a left-side arm polyline onto the right side (the entity is near-symmetric about x=835). */
const mirror = (pts: [number, number][], axis = 835): [number, number][] =>
  pts.map(([x, y]) => [axis * 2 - x, y]);

const ARM_UL: [number, number][] = [
  [835, 331],
  [730, 300],
  [655, 305],
  [575, 325],
  [488, 266],
  [442, 232],
  [435, 176],
];
const ARM_ML: [number, number][] = [
  [835, 331],
  [760, 360],
  [690, 372],
  [560, 425],
  [415, 455],
  [330, 452],
  [320, 388],
];
const ARM_LL: [number, number][] = [
  [835, 331],
  [780, 400],
  [690, 450],
  [600, 548],
  [500, 628],
  [400, 660],
  [385, 618],
];

/** Replace the last point (the held object) with its measured position on the right side. */
const withEnd = (pts: [number, number][], end: [number, number]): [number, number][] => [
  ...pts.slice(0, -1),
  end,
];

export const media = {
  /** 01 — the eye. First screen: the only critical asset. */
  heroEye: {
    id: 'heroEye',
    alt: 'Extreme close-up of a human eye with an amber iris, surrounded by threads of blue cosmic light.',
    width: EYE.width,
    height: EYE.height,
    lqip: EYE.lqip,
    image: {
      avif: '/assets/images/hero/eye.avif',
      webp: '/assets/images/hero/eye.webp',
      liteAvif: '/assets/images/hero/eye-lite.avif',
      liteWebp: '/assets/images/hero/eye-lite.webp',
    },
    // video: {
    //   desktop: '/assets/video/hero/eye-loop-1080p.mp4',
    //   mobile: '/assets/video/hero/eye-loop-720p.mp4',
    //   poster: '/assets/images/hero/eye.webp',
    // },
    priority: 'critical',
    anchors: {
      iris: norm(EYE, 708, 356),
      irisRadius: 192 / EYE.height,
      pupilRadius: 60 / EYE.height,
    },
  } satisfies MediaAsset<EyeAnchors> as MediaAsset<EyeAnchors>,

  /**
   * 02 — the film: a low drone flight down a city avenue that becomes the
   * Cosmic God. The city exists only here, as footage: a frame sequence
   * scrubbed by scroll (scripts/extract-frames.mjs). Its first frame is the
   * poster and the reduced-motion plate.
   */
  film: {
    id: 'film',
    alt: 'A low drone flight down a futuristic city avenue at dusk, towers on both sides and electric light arcing between them.',
    width: frames.desktop.width,
    height: frames.desktop.height,
    lqip: frames.lqip,
    image: {
      avif: `${frames.base}/poster.avif`,
      webp: `${frames.base}/poster.webp`,
    },
    priority: 'idle',
    anchors: { heading: flightHeading() },
    frames: FRAMES,
  } satisfies FilmAsset<FilmAnchors> as FilmAsset<FilmAnchors>,

  /** 03 — the six-armed cosmic intelligence. */
  cosmicEntity: {
    id: 'cosmicEntity',
    alt: 'A colossal six-armed cosmic figure of dark starlight, each hand holding a glowing geometric form, set against deep space.',
    width: COSMIC.width,
    height: COSMIC.height,
    lqip: COSMIC.lqip,
    image: {
      avif: '/assets/images/cosmic/cosmic-entity.avif',
      webp: '/assets/images/cosmic/cosmic-entity.webp',
      liteAvif: '/assets/images/cosmic/cosmic-entity-lite.avif',
      liteWebp: '/assets/images/cosmic/cosmic-entity-lite.webp',
    },
    // video: {
    //   desktop: '/assets/video/cosmic/cosmic-entity-loop-1080p.mp4',
    //   mobile: '/assets/video/cosmic/cosmic-entity-loop-720p.mp4',
    //   poster: '/assets/images/cosmic/cosmic-entity.webp',
    // },
    priority: 'idle',
    anchors: {
      core: norm(COSMIC, 835, 331),
      // Measured at 8× on the source plate (centres of the two glowing slits).
      eyes: [norm(COSMIC, 820.5, 182.5), norm(COSMIC, 851.5, 182.3)],
      arms: [
        normPath(COSMIC, ARM_UL),
        normPath(COSMIC, withEnd(mirror(ARM_UL), [1222, 180])),
        normPath(COSMIC, ARM_ML),
        normPath(COSMIC, withEnd(mirror(ARM_ML), [1347, 388])),
        normPath(COSMIC, ARM_LL),
        normPath(COSMIC, withEnd(mirror(ARM_LL), [1297, 612])),
      ],
    },
  } satisfies MediaAsset<CosmicAnchors> as MediaAsset<CosmicAnchors>,
} as const;

/**
 * Optional short loops shown inside each capability panel, keyed by service id.
 * e.g. 'ai-agents': { desktop: '/assets/video/services/ai-agents-loop.mp4' }
 */
export const serviceClips: Partial<Record<string, VideoSources>> = {};

export type MediaKey = keyof typeof media;
