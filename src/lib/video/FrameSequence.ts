/**
 * FrameSequence — a clip as individual frames, for scroll scrubbing.
 *
 * Browsers seek a <video> by decoding forward from the previous keyframe, so a
 * scrubbed clip stutters. Frames are independent: any one can be shown at
 * once, in either direction.
 *
 *   download  coarse → fine (every 64th frame, then 32nd, 16th … all), so any
 *             scroll position soon has a frame nearby; frames just ahead of the
 *             playhead jump the queue. Compressed files stay in memory (small).
 *   decode    only a window around the playhead is decoded (ImageBitmap, off the
 *             main thread), biased in the direction of travel; frames that fall
 *             out of the window are released, so memory stays flat.
 *
 * `nearest(i)` returns the closest decoded frame, so the picture never blanks
 * while data is still arriving.
 */

export interface FrameSequenceOptions {
  count: number;
  url: (index: number) => string;
  /** Download every n-th frame only (Save-Data); in-between positions use the nearest frame. */
  stride?: number;
  /** Parallel downloads. */
  concurrency?: number;
  /** Decoded frames kept at once. */
  budget?: number;
}

export interface DecodedFrame {
  index: number;
  image: ImageBitmap;
}

const DECODE_AHEAD = 12;
const DECODE_BEHIND = 4;
const PRIORITY_AHEAD = 20;
const MAX_DECODES = 3;

export class FrameSequence {
  readonly count: number;
  readonly stride: number;
  private readonly url: (index: number) => string;
  private readonly concurrency: number;
  private readonly budget: number;
  private readonly blobs: (Blob | null)[];
  private readonly requested: boolean[];
  private readonly bitmaps = new Map<number, ImageBitmap>();
  private readonly decoding = new Set<number>();
  private readonly order: number[];
  private cursor = 0;
  private active = 0;
  private decodes = 0;
  private started = false;
  private destroyed = false;
  private readonly abort = new AbortController();
  private playhead = 0;
  private direction: 1 | -1 = 1;
  /** Frames downloaded so far. */
  loaded = 0;
  /** The number of frames that will be downloaded. */
  readonly total: number;
  /** A frame finished decoding — the owner may want to draw again. */
  onDecoded: (() => void) | null = null;

  constructor(opts: FrameSequenceOptions) {
    this.count = opts.count;
    this.stride = Math.max(1, Math.round(opts.stride ?? 1));
    this.url = opts.url;
    this.concurrency = opts.concurrency ?? 4;
    this.budget = Math.max(DECODE_AHEAD + DECODE_BEHIND + 2, opts.budget ?? 22);
    this.blobs = new Array<Blob | null>(this.count).fill(null);
    this.requested = new Array<boolean>(this.count).fill(false);
    this.order = coarseToFine(this.count, this.stride);
    this.total = this.order.length;
  }

  /** Begin downloading. */
  start(): void {
    if (this.started || this.destroyed) return;
    this.started = true;
    this.pump();
  }

  get complete(): boolean {
    return this.loaded >= this.total;
  }

  /** Where the playhead is (fractional frame): frames around it are fetched and decoded first. */
  seek(position: number): void {
    if (Math.abs(position - this.playhead) > 0.01) this.direction = position > this.playhead ? 1 : -1;
    this.playhead = Math.min(this.count - 1, Math.max(0, position));
    this.schedule();
  }

  /** The decoded frame closest to `index` (exact when available), or null before anything is decoded. */
  nearest(index: number): DecodedFrame | null {
    const i = Math.min(this.count - 1, Math.max(0, Math.round(index)));
    const exact = this.bitmaps.get(i);
    if (exact) return { index: i, image: exact };
    let best: DecodedFrame | null = null;
    let bestD = Infinity;
    for (const [k, image] of this.bitmaps) {
      const d = Math.abs(k - i);
      if (d < bestD) {
        bestD = d;
        best = { index: k, image };
      }
    }
    return best;
  }

  /** The downloaded frame closest to `index` (itself once it has arrived). */
  resolve(index: number): number {
    const i = Math.min(this.count - 1, Math.max(0, Math.round(index)));
    if (this.blobs[i]) return i;
    for (let d = 1; d < this.count; d++) {
      if (i - d >= 0 && this.blobs[i - d]) return i - d;
      if (i + d < this.count && this.blobs[i + d]) return i + d;
    }
    return i;
  }

  /** The exact frame, if decoded. */
  get(index: number): ImageBitmap | null {
    return this.bitmaps.get(index) ?? null;
  }

