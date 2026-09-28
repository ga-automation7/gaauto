/**
 * BlackHoleRenderer — a Schwarzschild black hole, ray-traced live.
 *
 * Every pixel's ray is integrated through the hole's gravity using the photon
 * orbit equation (a = −1.5·h²·r̂/r⁴, units of the Schwarzschild radius), so
 * light genuinely bends: the far side of the accretion disk arches over the
 * shadow, a thin photon ring hugs the horizon, and the stars behind are lensed.
 *
 *   disk    hot white-lavender at the inner edge, cooling through violet to
 *           deep purple; Keplerian shear (inner orbits turn faster) swirls its
 *           streaks; Doppler beaming brightens the side coming toward us
 *   glow    volumetric violet light gathered along each ray near the disk and
 *           the photon sphere — the radiance that pours off it
 *   sky     lensed stars and a faint purple nebula; black where rays fall in
 *
 * One full-screen pass. Resolution adapts to hold the frame rate.
 */
import { getUniforms, type UniformMap } from './glUtils';

const vertex = /* glsl */ `#version 300 es
const vec2 V[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() { gl_Position = vec4(V[gl_VertexID], 0.0, 1.0); }
`;

const fragment = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos;
uniform mat3 uCamBasis;  // columns: right, up, forward
uniform float uFov;      // tan(fov / 2)
uniform float uFlare;    // 0 → 1: the disk flares
uniform int uSteps;
out vec4 outColor;

const float R_IN = 2.6;   // inner edge of the disk (the last stable orbit is at 3)
const float R_OUT = 12.0;

