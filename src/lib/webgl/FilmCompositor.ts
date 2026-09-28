/**
 * FilmCompositor — the drone footage, and its transformation into the Cosmic God.
 *
 * One full-screen pass over two neighbouring frames of the clip:
 *
 *   frames      blended by the exact scroll position, each warped part-way toward
 *               the other along the camera's own motion (zoom + shift measured
 *               offline) — a slow scroll glides between frames instead of
 *               cross-dissolving them
 *   grade       the brand's night grade: deep shadows, cool light
 *
 * and, scrubbed by scroll, the transformation — never a cut, a flash or a white
 * screen:
 *
 *   lights      the city's lights brighten and lose their edges (abstraction)
 *   fog         violet-blue atmosphere creeps in from the edges of the frame
 *   particles   tiny motes stream past the lens
 *   streaks     lights stretch into trails along the direction of travel
 *   dissolve    architecture breaks up into energy, from where we are heading outward
 *   energy      the frame becomes flowing cosmic energy — still moving forward
 *   form        the energy gathers into the silhouette of the being (its mask,
 *               mapped through the cosmic scene's camera)
 *   reveal      the energy becomes the being: transparent from the heart
 *               outward, a line of light at the front, the living render beneath
 *
 * Output is premultiplied: where the being has formed the canvas turns
 * transparent and the CosmicRenderer shows through.
 */
import { createProgram, getUniforms, loadTexture } from './glUtils';

const vertex = /* glsl */ `#version 300 es
const vec2 V[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() { gl_Position = vec4(V[gl_VertexID], 0.0, 1.0); }
`;