  destroy(): void {
    this.destroyed = true;
    this.abort.abort();
    for (const bmp of this.bitmaps.values()) bmp.close();
    this.bitmaps.clear();
    this.onDecoded = null;
  }

  /* ── downloading ─────────────────────────────────────────────── */

  private nextToFetch(): number {
    // Frames just ahead of the playhead first…
    const p = Math.round(this.playhead);
    for (let d = 0; d <= PRIORITY_AHEAD; d += this.stride) {
      const i = p + d * this.direction;
      if (i >= 0 && i < this.count && this.wanted(i) && !this.requested[i]) return i;
    }
    // …then everything, coarse to fine.
    while (this.cursor < this.order.length && this.requested[this.order[this.cursor]!]) this.cursor++;
    return this.cursor < this.order.length ? this.order[this.cursor]! : -1;
  }

  /** With a stride, only multiples of it (and the last frame) are ever downloaded. */
  private wanted(i: number): boolean {
    return i % this.stride === 0 || i === this.count - 1;
  }

  private pump(): void {
    while (!this.destroyed && this.active < this.concurrency) {
      const i = this.nextToFetch();
      if (i < 0) return;
      this.requested[i] = true;
      this.active++;
      void this.fetchFrame(i).finally(() => {
        this.active--;
        this.pump();
      });
    }
  }

  private async fetchFrame(i: number, attempt = 0): Promise<void> {
    try {
      const res = await fetch(this.url(i), { signal: this.abort.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      if (this.destroyed) return;
      this.blobs[i] = blob;
      this.loaded++;
      this.schedule();
    } catch (err) {
      if (this.destroyed || (err as Error).name === 'AbortError') return;
      if (attempt < 2) return this.fetchFrame(i, attempt + 1);
      console.warn(`[frames] frame ${i} unavailable`, err);
    }
  }

  /* ── decoding ────────────────────────────────────────────────── */

  private schedule(): void {
    if (this.destroyed) return;
    const p = Math.round(this.playhead);
    const lo = this.direction > 0 ? p - DECODE_BEHIND : p - DECODE_AHEAD;
    const hi = this.direction > 0 ? p + DECODE_AHEAD : p + DECODE_BEHIND;

    // Decode what the window needs, nearest first. If the playhead's own frame is
    // not downloaded yet, the nearest downloaded one stands in for it.
    const candidates: number[] = [this.resolve(p)];
    for (let d = 1; d <= DECODE_AHEAD; d++) {
      for (const i of [p + d * this.direction, p - d * this.direction]) {
        if (i >= lo && i <= hi && i >= 0 && i < this.count) candidates.push(i);
      }
    }
    for (const i of candidates) {
      if (this.decodes >= MAX_DECODES) break;
      if (this.blobs[i] && !this.bitmaps.has(i) && !this.decoding.has(i)) void this.decode(i);
    }

    // Release frames far from the playhead once over budget.
    if (this.bitmaps.size > this.budget) {
      const far = [...this.bitmaps.keys()]
        .filter((k) => k < lo || k > hi)
        .sort((a, b) => Math.abs(b - p) - Math.abs(a - p));
      for (const k of far) {
        if (this.bitmaps.size <= this.budget) break;
        this.bitmaps.get(k)?.close();
        this.bitmaps.delete(k);
      }
    }
  }

  private async decode(i: number): Promise<void> {
    const blob = this.blobs[i];
    if (!blob) return;
    this.decoding.add(i);
    this.decodes++;
    try {
      const image = await createImageBitmap(blob);
      if (this.destroyed) {
        image.close();
        return;
      }
      this.bitmaps.set(i, image);
      this.onDecoded?.();
    } catch (err) {
      console.warn(`[frames] frame ${i} could not be decoded`, err);
      this.blobs[i] = null;
    } finally {
      this.decoding.delete(i);
      this.decodes--;
      this.schedule();
    }
  }
}

/** 0 and the last frame, then every 64th, 32nd … 1st — each pass halving the gaps. */
function coarseToFine(count: number, stride: number): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  const push = (i: number) => {
    if (i < 0 || i >= count || seen.has(i)) return;
    if (i % stride !== 0 && i !== count - 1) return;
    seen.add(i);
    out.push(i);
  };
  push(0);
  push(count - 1);
  for (let step = 64; step >= 1; step /= 2) {
    for (let i = 0; i < count; i += step) push(i);
  }
  return out;
}
