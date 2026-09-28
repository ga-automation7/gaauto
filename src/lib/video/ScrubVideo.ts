/**
 * ScrubVideo — a <video> driven frame-by-frame by scroll.
 *
 * Smooth scrubbing needs three things, all handled here:
 *  1. Every seek is local: the whole file is fetched first (a blob URL), so the
 *     decoder never waits on the network mid-scroll.
 *  2. Seeks are serialised: at most one is in flight and the latest request
 *     wins. Firing a seek every frame starves the decoder and the picture
 *     freezes until scrolling stops; one-at-a-time keeps frames arriving.
 *  3. Seeks land on exact frames (frame centres), so the same scroll position
 *     always shows the same frame.
 * The footage itself should be encoded all-intra (every frame a keyframe) so
 * any frame decodes on its own — `npm run assets:video -- … --scrub`.
 */
export class ScrubVideo {
  readonly el: HTMLVideoElement;
  ready = false;
  duration = 0;
  private readonly fps: number;
  private frames = 1;
  private want = -1;
  private shown = -1;
  private seeking = false;
  private url: string | null = null;
  private readonly abort = new AbortController();

  constructor(el: HTMLVideoElement, fps: number) {
    this.el = el;
    this.fps = fps;
    el.muted = true;
    el.playsInline = true;
    el.preload = 'auto';
    el.addEventListener('seeked', this.onSeeked);
  }

  /** Fetch the whole file, then decode the first frame. Resolves when scrubbing is ready. */
  async load(src: string): Promise<void> {
    const res = await fetch(src, { signal: this.abort.signal });
    if (!res.ok) throw new Error(`Film footage failed to load (${res.status})`);
    const blob = await res.blob();
    if (this.abort.signal.aborted) return;
    this.url = URL.createObjectURL(blob);
    const el = this.el;
    await new Promise<void>((resolve, reject) => {
      el.addEventListener('loadeddata', () => resolve(), { once: true });
      el.addEventListener('error', () => reject(new Error('Film footage could not be decoded')), {
        once: true,
      });
      el.src = this.url!;
      el.load();
    });
    // iOS Safari only paints a video's frames after it has played once.
    try {
      await el.play();
      el.pause();
    } catch {
      /* autoplay refused — seeking still works everywhere else */
    }
    this.duration = el.duration;
    this.frames = Math.max(1, Math.round(el.duration * this.fps));
    this.ready = true;
    this.shown = -1;
  }

  /** Show the frame at `progress` (0–1 of the footage). */
  seek(progress: number): void {
    if (!this.ready) return;
    const p = Math.min(Math.max(progress, 0), 1);
    const frame = Math.min(this.frames - 1, Math.round(p * (this.frames - 1)));
    this.want = frame;
    if (!this.seeking && frame !== this.shown) this.issue();
  }

  private issue(): void {
    const frame = this.want;
    this.seeking = true;
    this.shown = frame;
    // Frame centre: never ambiguous between two frames.
    this.el.currentTime = Math.min((frame + 0.5) / this.fps, Math.max(0, this.duration - 0.001));
  }

  private readonly onSeeked = (): void => {
    this.seeking = false;
    if (this.want !== this.shown) this.issue();
  };

  destroy(): void {
    this.abort.abort();
    this.el.removeEventListener('seeked', this.onSeeked);
    this.el.removeAttribute('src');
    this.el.load();
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = null;
    this.ready = false;
  }
}