const fragment = (streakTaps: number) => /* glsl */ `#version 300 es
precision highp float;
#define STREAK_TAPS ${streakTaps}

uniform sampler2D uA;
uniform sampler2D uB;
uniform sampler2D uNoise;
uniform sampler2D uMask;
uniform vec3 uXA;         // frame A lookup: uv = uXA.x * q + uXA.yz
uniform vec3 uXB;         // frame B lookup
uniform float uMix;       // 0 = A … 1 = B
uniform vec4 uCover;      // screen uv → frame uv (cover fit): q = p * xy + zw
uniform vec2 uRes;        // canvas px
uniform float uAspect;    // viewport width / height
uniform vec2 uHeading;    // where the flight is heading (screen uv, y down)
uniform vec2 uHeadingQ;   // the same point in frame uv
uniform float uPush;      // the camera pushing on past the footage (1 = none)
uniform float uTime;
uniform float uTravel;    // forward travel, driven by scroll
uniform float uNight;     // brand grade strength
uniform float uLights;
uniform float uFog;
uniform float uParticles;
uniform float uStreak;
uniform float uDissolve;
uniform float uEnergy;
uniform float uForm;
uniform float uReveal;
uniform float uAlpha;
uniform float uPxScale;   // canvas px per CSS px
uniform vec2 uCosCenter;  // cosmic camera (CSS px): screen centre
uniform vec2 uCosFocus;   // plate uv at the centre
uniform vec2 uCosScale;   // plate size on screen
uniform vec2 uCosRot;     // cos, sin of its roll
uniform vec2 uCore;       // the heart (plate uv)
uniform float uPlateAspect;
out vec4 outColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return texture(uNoise, (i + f + 0.5) / 256.0).r;
}
float fbm(vec2 p) {
  return noise(p) * 0.5 + noise(p * 2.03 + 17.3) * 0.3 + noise(p * 4.07 + 31.1) * 0.2;
}

vec3 frameAt(vec2 q) {
  return mix(texture(uA, uXA.x * q + uXA.yz).rgb, texture(uB, uXB.x * q + uXB.yz).rgb, uMix);
}
vec3 frameLod(vec2 q, float lod) {
  return mix(textureLod(uA, uXA.x * q + uXA.yz, lod).rgb, textureLod(uB, uXB.x * q + uXB.yz, lod).rgb, uMix);
}

// Energy seen while moving forward: three copies of one field, each zooming past
// the camera and fading in and out in turn — endless forward motion, no seam.
// Mostly dark: thin electric filaments (the footage's own lightning, carried on),
// a soft halo around them and a little nebula.
vec3 energyField(vec2 d) {
  vec3 acc = vec3(0.0);
  for (int k = 0; k < 3; k++) {
    float ph = fract(uTravel * 0.22 + float(k) / 3.0);
    float w = sin(ph * 3.14159);
    vec2 s = d / exp2(ph * 3.0) * 6.2 + float(k) * 13.7;
    vec2 warp = vec2(noise(s * 0.5 + uTime * 0.05), noise(s * 0.5 + 4.3 - uTime * 0.04)) - 0.5;
    float n = fbm(s + warp * 2.2);
    float dn = abs(n - 0.5);
    // A crisp arc (about a pixel and a half wide at any scale) and its glow…
    float arc = 1.0 - smoothstep(0.0, 1.6, dn / (fwidth(n) + 1e-4));
    float halo = exp(-dn * 28.0);
    // …broken into segments that come and go, like the footage's lightning.
    float seg = smoothstep(0.38, 0.78, noise(s * 1.2 + 9.0 + uTime * 0.08));
    float neb = smoothstep(0.5, 0.95, noise(s * 0.3 + 5.1));
    vec3 tint = mix(vec3(0.3, 0.46, 1.0), vec3(0.58, 0.4, 1.0), neb);
    acc += w * (seg * (vec3(0.86, 0.9, 1.0) * arc * 1.25 + tint * halo * 0.3) + tint * neb * 0.06);
  }
  return acc * 0.78;
}

// Motes streaming past the lens, stretched along the direction of travel as speed builds.
float motes(vec2 d, float k) {
  float ph = fract(uTravel * 0.34 + k * 0.5);
  float w = sin(ph * 3.14159);
  vec2 s = d / exp2(ph * 2.5) * 20.0 + k * 7.1;
  vec2 cell = floor(s);
  float h = hash(cell + k * 3.7);
  if (h < 0.84) return 0.0;
  vec2 f = fract(s) - 0.5 - (vec2(hash(cell + 1.7), hash(cell + 5.3)) - 0.5) * 0.6;
  vec2 dir = normalize(d + 1e-4);
  float along = dot(f, dir);
  float across = dot(f, vec2(-dir.y, dir.x));
  float len = 0.045 + uStreak * 0.3;
  return exp(-(along * along) / (len * len) - (across * across) / 0.0016) * w * (0.4 + 0.6 * h);
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 p = px / uRes;
  // The camera pushes on toward the heading once the footage has taken us there.
  vec2 pp = uHeading + (p - uHeading) / uPush;
  vec2 q = pp * uCover.xy + uCover.zw;
  vec2 d = (p - uHeading) * vec2(uAspect, 1.0);
  float r = length(d);

  // ── The footage, graded (skipped entirely once the city has dissolved) ──
  bool city = uDissolve < 0.999;
  vec3 video = vec3(0.0);
  if (city) {
  vec3 sharp = frameAt(q);
  video = sharp;
  if (uLights > 0.001) video = mix(sharp, frameLod(q, 1.0 + uLights * 1.8), uLights * 0.75);
  float l = dot(video, vec3(0.2126, 0.7152, 0.0722));
  // Night grade: a touch less saturated, cooler, deeper shadows, calm highlights.
  vec3 night = mix(vec3(l), video, 0.9) * vec3(0.9, 0.94, 1.07);
  night = mix(night, night * night * (3.0 - 2.0 * night), 0.45) * 0.9;
  video = mix(video, night, uNight);

  // The lights take over: shadows sink into navy, lights brighten and bloom.
  if (uLights > 0.001) {
    vec3 bloom = max(frameLod(q, 4.0) - 0.3, 0.0);
    float shadow = 1.0 - smoothstep(0.22, 0.6, l);
    video *= 1.0 - uLights * 0.55 * shadow;
    video += max(video - 0.42, 0.0) * uLights * 2.4;
    video += bloom * vec3(0.7, 0.8, 1.0) * (0.3 + 1.6 * uLights);
    // The city's colour turns to the cosmos' (navy → electric blue → lavender white).
    vec3 cosmic = mix(vec3(0.02, 0.03, 0.1), vec3(0.3, 0.45, 1.0), smoothstep(0.05, 0.55, l));
    cosmic = mix(cosmic, vec3(0.85, 0.82, 1.0), smoothstep(0.55, 0.95, l));
    video = mix(video, cosmic * (0.5 + l), uLights * 0.55);
  }

  // Data trails: every light stretches away from where we are heading.
  if (uStreak > 0.001) {
    vec3 acc = vec3(0.0);
    float wsum = 0.0;
    for (int k = 1; k <= STREAK_TAPS; k++) {
      float t = float(k) / float(STREAK_TAPS);
      vec3 s = frameLod(mix(q, uHeadingQ, t * (0.06 + 0.32 * uStreak)), 2.0);
      float w = 1.0 - t;
      acc += max(s - 0.4, 0.0) * w;
      wsum += w;
    }
    video += acc / wsum * uStreak * 2.8 * vec3(0.72, 0.84, 1.0);
  }
  }

  // ── Energy ───────────────────────────────────────────────────────
  vec2 puv = vec2(-1.0);
  float body = 0.0;
  if (uForm > 0.001 || uReveal > 0.001) {
    vec2 dv = px / uPxScale - uCosCenter;
    vec2 rd = vec2(dv.x * uCosRot.x + dv.y * uCosRot.y, -dv.x * uCosRot.y + dv.y * uCosRot.x);
    puv = uCosFocus + rd / uCosScale;
    float inside = step(0.0, puv.x) * step(puv.x, 1.0) * step(0.0, puv.y) * step(puv.y, 1.0);
    body = textureLod(uMask, puv, 0.3).r * inside;
  }
  // The silhouette's edge — where the gathering energy draws the being's outline.
  float rim = smoothstep(0.12, 0.3, body) * (1.0 - smoothstep(0.34, 0.62, body));
  // The energy gathers into the being's silhouette.
  float gather = mix(1.0, 0.05 + 1.2 * body + 1.3 * rim, uForm);
  vec3 energy = uEnergy > 0.001 ? energyField(d) * uEnergy * gather : vec3(0.0);
  float mote = uParticles > 0.001 ? (motes(d, 0.0) + motes(d, 1.0)) * uParticles : 0.0;

  // Architecture dissolves into it — outward from the heading, along broken edges.
  vec3 col = video;
  if (uDissolve > 0.001) {
    float dn = fbm(p * vec2(uAspect, 1.0) * 3.0 + vec2(7.0, uTravel * 0.3));
    float field = r * 0.7 + dn * 0.85;
    float th = uDissolve * 1.85 - 0.12;
    float keep = smoothstep(th - 0.12, th + 0.03, field) * (1.0 - smoothstep(0.96, 0.999, uDissolve));
    float edge = exp(-pow((field - th + 0.04) / 0.05, 2.0)) * (1.0 - smoothstep(0.75, 1.0, uDissolve));
    // Where it dissolves the city first melts into its own light, which then sinks
    // into the dark of space as the energy takes over — never a hole.
    vec3 deep = vec3(0.008, 0.01, 0.034);
    if (city) {
      vec3 glowC = frameLod(q, 4.5);
      float gLum = dot(glowC, vec3(0.2126, 0.7152, 0.0722));
      vec3 melt = mix(vec3(gLum), glowC, 0.45) * vec3(0.95, 1.05, 1.75) + vec3(0.05, 0.04, 0.16);
      deep = mix(melt, deep, smoothstep(0.3, 0.95, uDissolve));
    }
    deep += energy;
    col = mix(deep, video + energy * 0.3, keep);
    col += vec3(0.5, 0.62, 1.0) * edge * 0.75;
  } else {
    col += energy * 0.3;
  }
  col += vec3(0.7, 0.8, 1.0) * mote * gather;
  // The silhouette is drawn in light as the energy gathers: a bright outline, a faint glow within.
  float shimmer = 0.6 + 0.4 * noise(puv * 40.0 + uTime * 0.6);
  col += vec3(0.45, 0.58, 1.0) * (rim * 0.4 + body * 0.08) * shimmer * uForm * (1.0 - uReveal);

  // ── Violet atmosphere at the edges of the frame ──────────────────
  vec2 c = (p - 0.5) * vec2(1.0, 1.15);
  float edgeD = length(c) * 1.65;
  float fn = fbm(p * vec2(uAspect, 1.0) * 2.1 + vec2(uTime * 0.018, -uTime * 0.011) - d * uTravel * 0.02);
  float fogD = smoothstep(0.5 - uFog * 0.38, 1.25, edgeD + (fn - 0.5) * 0.5) * (0.35 + 0.8 * fn) * uFog;
  vec3 fogC = mix(vec3(0.27, 0.15, 0.66), vec3(0.14, 0.22, 0.7), fbm(p * 1.3 + 9.0));
  col = col * (1.0 - fogD * 0.6) + fogC * fogD * 0.6;

  // ── The being forms: transparent from the heart outward ──────────
  float alpha = 1.0;
  vec3 light = vec3(0.0);
  if (uReveal > 0.001) {
    vec2 hq = (puv - uCore) * vec2(uPlateAspect, 1.0);
    float dh = length(hq) + (fbm(puv * 8.0 + uTime * 0.05) - 0.5) * 0.14;
    float front = uReveal * 1.1;
    float formed = 1.0 - smoothstep(front - 0.14, front, dh);
    float frontLight = exp(-pow((dh - front + 0.05) / 0.05, 2.0)) * (1.0 - smoothstep(0.85, 1.0, uReveal));
    float around = 1.0 - smoothstep(0.1, 0.95, uReveal);
    alpha = mix(around, 1.0 - formed, smoothstep(0.2, 0.7, body));
    light = vec3(0.5, 0.62, 1.0) * frontLight * body * 0.7;
  }
  alpha *= uAlpha;
  outColor = vec4(col * alpha + light * uAlpha, alpha);
}
`;

