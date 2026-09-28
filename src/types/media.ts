/** A point in normalized media space: (0,0) = top-left, (1,1) = bottom-right of the plate. */
export interface NormPoint {
  x: number;
  y: number;
}

export interface ImageSources {
  avif: string;
  webp: string;
  /** Smaller variant for low-tier devices / Save-Data. */
  liteAvif?: string;
  liteWebp?: string;
}

/** An ambient loop, played muted on top of a still plate while its scene is active. */
export interface VideoSources {
  desktop: string;
  mobile?: string;
  /** Optional WebM/AV1 alternative served before the MP4 when supported. */
  desktopWebm?: string;
  mobileWebm?: string;
  poster?: string;
}

/** One resolution of the film's frame sequence. */
export interface FrameSet {
  /** Folder holding 000.webp, 001.webp … */
  path: string;
  width: number;
  height: number;
  /** First frame, shown until the sequence has arrived. */
  poster: string;
  /** The horizontal slice of the full frame this set shows (0–1): phones get a centred portrait crop. */
  cropX: number;
  cropW: number;
}

/**
 * The opening film's footage as a FRAME SEQUENCE (scripts/extract-frames.mjs):
 * individual frames scroll-scrub instantly in either direction, and the site
 * blends neighbouring frames along the camera's measured motion.
 */
export interface FilmFrames {
  count: number;
  fps: number;
  /** Digits in the frame file names. */
  digits: number;
  desktop: FrameSet;
  mobile: FrameSet;
  /**
   * Camera motion from each frame to the next, as x' = s·x + b in full-frame
   * normalised coordinates: [s, bx, by].
   */
  motion: [number, number, number][];
  /** Mean colour of each frame (0–1). */
  light: [number, number, number][];
}

/**
 * When the asset is requested:
 *  - `critical` preloaded with the document (first screen only)
 *  - `idle`     after first paint, once the browser is idle
 *  - `near`     only when the stage approaches the scene (videos, heavy media)
 */
export type LoadPriority = 'critical' | 'idle' | 'near';

export interface MediaAsset<A extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  alt: string;
  /** Intrinsic size of the plate. Composition anchors are relative to this frame. */
  width: number;
  height: number;
  /** Tiny inline placeholder (generated). */
  lqip?: string;
  image: ImageSources;
  video?: VideoSources;
  priority: LoadPriority;
  /** Composition metadata: where things are inside the frame (iris, core, hands…). */
  anchors: A;
}

/** The film: a poster still (also the reduced-motion plate) plus the frame sequence. */
export interface FilmAsset<
  A extends Record<string, unknown> = Record<string, unknown>,
> extends MediaAsset<A> {
  frames: FilmFrames;
}
