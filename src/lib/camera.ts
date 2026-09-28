/**
 * SceneCamera — a 2.5D camera over a flat "plate" (image / video frame).
 *
 * The plate is laid out at its natural aspect, sized to COVER the viewport, and
 * then moved by the camera:
 *
 *     focus  (x, y)  normalized plate point shown at the centre of the screen
 *     zoom           1 = cover; >1 pushes in; <1 pulls back (letterboxed)
 *     rotate         degrees, around the screen centre
 *
 * Everything inside the plate element (media, SVG, HTML markers positioned in
 * % of the plate) follows automatically. Screen-space canvases use `project()`
 * with the same maths, so overlays stay locked to the artwork at any size.
 *
 *   screen(u,v) = C + R(θ) · zoom · ((u − fx)·W, (v − fy)·H)
 */
import type { NormPoint } from '@/types/media';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  rotate: number;
}

export interface CameraOptions {
  /** Keep plate edges out of frame when zoomed in (default true). */
  clamp?: boolean;
  initial?: Partial<CameraState>;
}

export class SceneCamera {
  /** Choreographed state — tweened by scene timelines. */
  readonly state: CameraState;
  /** Additive "handheld" offset (pointer parallax, drift) kept separate from choreography. */
  readonly offset = { x: 0, y: 0, rotate: 0 };
  /**
   * Framing multiplier chosen per layout (e.g. pull back on portrait screens so
   * the subject fits with room for type). Choreography stays layout-agnostic.
   */
  zoomBase = 1;
  private readonly aspect: number;
  private readonly clampEdges: boolean;
  /** Viewport size (CSS px). */
  vw = 1;
  vh = 1;
  /** Plate size at zoom 1 (cover). */
  W = 1;
  H = 1;
  /** Effective (clamped) focus used for the last apply/project. */
  private fx = 0.5;
  private fy = 0.5;
  private cos = 1;
  private sin = 0;

  constructor(plateWidth: number, plateHeight: number, opts: CameraOptions = {}) {
    this.aspect = plateWidth / plateHeight;
    this.clampEdges = opts.clamp ?? true;
    this.state = { x: 0.5, y: 0.5, zoom: 1, rotate: 0, ...opts.initial };
  }

  /** Call on viewport resize. */
  resize(vw: number, vh: number): void {
    this.vw = vw;
    this.vh = vh;
    if (vw / vh > this.aspect) {
      this.W = vw;
      this.H = vw / this.aspect;
    } else {
      this.H = vh;
      this.W = vh * this.aspect;
    }
    this.update();
  }

  /** Recompute derived values from `state`. Called by apply(); call manually before project() if needed. */
  /** Effective zoom = choreographed zoom × layout framing. */
  get zoom(): number {
    return this.state.zoom * this.zoomBase;
  }

  update(): void {
    const zoom = this.zoom;
    const rotate = this.state.rotate + this.offset.rotate;
    let fx = this.state.x + this.offset.x;
    let fy = this.state.y + this.offset.y;
    if (this.clampEdges) {
      const halfW = this.vw / (2 * zoom * this.W);
      const halfH = this.vh / (2 * zoom * this.H);
      fx = halfW >= 0.5 ? 0.5 : Math.min(Math.max(fx, halfW), 1 - halfW);
      fy = halfH >= 0.5 ? 0.5 : Math.min(Math.max(fy, halfH), 1 - halfH);
    }
    this.fx = fx;
    this.fy = fy;
    const r = (rotate * Math.PI) / 180;
    this.cos = Math.cos(r);
    this.sin = Math.sin(r);
  }

  /** Size the plate element (call on resize). */
  layout(el: HTMLElement): void {
    el.style.width = `${this.W}px`;
    el.style.height = `${this.H}px`;
    el.style.setProperty('--plate-w', `${this.W}px`);
    el.style.setProperty('--plate-h', `${this.H}px`);
  }

  /** Write the camera transform to the plate element. Compositor-only (transform). */
  apply(el: HTMLElement): void {
    this.update();
    const zoom = this.zoom;
    const rotate = this.state.rotate + this.offset.rotate;
    const tx = -this.fx * this.W;
    const ty = -this.fy * this.H;
    el.style.transform =
      `translate3d(${(this.vw / 2).toFixed(2)}px, ${(this.vh / 2).toFixed(2)}px, 0) ` +
      `rotate(${rotate.toFixed(3)}deg) scale(${zoom.toFixed(5)}) translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
  }

  /** Normalized plate point → screen px. Uses the state from the last update()/apply(). */
  project(p: NormPoint, out: { x: number; y: number } = { x: 0, y: 0 }): { x: number; y: number } {
    const z = this.zoom;
    const dx = (p.x - this.fx) * this.W * z;
    const dy = (p.y - this.fy) * this.H * z;
    out.x = this.vw / 2 + dx * this.cos - dy * this.sin;
    out.y = this.vh / 2 + dx * this.sin + dy * this.cos;
    return out;
  }

  /** Effective (clamped) plate point at the screen centre — for shaders that invert the camera. */
  get focus(): { x: number; y: number } {
    return { x: this.fx, y: this.fy };
  }

  /** Rotation actually applied (choreography + handheld), radians. */
  get rotation(): number {
    return ((this.state.rotate + this.offset.rotate) * Math.PI) / 180;
  }

  /** Screen px per normalized plate unit along the plate's height (for radii). */
  unitScale(): number {
    return this.H * this.zoom;
  }
}