const UNIFORMS = [
  'uA',
  'uB',
  'uNoise',
  'uMask',
  'uXA',
  'uXB',
  'uMix',
  'uCover',
  'uRes',
  'uAspect',
  'uHeading',
  'uHeadingQ',
  'uPush',
  'uTime',
  'uTravel',
  'uNight',
  'uLights',
  'uFog',
  'uParticles',
  'uStreak',
  'uDissolve',
  'uEnergy',
  'uForm',
  'uReveal',
  'uAlpha',
  'uPxScale',
  'uCosCenter',
  'uCosFocus',
  'uCosScale',
  'uCosRot',
  'uCore',
  'uPlateAspect',
] as const;

/** A frame to sample: the image and how to look it up (uv = s·q + b, per axis). */
export interface FrameTap {
  index: number;
  image: ImageBitmap;
  s: number;
  bx: number;
  by: number;
}

/** The transformation's controls — tweened by the stage timeline. */
export interface FilmLook {
  push: number;
  night: number;
  lights: number;
  fog: number;
  particles: number;
  streak: number;
  dissolve: number;
  energy: number;
  form: number;
  reveal: number;
  alpha: number;
  travel: number;
}

/** The cosmic scene's camera, so the energy can find the being (CSS px). */
export interface CosmicMapping {
  centerX: number;
  centerY: number;
  focusX: number;
  focusY: number;
  plateW: number;
  plateH: number;
  rotation: number;
}

