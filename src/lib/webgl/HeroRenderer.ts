/**
 * HeroRenderer — one WebGL2 context for the opening sequence.
 *
 *   pass 1  iris tunnel   (full-screen triangle, premultiplied alpha, masked by the portal)
 *   pass 2  particles     (instanced capsules, additive)
 *
 * All particle motion is computed in the vertex shader from a handful of
 * uniforms, so a frame costs two draw calls and no per-particle CPU work.
 * The renderer holds no timeline logic: the Eye scene feeds it a state object
 * that GSAP scrubs against scroll.
 */
import { seededRandom } from '@/lib/math';
import { createProgram, getUniforms, loadTexture, type UniformMap } from './glUtils';
import { fullscreenVertex, particleFragment, particleVertex, tunnelFragment } from './shaders';

export interface HeroFxState {
  /** Forward camera travel through the dust volume (monotonic with scroll). */
  travel: number;
  /** Orbiters spiral into the pupil, 0 → 1. */
  suck: number;
  /** Share of warm (amber) particles, 1 = human, 0 = machine. */
  warm: number;
  /** Global particle opacity. */
  particles: number;
  /** Outward burst when surfacing into the city. */
  burst: number;
  /** Portal opening, 0 = pupil-sized, 1 = covers the screen. */
  portal: number;
  reveal: number;
  tunnelTravel: number;
  shift: number;
  flash: number;
}

export const createHeroFxState = (): HeroFxState => ({
  travel: 0,
  suck: 0,
  warm: 1,
  particles: 1,
  burst: 0,
  portal: 0,
  reveal: 0,
  tunnelTravel: 0,
  shift: 0,
  flash: 0,
});

/** Iris geometry on screen (CSS px), measured from the eye camera each frame. */
export interface IrisScreen {
  x: number;
  y: number;
  irisR: number;
  pupilR: number;
}

export interface HeroRendererOptions {
  dust: number;
  orbiters: number;
  dpr: number;
  /** Eye plate used as the tunnel's wall texture. */
  textureUrl: string;
  iris: { x: number; y: number; irisRadius: number; pupilRadius: number; plateAspect: number };
}

const PARTICLE_UNIFORMS = [
  'uRes', 'uDpr', 'uTime', 'uTravel', 'uSpeed', 'uPointer', 'uIrisC', 'uIrisR',
  'uSuck', 'uWarm', 'uAlpha', 'uBurst', 'uStreak',
] as const;
const TUNNEL_UNIFORMS = [
  'uRes', 'uTime', 'uCenter', 'uPortal', 'uReveal', 'uTravel', 'uShift', 'uFlash',
  'uTex', 'uIrisUV', 'uIrisRUV', 'uPupilK',
] as const;

