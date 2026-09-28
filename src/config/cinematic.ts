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
 *    PERCEPTION ─ IRIS ─┬ CITY ─ TRANSITION ─ EMERGENCE ─ REVEAL ┬─ INTELLIGENCE ─ CAPABILITIES ─ IDENTITY
 *                       └──────────── the SEQUENCE ──────────────┘
 *
 *  The SEQUENCE is the long signature shot: the drone footage (city), its
 *  transformation into energy (transition), the Cosmic God forming out of that
 *  energy (emergence) and GA AUTOMATIONS (reveal). It is split as
 *
 *     0–60 %  city         the flight; the words arrive over it (see FilmTitles)
 *               0–15 city alone · 15–30 THE WORLD IS MOVING · 30–45 FASTER / EVERY DAY
 *               45–60 AI ISN'T COMING / IT'S ALREADY HERE
 *    60–75 %  transition   city → energy · THE QUESTION IS / WHAT WILL YOU BUILD WITH IT?
 *    75–90 %  emergence    the being forms out of the energy
 *    90–100 % reveal       GA AUTOMATIONS · INTELLIGENT SYSTEMS. BUILT FOR WHAT'S NEXT.
 *
 *  The footage plays across city + transition at one constant rate, so the
 *  camera never changes speed.
 *
 *  See docs/animations.md for how scenes consume these ranges.
 */

export type ChapterId =
  | 'perception'
  | 'iris'
  | 'city'
  | 'transition'
  | 'emergence'
  | 'reveal'
  | 'intelligence'
  | 'capabilities'
  | 'identity';

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

/** Length of the whole signature sequence (vh). Long on purpose: it should be scrolled through, not past. */
export const SEQUENCE = { desktop: 13.5, mobile: 12 } as const;
/** How the sequence divides (fractions, summing to 1). */
export const SEQUENCE_SPLIT = { city: 0.6, transition: 0.15, emergence: 0.15, reveal: 0.1 } as const;

const seq = (part: keyof typeof SEQUENCE_SPLIT) => ({
  length: SEQUENCE.desktop * SEQUENCE_SPLIT[part],
  mobileLength: SEQUENCE.mobile * SEQUENCE_SPLIT[part],
});

export const CHAPTERS: ChapterConfig[] = [
  { id: 'perception', index: '01', label: 'Perception', length: 2.2, mobileLength: 1.8 },
  { id: 'iris', index: '01', label: 'The Iris', length: 1.6, mobileLength: 1.3 },
  { id: 'city', index: '02', label: 'The City', ...seq('city') },
  { id: 'transition', index: '02', label: 'Transformation', ...seq('transition') },
  { id: 'emergence', index: '03', label: 'Intelligence', ...seq('emergence') },
  { id: 'reveal', index: '03', label: 'GA Automations', ...seq('reveal') },
  { id: 'intelligence', index: '03', label: 'Six hands', length: 1.4, mobileLength: 1.3 },
  { id: 'capabilities', index: '03', label: 'Capabilities', length: 6.0, mobileLength: 5.4 },
  { id: 'identity', index: '04', label: 'GA Automations', length: 2.0, mobileLength: 1.8 },
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
  /** Absolute position at fraction `t` (0–1) of the whole signature sequence (city → reveal). */
  seq: (t: number) => number;
  /** Where the footage runs: its first frame at `start`, its last at `end`. */
  footage: { start: number; end: number };
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
  const start = spans.city.start;
  const length = spans.reveal.end - start;
  return {
    spans,
    list,
    total: cursor,
    at: (id, offset = 0) => spans[id].start + offset,
    frac: (id, t) => spans[id].start + spans[id].length * t,
    seq: (t) => start + length * t,
    footage: { start, end: spans.transition.end },
  };
}