export interface FilmRenderInput {
  time: number;
  a: FrameTap;
  b: FrameTap;
  mix: number;
  look: FilmLook;
  /** Where the flight is heading: screen (CSS px). */
  heading: { x: number; y: number };
  cosmic: CosmicMapping | null;
}

export interface FilmCompositorOptions {
  maskUrl: string;
  core: { x: number; y: number };
  plateAspect: number;
  /** Canvas px per CSS px (already capped by the caller). */
  pixelRatio: number;
  /** Upper bound on canvas pixels (the footage is 720p — more is wasted fill). */
  maxPixels: number;
  streakTaps: number;
}

const CACHE = 4;

export class FilmCompositor {
  private readonly gl: WebGL2RenderingContext;
  private readonly canvas: HTMLCanvasElement;
  private readonly program: WebGLProgram;
  private readonly u: Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;
  private readonly opts: FilmCompositorOptions;
  private readonly noiseTex: WebGLTexture;
  private maskTex: WebGLTexture;
  /** Frame textures, most recently used last. */
  private readonly frames: { index: number; tex: WebGLTexture }[] = [];
  private frameSize = { width: 0, height: 0 };
  private cssW = 1;
  private cssH = 1;
  private scale = 1;
  private lost = false;

  constructor(canvas: HTMLCanvasElement, opts: FilmCompositorOptions) {
    this.canvas = canvas;
    this.opts = opts;
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    this.program = createProgram(gl, vertex, fragment(opts.streakTaps));
    this.u = getUniforms(gl, this.program, UNIFORMS);
    this.noiseTex = FilmCompositor.createNoise(gl);
    this.maskTex = FilmCompositor.createEmpty(gl);
    void loadTexture(gl, opts.maskUrl)
      .then((tex) => {
        if (this.lost) return;
        gl.deleteTexture(this.maskTex);
        this.maskTex = tex;
      })
      .catch(() => undefined); // without the mask the energy still clears — just not in the being's shape
    canvas.addEventListener('webglcontextlost', this.onLost, false);
  }