export class HeroRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly canvas: HTMLCanvasElement;
  private readonly opts: HeroRendererOptions;
  private readonly particleProgram: WebGLProgram;
  private readonly tunnelProgram: WebGLProgram;
  private readonly pu: UniformMap<(typeof PARTICLE_UNIFORMS)[number]>;
  private readonly tu: UniformMap<(typeof TUNNEL_UNIFORMS)[number]>;
  private readonly vao: WebGLVertexArrayObject;
  private readonly buffers: WebGLBuffer[] = [];
  private readonly count: number;
  private texture: WebGLTexture | null = null;
  private width = 1;
  private height = 1;
  private pointer = { x: 0, y: 0 };
  private pointerTarget = { x: 0, y: 0 };
  private speed = 0;
  private lastTravel = 0;
  private lost = false;

  constructor(canvas: HTMLCanvasElement, opts: HeroRendererOptions) {
    this.canvas = canvas;
    this.opts = opts;
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;

    this.particleProgram = createProgram(gl, particleVertex, particleFragment);
    this.tunnelProgram = createProgram(gl, fullscreenVertex, tunnelFragment);
    this.pu = getUniforms(gl, this.particleProgram, PARTICLE_UNIFORMS);
    this.tu = getUniforms(gl, this.tunnelProgram, TUNNEL_UNIFORMS);

    const vao = gl.createVertexArray();
    if (!vao) throw new Error('Unable to create VAO');
    this.vao = vao;
    this.count = opts.dust + opts.orbiters;
    this.buildParticles();

    canvas.addEventListener('webglcontextlost', this.onLost, false);
    void loadTexture(gl, opts.textureUrl)
      .then((tex) => {
        this.texture = tex;
      })
      .catch(() => {
        /* tunnel falls back to darkness + particles; the story still reads */
      });
  }

  private onLost = (e: Event) => {
    e.preventDefault();
    this.lost = true;
  };

  private buildParticles(): void {
    const { gl, opts } = this;
    const rand = seededRandom(20260927);
    const seeds = new Float32Array(this.count * 4);
    const props = new Float32Array(this.count * 4);

    for (let i = 0; i < this.count; i++) {
      const o = i * 4;
      if (i < opts.dust) {
        // Distributed around the view axis; keep the very centre clear so the iris stays readable.
        const r = 0.12 + Math.sqrt(rand()) * 1.9;
        const a = rand() * Math.PI * 2;
        seeds[o] = Math.cos(a) * r * 1.35;
        seeds[o + 1] = Math.sin(a) * r * 0.85;
        seeds[o + 2] = rand() * 7;
        seeds[o + 3] = 0;
        const bokeh = rand() < 0.07;
        props[o] = bokeh ? 5 + rand() * 7 : 0.9 + rand() * rand() * 2.6;
      } else {
        seeds[o] = rand();
        seeds[o + 1] = rand();
        seeds[o + 2] = Math.pow(rand(), 0.75);
        seeds[o + 3] = 1;
        props[o] = 1.2 + rand() * 2.2;
      }
      props[o + 1] = 0.45 + rand() * 1.1;
      props[o + 2] = rand();
      props[o + 3] = rand();
    }

    gl.bindVertexArray(this.vao);

    const corner = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, corner);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const seedBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(1, 1);

    const propBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, propBuf);
    gl.bufferData(gl.ARRAY_BUFFER, props, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(2, 1);

    gl.bindVertexArray(null);
    this.buffers.push(corner, seedBuf, propBuf);
  }

  resize(cssWidth: number, cssHeight: number): void {
    const w = Math.max(1, Math.round(cssWidth * this.opts.dpr));
    const h = Math.max(1, Math.round(cssHeight * this.opts.dpr));
    if (w === this.width && h === this.height) return;
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  /** Pointer in [-1, 1]. Smoothed internally. */
  setPointer(x: number, y: number): void {
    this.pointerTarget.x = x;
    this.pointerTarget.y = y;
  }

  render(timeSec: number, dt: number, s: HeroFxState, iris: IrisScreen): void {
    if (this.lost) return;
    const { gl } = this;
    const dpr = this.opts.dpr;
    const safeDt = Math.max(dt, 1 / 240);

    // Streak length follows real forward speed (smoothed), including the tunnel rush.
    const combined = s.travel + s.tunnelTravel * 0.6;
    const instSpeed = (combined - this.lastTravel) / safeDt;
    this.lastTravel = combined;
    this.speed += (instSpeed - this.speed) * Math.min(1, dt * 7);
    const k = Math.min(1, dt * 3.5);
    this.pointer.x += (this.pointerTarget.x - this.pointer.x) * k;
    this.pointer.y += (this.pointerTarget.y - this.pointer.y) * k;

    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);

    // ── Pass 1: tunnel ─────────────────────────────────────────────
    if (s.portal > 0.0005 && this.texture) {
      const diag = Math.hypot(this.width, this.height);
      const pupil = iris.pupilR * dpr;
      const t = s.portal;
      const portal = pupil * 1.25 + (diag * 1.45 - pupil * 1.25) * t * t;
      const { iris: a } = this.opts;
      gl.useProgram(this.tunnelProgram);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      const u = this.tu;
      gl.uniform2f(u.uRes, this.width, this.height);
      gl.uniform1f(u.uTime, timeSec);
      gl.uniform2f(u.uCenter, iris.x * dpr, iris.y * dpr);
      gl.uniform1f(u.uPortal, portal);
      gl.uniform1f(u.uReveal, s.reveal);
      gl.uniform1f(u.uTravel, s.tunnelTravel + timeSec * 0.06 * s.reveal);
      gl.uniform1f(u.uShift, s.shift);
      gl.uniform1f(u.uFlash, s.flash);
      gl.uniform1i(u.uTex, 0);
      gl.uniform2f(u.uIrisUV, a.x, a.y);
      gl.uniform2f(u.uIrisRUV, a.irisRadius / a.plateAspect, a.irisRadius);
      gl.uniform1f(u.uPupilK, a.pupilRadius / a.irisRadius);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // ── Pass 2: particles ──────────────────────────────────────────
    if (s.particles > 0.002) {
      gl.useProgram(this.particleProgram);
      gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE);
      const u = this.pu;
      gl.uniform2f(u.uRes, this.width, this.height);
      gl.uniform1f(u.uDpr, dpr);
      gl.uniform1f(u.uTime, timeSec);
      gl.uniform1f(u.uTravel, combined);
      gl.uniform1f(u.uSpeed, this.speed);
      gl.uniform2f(u.uPointer, this.pointer.x, this.pointer.y);
      gl.uniform2f(u.uIrisC, iris.x * dpr, iris.y * dpr);
      gl.uniform1f(u.uIrisR, iris.irisR * dpr);
      gl.uniform1f(u.uSuck, s.suck);
      gl.uniform1f(u.uWarm, s.warm);
      gl.uniform1f(u.uAlpha, s.particles);
      gl.uniform1f(u.uBurst, s.burst);
      // Streaks stay short during the approach; they open up once inside the tunnel.
      gl.uniform1f(u.uStreak, 0.18 + 0.82 * s.reveal);
      gl.bindVertexArray(this.vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.count);
      gl.bindVertexArray(null);
    }
  }

  /** Clear once (used when the scene deactivates so no stale frame lingers). */
  clear(): void {
    if (this.lost) return;
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  destroy(): void {
    const { gl } = this;
    this.canvas.removeEventListener('webglcontextlost', this.onLost);
    for (const b of this.buffers) gl.deleteBuffer(b);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.particleProgram);
    gl.deleteProgram(this.tunnelProgram);
    if (this.texture) gl.deleteTexture(this.texture);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