float hash3(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash2(i), b = hash2(i + vec2(1.0, 0.0)), c = hash2(i + vec2(0.0, 1.0)), d = hash2(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise2(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

vec3 sky(vec3 d) {
  vec3 col = vec3(0.0);
  for (int k = 0; k < 2; k++) {
    float scale = k == 0 ? 80.0 : 190.0;
    vec3 p = d * scale;
    vec3 cell = floor(p);
    float h = hash3(cell);
    if (h > (k == 0 ? 0.982 : 0.99)) {
      vec3 c = cell + 0.5 + (vec3(hash3(cell + 1.3), hash3(cell + 2.7), hash3(cell + 4.1)) - 0.5) * 0.6;
      float b = smoothstep(0.5, 0.0, length(p - c)) * (0.35 + 0.65 * hash3(cell + 7.7));
      float tw = 0.7 + 0.3 * sin(uTime * (0.8 + h * 3.0) + h * 40.0);
      col += mix(vec3(0.72, 0.76, 1.0), vec3(1.0, 0.9, 1.0), hash3(cell + 3.3)) * b * tw;
    }
  }
  float n = fbm(vec2(atan(d.z, d.x) * 1.6, d.y * 2.6) + 7.0);
  col += vec3(0.2, 0.08, 0.36) * smoothstep(0.45, 0.95, n) * 0.55;
  return col;
}

// Emission of the disk where the ray crosses it (premultiplied rgb, alpha).
vec4 disk(vec3 hit, vec3 rayDir) {
  float r = length(hit.xz);
  float phi = atan(hit.z, hit.x);
  float lr = log(r);
  float swirl = phi + uTime * 2.4 / pow(r, 1.5);
  float n = fbm(vec2(swirl * 2.6, lr * 5.0 - uTime * 0.04));
  float streaks = 0.5 + 0.5 * fbm(vec2(swirl * 8.0 + lr * 3.0, lr * 24.0));
  float temp = pow(R_IN / r, 1.5) * smoothstep(R_IN, R_IN + 0.4, r) * (1.0 - smoothstep(R_OUT * 0.62, R_OUT, r));
  vec3 vel = vec3(-sin(phi), 0.0, cos(phi));
  float v = clamp(0.6 / sqrt(max(r - 1.0, 0.25)), 0.0, 0.68);
  float beam = pow(max(1.0 + v * dot(vel, -rayDir), 0.05), 3.0);
  float intensity = temp * (0.3 + 1.0 * n * streaks) * beam * (1.0 + uFlare * 1.6);
  vec3 cool = vec3(0.34, 0.14, 0.86);
  vec3 warm = vec3(0.76, 0.44, 1.0);
  vec3 hot = vec3(1.0, 0.95, 1.0);
  vec3 c = mix(cool, warm, smoothstep(0.06, 0.45, temp));
  c = mix(c, hot, smoothstep(0.5, 1.3, temp * beam));
  float a = clamp(intensity * 1.5, 0.0, 0.95);
  return vec4(c * intensity * 2.4, a);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 dir = normalize(uCamBasis * vec3(uv * uFov * 2.0, 1.0));
  vec3 pos = uCamPos;
  float h2 = dot(cross(pos, dir), cross(pos, dir));
  vec3 col = vec3(0.0);
  float alpha = 0.0;
  float glow = 0.0;
  bool captured = false;

  for (int i = 0; i < 220; i++) {
    if (i >= uSteps) break;
    float r2 = dot(pos, pos);
    float r = sqrt(r2);
    float dt = clamp(r * 0.055, 0.02, 0.9);
    vec3 prev = pos;
    dir += -1.5 * h2 * pos / (r2 * r2 * r) * dt;
    pos += dir * dt;

    // Light gathered on the way: the disk's haze and the photon sphere.
    float pr = length(pos.xz);
    glow += exp(-abs(pos.y) * 2.0) * smoothstep(R_OUT * 1.9, R_IN, pr) * dt * 0.045;
    glow += exp(-abs(r - 1.55) * 7.0) * dt * 0.05;

    if (prev.y * pos.y < 0.0) {
      vec3 hit = mix(prev, pos, prev.y / (prev.y - pos.y));
      float hr = length(hit.xz);
      if (hr > R_IN && hr < R_OUT) {
        vec4 d = disk(hit, normalize(dir));
        col += (1.0 - alpha) * d.rgb;
        alpha += (1.0 - alpha) * d.a;
        if (alpha > 0.97) break;
      }
    }
    if (r < 1.0) {
      captured = true;
      break;
    }
    if (r > 90.0) break;
  }

  if (!captured) col += (1.0 - alpha) * sky(normalize(dir));
  col += vec3(0.56, 0.3, 1.0) * glow * (1.0 + uFlare * 1.2);
  col = 1.0 - exp(-col * 1.3);
  outColor = vec4(pow(col, vec3(0.94)), 1.0);
}
`;

const UNIFORMS = ['uRes', 'uTime', 'uCamPos', 'uCamBasis', 'uFov', 'uFlare', 'uSteps'] as const;

export interface BlackHoleView {
  /** Camera orbit around the hole (radians) and distance (Schwarzschild radii). */
  azimuth: number;
  elevation: number;
  distance: number;
  /** Vertical field of view, degrees. */
  fov: number;
  flare: number;
}

export interface BlackHoleOptions {
  dpr: number;
  /** Largest render scale (fraction of CSS size × dpr); adaptive below this. */
  maxScale: number;
  steps: number;
}

export class BlackHoleRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly canvas: HTMLCanvasElement;
  private readonly program: WebGLProgram;
  private u: UniformMap<(typeof UNIFORMS)[number]> | null = null;
  /** Parallel compile: the shader builds off the main thread; poll until it is done. */
  private readonly parallel: { COMPLETION_STATUS_KHR: number } | null;
  private shaders: WebGLShader[] = [];
  private failed = false;
  private readonly opts: BlackHoleOptions;
  private cssW = 1;
  private cssH = 1;
  private scale: number;
  private slow = 0;
  private fast = 0;

  constructor(canvas: HTMLCanvasElement, opts: BlackHoleOptions) {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    this.canvas = canvas;
    this.opts = opts;
    this.scale = opts.maxScale;
    this.parallel = gl.getExtension('KHR_parallel_shader_compile');
    // Compile and link without asking for the result: asking blocks until the
    // (heavy) ray tracer is compiled. With the parallel-compile extension the
    // driver builds it in the background and `ready` polls for completion.
    const program = gl.createProgram();
    if (!program) throw new Error('Unable to create program');
    for (const [type, source] of [
      [gl.VERTEX_SHADER, vertex],
      [gl.FRAGMENT_SHADER, fragment],
    ] as const) {
      const sh = gl.createShader(type);
      if (!sh) throw new Error('Unable to create shader');
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      gl.attachShader(program, sh);
      this.shaders.push(sh);
    }
    gl.linkProgram(program);
    this.program = program;
  }

  /** True once the shader is compiled and linked (never blocks when the driver compiles in parallel). */
  get ready(): boolean {
    if (this.u) return true;
    if (this.failed) return false;
    const { gl } = this;
    if (this.parallel && !gl.getProgramParameter(this.program, this.parallel.COMPLETION_STATUS_KHR)) return false;
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      this.failed = true;
      const log = this.shaders.map((s) => gl.getShaderInfoLog(s)).join(' ') || gl.getProgramInfoLog(this.program);
      throw new Error(`Black hole shader failed: ${log ?? 'unknown'}`);
    }
    this.shaders.forEach((s) => gl.deleteShader(s));
    this.shaders = [];
    this.u = getUniforms(gl, this.program, UNIFORMS);
    return true;
  }

  resize(cssW: number, cssH: number): void {
    this.cssW = Math.max(1, cssW);
    this.cssH = Math.max(1, cssH);
    this.applySize();
  }

  private applySize(): void {
    const k = this.opts.dpr * this.scale;
    const w = Math.max(1, Math.round(this.cssW * k));
    const h = Math.max(1, Math.round(this.cssH * k));
    if (w !== this.canvas.width || h !== this.canvas.height) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  /** Hold the frame rate: shed resolution when frames run long, win it back when there is room. */
  private adapt(dt: number): void {
    if (dt <= 0) return;
    if (dt > 0.024) this.slow++;
    else if (dt < 0.0155) this.fast++;
    if (this.slow > 20) {
      this.scale = Math.max(0.32, this.scale * 0.86);
      this.slow = this.fast = 0;
      this.applySize();
    } else if (this.fast > 120 && this.scale < this.opts.maxScale) {
      this.scale = Math.min(this.opts.maxScale, this.scale * 1.08);
      this.slow = this.fast = 0;
      this.applySize();
    }
  }

  render(time: number, dt: number, view: BlackHoleView): void {
    if (!this.ready) return;
    this.adapt(dt);
    const { gl } = this;
    const u = this.u!;
    const ce = Math.cos(view.elevation);
    const pos: [number, number, number] = [
      view.distance * ce * Math.sin(view.azimuth),
      view.distance * Math.sin(view.elevation),
      view.distance * ce * Math.cos(view.azimuth),
    ];
    // Look at the hole: forward, right, up.
    const f = normalize([-pos[0], -pos[1], -pos[2]]);
    const r = normalize(cross(f, [0, 1, 0]));
    const up = cross(r, f);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uTime, time);
    gl.uniform3f(u.uCamPos, pos[0], pos[1], pos[2]);
    gl.uniformMatrix3fv(u.uCamBasis, false, [...r, ...up, ...f]);
    gl.uniform1f(u.uFov, Math.tan(((view.fov * Math.PI) / 180) / 2));
    gl.uniform1f(u.uFlare, view.flare);
    gl.uniform1i(u.uSteps, this.opts.steps);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy(): void {
    this.gl.deleteProgram(this.program);
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

type Vec3 = [number, number, number];
function normalize(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
