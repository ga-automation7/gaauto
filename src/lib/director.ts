/**
 * StageDirector — plays the cinematic "film" against scroll.
 *
 * The sticky stage exposes a single scalar: the stage POSITION, in viewport
 * heights from the top of the stage. Scenes register:
 *
 *   • a GSAP timeline whose time axis IS the stage position
 *     (a tween placed at 3.2 plays when the stage is 3.2 viewports in)
 *   • an active range [start, end]; outside it the scene is hidden and idle
 *   • optional preload distance, render hook and activity callback
 *
 * Only scenes whose range contains the position are updated each frame, and
 * each receives one final update when it leaves so it settles exactly on its
 * boundary state. This keeps per-frame work flat no matter how long the film is.
 */

export interface StageSceneConfig {
  id: string;
  /** Visible/active range, absolute stage units (vh). */
  start: number;
  end: number;
  /** Timeline on the absolute stage-position axis. Must be paused. */
  timeline?: gsap.core.Timeline;
  /** Called after the timeline updates, every frame the scene is active. */
  render?: (position: number) => void;
  /** Called when the scene enters/leaves its range. */
  onActive?: (active: boolean) => void;
  /** Start loading heavy media this many units before `start`. */
  preload?: number;
  onPreload?: () => void;
}

interface SceneEntry extends StageSceneConfig {
  active: boolean;
  preloaded: boolean;
}

type PositionListener = (position: number) => void;

export class StageDirector {
  position = 0;
  total = 1;
  private readonly scenes = new Map<string, SceneEntry>();
  private readonly listeners = new Set<PositionListener>();

  register(config: StageSceneConfig): () => void {
    const entry: SceneEntry = { ...config, active: false, preloaded: false };
    this.scenes.set(config.id, entry);
    this.sync(entry, true);
    return () => {
      entry.timeline?.kill();
      if (entry.active) entry.onActive?.(false);
      this.scenes.delete(config.id);
    };
  }

  /** Feed the current stage position (vh units). Called from ScrollTrigger on every scroll frame. */
  update(position: number): void {
    this.position = position;
    for (const entry of this.scenes.values()) this.sync(entry, false);
    for (const fn of this.listeners) fn(position);
  }

  /** Re-apply the current position to every scene (after resize / layout change). */
  refresh(): void {
    for (const entry of this.scenes.values()) this.sync(entry, true);
  }

  subscribe(fn: PositionListener): () => void {
    this.listeners.add(fn);
    fn(this.position);
    return () => this.listeners.delete(fn);
  }

  isActive(id: string): boolean {
    return this.scenes.get(id)?.active ?? false;
  }

  private sync(entry: SceneEntry, force: boolean): void {
    const p = this.position;
    if (!entry.preloaded && entry.onPreload && p >= entry.start - (entry.preload ?? 2)) {
      entry.preloaded = true;
      entry.onPreload();
    }
    const active = p >= entry.start && p <= entry.end;
    const changed = active !== entry.active;
    if (changed) {
      entry.active = active;
      entry.onActive?.(active);
    }
    // Update while active, plus exactly once on the frame it leaves (to land on the boundary).
    if (active || changed || force) {
      entry.timeline?.time(Math.min(Math.max(p, 0), this.total), false);
      entry.render?.(p);
    }
  }
}