  private onLost = (e: Event) => {
    e.preventDefault();
    this.lost = true;
  };

  get usable(): boolean {
    return !this.lost;
  }

  private static createNoise(gl: WebGL2RenderingContext): WebGLTexture {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    let seed = 11;
    for (let i = 0; i < data.length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      data[i] = seed >>> 24;
    }
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    return tex;
  }

  private static createEmpty(gl: WebGL2RenderingContext): WebGLTexture {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255]),
    );
    return tex;
  }

  resize(cssW: number, cssH: number): void {
    this.cssW = Math.max(1, cssW);
    this.cssH = Math.max(1, cssH);
    const { pixelRatio, maxPixels } = this.opts;
    this.scale = Math.min(pixelRatio, Math.sqrt(maxPixels / (this.cssW * this.cssH)));
    const w = Math.max(1, Math.round(this.cssW * this.scale));
    const h = Math.max(1, Math.round(this.cssH * this.scale));
    if (w !== this.canvas.width || h !== this.canvas.height) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  /** The frame's texture — uploaded once, then reused while it stays in the small cache. */
  private texture(index: number, image: ImageBitmap): WebGLTexture {
    const { gl } = this;
    const hit = this.frames.findIndex((f) => f.index === index);
    if (hit >= 0) {
      const [entry] = this.frames.splice(hit, 1);
      this.frames.push(entry!);
      return entry!.tex;
    }
    const sameSize = image.width === this.frameSize.width && image.height === this.frameSize.height;
    if (!sameSize) {
      for (const f of this.frames) gl.deleteTexture(f.tex);
      this.frames.length = 0;
      this.frameSize = { width: image.width, height: image.height };
    }
    let tex: WebGLTexture;
    if (this.frames.length >= CACHE) {
      tex = this.frames.shift()!.tex;
      gl.bindTexture(gl.TEXTURE_2D, tex);
    } else {
      tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      const levels = Math.floor(Math.log2(Math.max(image.width, image.height))) + 1;
      gl.texStorage2D(gl.TEXTURE_2D, levels, gl.RGBA8, image.width, image.height);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    this.frames.push({ index, tex });
    return tex;
  }

  render(input: FilmRenderInput): void {
    if (this.lost) return;
    const { gl, u, opts } = this;
    const { look } = input;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const texA = this.texture(input.a.index, input.a.image);
    const texB = input.b.index === input.a.index ? texA : this.texture(input.b.index, input.b.image);

    // Cover fit of the frame into the viewport.
    const fw = this.frameSize.width;
    const fh = this.frameSize.height;
    const k = Math.max(this.cssW / fw, this.cssH / fh);
    const dw = fw * k;
    const dh = fh * k;
    const ox = (this.cssW - dw) / 2;
    const oy = (this.cssH - dh) / 2;
    const hx = input.heading.x / this.cssW;
    const hy = input.heading.y / this.cssH;

    gl.viewport(0, 0, w, h);
    gl.useProgram(this.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.uniform1i(u.uA, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texB);
    gl.uniform1i(u.uB, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTex);
    gl.uniform1i(u.uNoise, 2);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
    gl.uniform1i(u.uMask, 3);
    gl.activeTexture(gl.TEXTURE0);

    gl.uniform3f(u.uXA, input.a.s, input.a.bx, input.a.by);
    gl.uniform3f(u.uXB, input.b.s, input.b.bx, input.b.by);
    gl.uniform1f(u.uMix, input.mix);
    gl.uniform4f(u.uCover, this.cssW / dw, this.cssH / dh, -ox / dw, -oy / dh);
    gl.uniform2f(u.uRes, w, h);
    gl.uniform1f(u.uAspect, this.cssW / this.cssH);
    gl.uniform2f(u.uHeading, hx, hy);
    gl.uniform2f(u.uHeadingQ, (hx * this.cssW - ox) / dw, (hy * this.cssH - oy) / dh);
    gl.uniform1f(u.uPush, look.push);
    gl.uniform1f(u.uTime, input.time);
    gl.uniform1f(u.uTravel, look.travel);
    gl.uniform1f(u.uNight, look.night);
    gl.uniform1f(u.uLights, look.lights);
    gl.uniform1f(u.uFog, look.fog);
    gl.uniform1f(u.uParticles, look.particles);
    gl.uniform1f(u.uStreak, look.streak);
    gl.uniform1f(u.uDissolve, look.dissolve);
    gl.uniform1f(u.uEnergy, look.energy);
    gl.uniform1f(u.uForm, look.form);
    gl.uniform1f(u.uReveal, look.reveal);
    gl.uniform1f(u.uAlpha, look.alpha);
    gl.uniform1f(u.uPxScale, w / this.cssW);
    const c = input.cosmic;
    gl.uniform2f(u.uCosCenter, c?.centerX ?? 0, c?.centerY ?? 0);
    gl.uniform2f(u.uCosFocus, c?.focusX ?? 0.5, c?.focusY ?? 0.5);
    gl.uniform2f(u.uCosScale, c?.plateW ?? 1, c?.plateH ?? 1);
    gl.uniform2f(u.uCosRot, Math.cos(c?.rotation ?? 0), Math.sin(c?.rotation ?? 0));
    gl.uniform2f(u.uCore, opts.core.x, opts.core.y);
    gl.uniform1f(u.uPlateAspect, opts.plateAspect);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  clear(): void {
    if (this.lost) return;
    const { gl } = this;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  destroy(): void {
    const { gl } = this;
    this.canvas.removeEventListener('webglcontextlost', this.onLost);
    for (const f of this.frames) gl.deleteTexture(f.tex);
    this.frames.length = 0;
    gl.deleteTexture(this.noiseTex);
    gl.deleteTexture(this.maskTex);
    gl.deleteProgram(this.program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
