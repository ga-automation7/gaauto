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

/**
 * The opening film's footage: ONE scroll-scrubbed video — the drone flight through
 * the city and, optionally, the transition into the Cosmic God baked into the
 * same file. Encode it all-intra (every frame a keyframe) so any frame can be
 * shown instantly while scrolling — see docs/assets.md.
 */
export interface FilmFootage {
  desktop: string;
  mobile?: string;
  /** Frame rate of the encode; seeks land on exact frames. */
  fps: number;
  /** Seconds of drone flight at the start of the footage. */
  flight: number;
  /**
   * Seconds of city → Cosmic God transition baked into the footage after the
   * flight, its last frame matching the entity plate. 0 = the site composites
   * the transition itself (light bridge).
   */
  morph: number;
  /** Where the flight is heading at the end of the flight (normalised frame point) — the light builds here. */
  heading: NormPoint;
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

/** The film: a still (poster, and the fallback until footage exists) plus the footage. */
export interface FilmAsset<
  A extends Record<string, unknown> = Record<string, unknown>,
> extends MediaAsset<A> {
  footage?: FilmFootage;
}
