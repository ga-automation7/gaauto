/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CINEMATIC CHAPTERS — the scroll "script" of the opening sequence.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  The opening is one sticky stage. Scrolling through it advances a single
 *  "stage position" measured in viewport heights (vh units). Each chapter owns
 *  a span of that position. Scenes animate against absolute stage positions,
 *  so re-timing the film is a matter of editing lengths here.
 *
 *    PERCEPTION ─ IRIS ─ CITY ─ TRANSITION ─ INTELLIGENCE ─ CAPABILITIES ─ IDENTITY
 *
 *  CITY and TRANSITION are the film: their lengths come from the footage
 *  (media.film.footage) at one constant rate of scroll per second of footage,
 *  so the camera never changes speed at a join.
 *
 *  See docs/animations.md for how scenes consume these ranges.
 */
import { media } from './media';

export type ChapterId =
  'perception' | 'iris' | 'city' | 'transition' | 'intelligence' | 'capabilities' | 'identity';

export interface ChapterConfig {
  id: ChapterId;
  /** Short index label shown in captions / progress rail. */
  index: string;
  label: string;
  /** Length in viewport heights. */
  length: number;
  /** Mobile length (touch scrolling travels further per gesture). */
  mobileLength?: number;
}

/** Scroll per second of footage (vh/s) — one rate for the whole film. */
export const FILM_RATE = { desktop: 0.4, mobile: 0.34 } as const;
/** Seconds of flight assumed for the still (no footage yet): its forward push. */
const STILL_FLIGHT = 8;
/** Length of the light bridge when the site composites the transition (vh). */
const BRIDGE = { desktop: 2.0, mobile: 1.7 } as const;
/** The light peaks — and the city gives way to the Cosmic God — at this fraction of TRANSITION. */
export const BRIDGE_PEAK = 0.5;

function filmLengths(mobile: boolean): { city: number; transition: number } {
  const rate = mobile ? FILM_RATE.mobile : FILM_RATE.desktop;
  const footage = media.film.footage;
  // The transition is in the footage: both chapters follow it exactly.
  if (footage && footage.morph > 0) return { city: footage.flight * rate, transition: footage.morph * rate };
  // Composited: the flight runs on under the building light and ends as it peaks.
  const bridge = mobile ? BRIDGE.mobile : BRIDGE.desktop;
  const seconds = footage ? footage.flight : STILL_FLIGHT;
  return { city: Math.max(1.6, seconds * rate - bridge * BRIDGE_PEAK), transition: bridge };
}

const FILM = { desktop: filmLengths(false), mobile: filmLengths(true) };

export const CHAPTERS: ChapterConfig[] = [
  { id: 'perception', index: '01', label: 'Perception', length: 2.2, mobileLength: 1.8 },
  { id: 'iris', index: '01', label: 'The Iris', length: 1.6, mobileLength: 1.3 },
  { id: 'city', index: '02', label: 'The City', length: FILM.desktop.city, mobileLength: FILM.mobile.city },
  {
    id: 'transition',
    index: '02',
    label: 'Ascension',
    length: FILM.desktop.transition,
    mobileLength: FILM.mobile.transition,
  },
  { id: 'intelligence', index: '03', label: 'Intelligence', length: 1.5, mobileLength: 1.3 },
  { id: 'capabilities', index: '03', label: 'Capabilities', length: 6.0, mobileLength: 5.4 },
  { id: 'identity', index: '04', label: 'GA Automations', length: 1.6, mobileLength: 1.4 },
];

/** Number of capability steps inside the `capabilities` chapter (one per hand). */
export const CAPABILITY_STEPS = 6;

export interface ChapterSpan extends ChapterConfig {
  start: number;
  end: number;
}

export interface ChapterMap {
  spans: Record<ChapterId, ChapterSpan>;
  list: ChapterSpan[];
  /** Total stage length in vh (excluding the sticky viewport itself). */
  total: number;
  /** Absolute stage position of `offset` vh into chapter `id`. Negative offsets reach back. */
  at: (id: ChapterId, offset?: number) => number;
  /** Absolute position at fraction `t` (0–1) of chapter `id`. */
  frac: (id: ChapterId, t: number) => number;
  /** Where the transition's light peaks: the city gives way to the Cosmic God here. */
  peak: number;
}

export function buildChapterMap(mobile: boolean): ChapterMap {
  let cursor = 0;
  const list = CHAPTERS.map((c) => {
    const length = mobile ? (c.mobileLength ?? c.length) : c.length;
    const span: ChapterSpan = { ...c, length, start: cursor, end: cursor + length };
    cursor += length;
    return span;
  });
  const spans = Object.fromEntries(list.map((s) => [s.id, s])) as Record<ChapterId, ChapterSpan>;
  const T = spans.transition;
  return {
    spans,
    list,
    total: cursor,
    at: (id, offset = 0) => spans[id].start + offset,
    frac: (id, t) => spans[id].start + spans[id].length * t,
    peak: T.start + T.length * BRIDGE_PEAK,
  };
}
