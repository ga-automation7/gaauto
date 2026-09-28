/**
 * CosmicRenderer — the cosmic intelligence as a living, looping cinemagraph.
 *
 * The painted plate is drawn through the same SceneCamera maths as the DOM
 * overlays (so halos, traces and panels stay locked to it), and brought to life
 * in a single full-screen pass:
 *
 *   heart      a calm lub-dub of blue-white light inside the chest
 *   veins      each beat sends a front of energy out through torso, shoulders, arms
 *   breath     the torso inflates around the chest; the chest rises
 *   drift      robe and hair ripple in a slow cosmic wind
 *   emission   strands of light stream outward from the hair; motes are born at
 *              the silhouette and drift away — the energy comes FROM the being
 *   eyes       precise burning cores, a breath of atmosphere, a calm awareness;
 *              the face itself stays in shadow
 *   sky        stars twinkle, nebula drifts through the dark, god-rays turn
 *
 * A soft figure mask (a second, tiny texture) keeps energy on the body and
 * places emission at its edge. Particles are medium-scale and sparse by design:
 * readable shapes, never grain. Everything loops on time; scroll only moves the
 * camera and the intensities.
 */
import { createProgram, getUniforms, loadTextureInfo, type UniformMap } from './glUtils';

const vertex = /* glsl */ `#version 300 es
const vec2 V[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() { gl_Position = vec4(V[gl_VertexID], 0.0, 1.0); }
`;

const fragment = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform sampler2D uNoise;  // 256² random texture — cheap value noise (1 tap per octave)
uniform vec2  uRes;
uniform vec2  uCenter;     // screen centre (canvas px)
uniform vec2  uFocus;      // plate uv shown at the centre
uniform vec2  uScale;      // plate size on screen (canvas px)
uniform vec2  uRot;        // cos, sin of camera roll
uniform float uAspect;     // plate width / height
uniform float uTime;
uniform float uBreath;     // 0 → 1 → 0, one breath
uniform float uLife;       // ambient effects master
uniform float uEyes;
uniform vec2  uCore;
uniform vec2  uHead;
uniform vec2  uEyeL;
uniform vec2  uEyeR;
uniform vec2  uTexSize;    // texture pixels (for bicubic magnification)
uniform float uZoom;       // camera zoom (atmosphere thins as we move inside it)
uniform float uGlow;       // 1 = resting; above 1 the being blazes (the reveal)
uniform sampler2D uMask;   // soft figure mask: 1 = the being (head, torso, robe, arms, held objects)
uniform float uPulse;      // heartbeat envelope (lub-dub)
uniform float uWave;       // seconds since the last beat: the energy front travelling outward
out vec4 outColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// Smooth value noise from the noise texture: one tap, quintic-free but smooth enough.
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return texture(uNoise, (i + f + 0.5) / 256.0).r;
}
float fbm3(vec2 p) {
  return noise(p) * 0.57 + noise(p * 2.03 + 7.3) * 0.29 + noise(p * 4.1 + 13.1) * 0.14;
}

// Catmull-Rom bicubic in 9 bilinear taps — crisp magnification without blockiness.
// The heart — a procedural energy core drawn analytically, so it is razor sharp at
// any zoom (no texture). q is the offset from the core in plate-height units,
// px one screen pixel in the same units (for antialiased hairlines).
vec3 heartCore(vec2 q, float r, float px) {
  float beat = uPulse;
  float ang = atan(q.y, q.x);
  vec3 c = vec3(0.0);
  // White-hot centre, its blue-white core, and a wide electric corona.
  c += vec3(1.0) * exp(-(r * r) / (0.0058 * 0.0058)) * (0.95 + 0.55 * beat);
  c += vec3(0.74, 0.85, 1.0) * exp(-r / 0.012) * (0.6 + 0.5 * beat);
  c += vec3(0.38, 0.52, 1.0) * exp(-r / 0.05) * (0.34 + 0.34 * beat);
  // Anamorphic star: a long horizontal streak, a shorter vertical one.
  c += vec3(0.64, 0.78, 1.0) * exp(-abs(q.y) / (0.0013 + px)) * exp(-abs(q.x) / 0.12) * (0.38 + 0.4 * beat);
  c += vec3(0.64, 0.78, 1.0) * exp(-abs(q.x) / (0.0013 + px)) * exp(-abs(q.y) / 0.055) * (0.24 + 0.26 * beat);
  // Three hairline rings turning at their own speeds; the inner two broken into arcs.
  float grow = 1.0 + 0.05 * beat;
  float w = px * 1.4;
  float r1 = 1.0 - smoothstep(0.0, w, abs(r - 0.021 * grow));
  float r2 = 1.0 - smoothstep(0.0, w, abs(r - 0.033 * grow));
  float r3 = 1.0 - smoothstep(0.0, w, abs(r - 0.047 * grow));
  float arc1 = smoothstep(0.3, 0.42, fract(ang / 6.2832 * 3.0 + uTime * 0.05));
  float arc2 = smoothstep(0.18, 0.3, fract(ang / 6.2832 * 8.0 - uTime * 0.035));
  c += vec3(0.72, 0.82, 1.0) * (r1 * arc1 * 0.95 + r2 * arc2 * 0.62 + r3 * 0.34);
  return c;
}

vec3 sampleBicubic(vec2 uv) {
  vec2 samplePos = uv * uTexSize;
  vec2 tp1 = floor(samplePos - 0.5) + 0.5;
  vec2 f = samplePos - tp1;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  vec2 w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2;
  vec2 tp0 = (tp1 - 1.0) / uTexSize;
  vec2 tp3 = (tp1 + 2.0) / uTexSize;
  vec2 tp12 = (tp1 + w2 / w12) / uTexSize;
  vec3 c = vec3(0.0);
  c += texture(uTex, vec2(tp0.x, tp0.y)).rgb * w0.x * w0.y;
  c += texture(uTex, vec2(tp12.x, tp0.y)).rgb * w12.x * w0.y;
  c += texture(uTex, vec2(tp3.x, tp0.y)).rgb * w3.x * w0.y;
  c += texture(uTex, vec2(tp0.x, tp12.y)).rgb * w0.x * w12.y;
  c += texture(uTex, vec2(tp12.x, tp12.y)).rgb * w12.x * w12.y;
  c += texture(uTex, vec2(tp3.x, tp12.y)).rgb * w3.x * w12.y;
  c += texture(uTex, vec2(tp0.x, tp3.y)).rgb * w0.x * w3.y;
  c += texture(uTex, vec2(tp12.x, tp3.y)).rgb * w12.x * w3.y;
  c += texture(uTex, vec2(tp3.x, tp3.y)).rgb * w3.x * w3.y;
  return max(c, 0.0);
}

// Drifting motes: one soft point per grid cell, rising slowly and twinkling.
float motes(vec2 uv, float scale, float speed, float seed) {
  vec2 p = uv * vec2(uAspect, 1.0) * scale;
  p.y += uTime * speed;
  p.x += sin(uTime * 0.07 + seed) * 0.6;
  vec2 cell = floor(p);
  float h = hash(cell + seed);
  if (h < 0.72) return 0.0;
  vec2 off = vec2(hash(cell + seed + 1.3), hash(cell + seed + 7.1)) - 0.5;
  float d = length(fract(p) - 0.5 - off * 0.7);
  float tw = 0.45 + 0.55 * sin(uTime * (0.8 + h * 2.5) + h * 30.0);
  // Medium-scale soft points (readable shapes, never grain).
  return smoothstep(0.07 + h * 0.08, 0.0, d) * tw;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 dv = px - uCenter;
  vec2 rd = vec2(dv.x * uRot.x + dv.y * uRot.y, -dv.x * uRot.y + dv.y * uRot.x);
  vec2 uv = uFocus + rd / uScale;
  vec2 A = vec2(uAspect, 1.0);
  vec2 q0 = (uv - uCore) * A;
  float r = length(q0);
  float pixel = fwidth(r); // one screen pixel in plate units (antialiased hairlines)

  // ── Breath: inflate the torso around the heart, lift the chest. The head stays
  //    perfectly still so the burning eyes remain locked to the painted ones. ──
  float belowHead = smoothstep(uHead.y + 0.07, uHead.y + 0.13, uv.y);
  float torso = smoothstep(0.36, 0.0, r) * belowHead;
  vec2 suv = uCore + (uv - uCore) * (1.0 - uBreath * 0.017 * torso);
  suv.y += uBreath * 0.004 * smoothstep(0.42, 0.05, r) * belowHead;

  // ── Cosmic wind (only where it can be seen: robe and hair) ──
  float robe = smoothstep(0.5, 0.68, uv.y) * smoothstep(0.46, 0.14, abs(uv.x - 0.5));
  float hr = length((uv - uHead) * A);
  float hair = smoothstep(0.05, 0.09, hr) * smoothstep(0.2, 0.1, hr);
  float windAmt = (robe * 0.014 + hair * 0.007) * uLife;
  if (windAmt > 0.0005) {
    vec2 wind = vec2(fbm3(uv * 6.0 + vec2(uTime * 0.22, 0.0)), fbm3(uv * 6.0 + vec2(4.7, uTime * 0.18))) - 0.5;
    suv += wind * windAmt;
  }

  // Magnified: bicubic (crisp). Otherwise: mipmapped bilinear.
  vec3 col = uScale.y > uTexSize.y * 1.05 ? sampleBicubic(suv) : texture(uTex, suv).rgb;
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  float dark = 1.0 - smoothstep(0.06, 0.32, luma);
  float body = texture(uMask, suv).r;

  // Soft silhouette of the figure (head → robe): atmosphere stays around and behind it.
  float by = clamp(uv.y, uHead.y - 0.03, 0.95);
  float bodyR = mix(0.05, 0.17, smoothstep(uHead.y, 0.92, by));
  float bodyD = length(vec2((uv.x - uCore.x) * uAspect, uv.y - by));
  float figure = (1.0 - smoothstep(bodyR - 0.01, bodyR + 0.05, bodyD)) * step(uHead.y - 0.08, uv.y);
  float outside = 1.0 - figure;
  float zoomFade = 1.0 / (1.0 + max(uZoom - 1.0, 0.0) * 0.9);

  // ── Veins: every heartbeat sends a front of energy out through the body ──
  //    (a faint ever-present flow underneath, the beat's front riding over it)
  float vein = smoothstep(0.18, 0.5, col.b - col.r * 0.55) * smoothstep(0.18, 0.5, luma) * smoothstep(0.2, 0.7, body);
  float front = exp(-pow((r - uWave * 0.42) * 9.0, 2.0)) * exp(-uWave * 1.3);
  float flow = pow(0.5 + 0.5 * sin(r * 30.0 - uTime * 1.5), 6.0) * 0.28;
  col += col * vein * (flow + front * 1.7) * uLife;

  // ── Stars twinkle: only point-like highlights (skipped for most pixels) ──
  if (luma > 0.3 && torso < 0.99) {
    vec2 texel = 2.5 / vec2(1672.0, 940.0);
    float neighbours = dot(
      texture(uTex, suv + vec2(texel.x, 0.0)).rgb + texture(uTex, suv - vec2(texel.x, 0.0)).rgb +
      texture(uTex, suv + vec2(0.0, texel.y)).rgb + texture(uTex, suv - vec2(0.0, texel.y)).rgb,
      vec3(0.299, 0.587, 0.114)) * 0.25;
    float speck = smoothstep(0.12, 0.35, luma - neighbours) * (1.0 - torso);
    float hs = hash(floor(suv * vec2(1672.0, 940.0)));
    col *= 1.0 + speck * sin(uTime * (1.5 + hs * 3.5) + hs * 40.0) * 0.6 * uLife;
  }

  // ── Nebula + rolling fog banks (background only) ──
  float atmos = dark * outside * (1.0 - body * 0.75) * uLife;
  float low = smoothstep(0.42, 1.0, uv.y);
  if (atmos > 0.01 || low > 0.01) {
    float n = fbm3(uv * 2.6 + vec2(uTime * 0.014, -uTime * 0.009));
    float n2 = fbm3(uv * 5.3 - vec2(uTime * 0.02, uTime * 0.006));
    vec3 neb = mix(vec3(0.2, 0.12, 0.5), vec3(0.1, 0.24, 0.62), n2);
    col += neb * smoothstep(0.38, 0.82, n * 0.75 + n2 * 0.35) * atmos * 0.5;
    float bank = fbm3(uv * vec2(1.3, 2.6) + vec2(uTime * 0.018, uTime * 0.004));
    col += mix(vec3(0.18, 0.14, 0.46), vec3(0.14, 0.24, 0.6), bank) * smoothstep(0.35, 0.85, bank) * low * (0.35 + 0.65 * outside) * 0.42 * uLife;
  }

  // ── Motes drifting upward through the scene (two depths) ──
  float m = motes(uv, 26.0, 0.018, 3.0) * 0.8 + motes(uv, 11.0, 0.03, 9.0);
  col += vec3(0.62, 0.7, 1.0) * m * (0.45 + dark * 0.55) * uLife;

  // ── God-rays behind the head (dark field only, never over the head) ──
  vec2 hd = (uv - uHead) * A;
  float hlen = length(hd);
  if (hlen > 0.07) {
    float ang = atan(hd.y, hd.x);
    float rays = pow(0.5 + 0.5 * sin(ang * 26.0 + uTime * 0.09), 12.0);
    rays += pow(0.5 + 0.5 * sin(ang * 11.0 - uTime * 0.05), 16.0) * 0.6;
    col += vec3(0.46, 0.52, 1.0) * rays * exp(-hlen * 3.0) * dark * smoothstep(0.075, 0.13, hlen) * 0.62 * uLife * uGlow;
  }

  // ── The hair's energy: strands of light streaming outward from the head, as if
  //    blown by an invisible cosmic force (a slow sway, never a burst) ──
  if (hlen > 0.06 && hlen < 0.27 && uv.y < uHead.y + 0.12) {
    float sway = sin(uTime * 0.31 + hlen * 9.0) * 0.06;
    vec2 pol = vec2((atan(hd.y, hd.x) + sway) * 7.64, hlen * 34.0 - uTime * 0.5);
    vec2 cell = floor(pol);
    float h = hash(cell + 21.0);
    if (h > 0.8) {
      vec2 f = fract(pol) - vec2(0.5, 0.5 + (hash(cell + 3.1) - 0.5) * 0.5);
      float strand = smoothstep(0.2, 0.0, abs(f.x)) * smoothstep(0.5, 0.05, abs(f.y));
      float fade = smoothstep(0.06, 0.1, hlen) * smoothstep(0.27, 0.15, hlen);
      col += vec3(0.6, 0.72, 1.0) * strand * fade * (1.0 - body * 0.6) * 0.5 * uLife;
    }
  }

  // ── Aura: a breathing corona around the silhouette, thinning as we move inside it ──
  // A wide, breathing corona around the being…
  float corona = smoothstep(0.06, 0.26, r) * exp(-max(r - 0.27, 0.0) * 2.8);
  col += vec3(0.36, 0.32, 1.0) * corona * outside * (0.8 + 0.35 * uBreath) * zoomFade * uLife * uGlow;
  // …and an aura hugging the whole silhouette — arms, hands, robe — breathing with it.
  float auraBand = smoothstep(0.02, 0.42, body) * (1.0 - smoothstep(0.55, 0.95, body));
  // (in the dark space around the figure only — never stacked on its bright parts)
  col += vec3(0.3, 0.42, 1.0) * auraBand * dark * (0.24 + 0.12 * uBreath + 0.08 * uPulse) * uLife * uGlow;
  float rim = (1.0 - smoothstep(0.0, 0.05, abs(bodyD - bodyR - 0.02))) * step(uHead.y, uv.y);
  col += vec3(0.45, 0.48, 1.0) * rim * (0.18 + 0.12 * uBreath) * zoomFade * uLife * uGlow;
  // The heart: the painted jewel steps back and a procedural core beats in its place.
  if (r < 0.2) {
    col *= mix(0.3, 1.0, smoothstep(0.018, 0.06, r));
    col += heartCore(q0, r, pixel) * uLife * uGlow;
  }
  col += vec3(0.46, 0.56, 1.0) * exp(-r * 9.0) * 0.14 * uPulse * smoothstep(0.2, 0.8, body) * uLife;

  // ── Energy leaving the body: motes born at the silhouette, drifting outward ──
  float band = smoothstep(0.04, 0.3, body) * (1.0 - smoothstep(0.5, 0.9, body));
  if (band > 0.01) {
    vec2 q = (uv - uCore) * A;
    vec2 pol2 = vec2(atan(q.y, q.x) * 14.0, r * 46.0 - uTime * 0.32);
    vec2 c2 = floor(pol2);
    float h2 = hash(c2 + 11.0);
    if (h2 > 0.86) {
      vec2 f2 = fract(pol2) - 0.5;
      float mote = smoothstep(0.3, 0.0, length(f2 * vec2(1.0, 1.4)));
      float tw = 0.6 + 0.4 * sin(uTime * (1.2 + h2 * 2.0) + h2 * 20.0);
      col += vec3(0.6, 0.72, 1.0) * mote * tw * band * 0.5 * uLife;
    }
  }
  // Revealed from the light: a broad radiance around the heart that settles as uGlow returns to 1.
  col += vec3(0.55, 0.62, 1.0) * exp(-r * 4.5) * max(uGlow - 1.0, 0.0) * 0.32;

  // ── Eyes: tight burning cores sized to the painted slits, soft glow, thin flare ──
  vec2 eL = (uv - uEyeL) * A;
  vec2 eR = (uv - uEyeR) * A;
  vec2 sq = vec2(1.0 / (0.0056 * 0.0056), 1.0 / (0.0026 * 0.0026));
  float eyeCore = exp(-dot(eL * eL, sq)) + exp(-dot(eR * eR, sq));
  float eyeGlow = exp(-dot(eL, eL) / 0.00018) + exp(-dot(eR, eR) / 0.00018);
  float flare = exp(-abs(eL.y) / 0.0009) * exp(-abs(eL.x) / 0.06) + exp(-abs(eR.y) / 0.0009) * exp(-abs(eR.x) / 0.06);
  // The face stays in shadow — mysterious, dimensional — so the eyes carry it.
  vec2 fq = (uv - vec2(uHead.x, uHead.y + 0.035)) * A * vec2(1.0 / 0.032, 1.0 / 0.055);
  col *= 1.0 - 0.22 * exp(-dot(fq, fq));
  // Conscious, aware, calm: a slow breath of intensity, never a flicker.
  float aware = 0.9 + 0.1 * sin(uTime * 0.6);
  float mist = exp(-dot(eL, eL) / 0.0011) + exp(-dot(eR, eR) / 0.0011);
  col += vec3(0.8, 0.93, 1.0) * (eyeCore * 1.5 + eyeGlow * 0.28 + flare * 0.22) * uEyes * aware;
  col += vec3(0.42, 0.55, 1.0) * mist * 0.08 * uEyes;

  // Highlights bloom: veins, held objects and eyes glow rather than merely shine.
  col += max(col - vec3(0.62), 0.0) * 0.35 * uLife;

  // Outside the plate: the void. (The camera always covers the frame, so this is never seen.)
  col *= step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  outColor = vec4(col, 1.0);
}
`;

/** Seconds per heartbeat. */
const HEARTBEAT = 1.8;

const UNIFORMS = [
  'uTex',
  'uRes',
  'uCenter',
  'uFocus',
  'uScale',
  'uRot',
  'uAspect',
  'uTime',
  'uBreath',
  'uLife',
  'uEyes',
  'uCore',
  'uHead',
  'uEyeL',
  'uEyeR',
  'uTexSize',
  'uZoom',
  'uNoise',
  'uGlow',
  'uMask',
  'uPulse',
  'uWave',
] as const;

export interface CosmicFrame {
  /** Camera mapping, CSS px. */
  centerX: number;
  centerY: number;
  focusX: number;
  focusY: number;
  plateW: number;
  plateH: number;
  rotation: number;
  breath: number;
  life: number;
  eyes: number;
  zoom: number;
  /** 1 = resting glow; higher while the being is revealed out of the light. */
  glow: number;
}

export interface CosmicAnchorsGL {
  core: { x: number; y: number };
  head: { x: number; y: number };
  eyes: [{ x: number; y: number }, { x: number; y: number }];
  aspect: number;
}

export class CosmicRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly canvas: HTMLCanvasElement;
  private readonly program: WebGLProgram;
  private readonly u: UniformMap<(typeof UNIFORMS)[number]>;
  private readonly anchors: CosmicAnchorsGL;
  private readonly dpr: number;
  private texture: WebGLTexture | null = null;
  private readonly noiseTex: WebGLTexture;
  /** Figure mask; a 1×1 empty mask until the real one arrives. */
  private maskTex: WebGLTexture;
  private texSize = { width: 1672, height: 940 };
  private width = 1;
  private height = 1;
  private scale = 1;
  private lost = false;
  onReady: (() => void) | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    textureUrl: string,
    anchors: CosmicAnchorsGL,
    dpr: number,
    maskUrl?: string,
  ) {
    this.canvas = canvas;
    this.anchors = anchors;
    this.dpr = dpr;
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    this.program = createProgram(gl, vertex, fragment);
    this.u = getUniforms(gl, this.program, UNIFORMS);
    this.noiseTex = CosmicRenderer.createNoise(gl);
    this.maskTex = CosmicRenderer.createEmpty(gl);
    if (maskUrl) {
      void loadTextureInfo(gl, maskUrl)
        .then(({ texture }) => {
          if (this.lost) return;
          gl.deleteTexture(this.maskTex);
          this.maskTex = texture;
        })
        .catch(() => undefined); // no mask: the being still lives, just without edge emission
    }
    canvas.addEventListener('webglcontextlost', this.onLost, false);
    void loadTextureInfo(gl, textureUrl).then(({ texture, width, height }) => {
      this.texture = texture;
      this.texSize = { width, height };
      this.onReady?.();
    });
  }

  /** 256² tiling random texture: value noise for one tap per octave. */
  private static createNoise(gl: WebGL2RenderingContext): WebGLTexture {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    let seed = 7;
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

  /** 1×1 black: "no figure here" until the mask loads. */
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

  private onLost = (e: Event) => {
    e.preventDefault();
    this.lost = true;
  };

  get ready(): boolean {
    return !!this.texture && !this.lost;
  }

  resize(cssW: number, cssH: number, scale = 1): void {
    this.scale = this.dpr * scale;
    const w = Math.max(1, Math.round(cssW * this.scale));
    const h = Math.max(1, Math.round(cssH * this.scale));
    if (w === this.width && h === this.height) return;
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  render(time: number, f: CosmicFrame): void {
    if (!this.texture || this.lost) return;
    const { gl, u, anchors: a } = this;
    const k = this.scale;
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(u.uTex, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTex);
    gl.uniform1i(u.uNoise, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
    gl.uniform1i(u.uMask, 2);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform2f(u.uRes, this.width, this.height);
    gl.uniform2f(u.uCenter, f.centerX * k, f.centerY * k);
    gl.uniform2f(u.uFocus, f.focusX, f.focusY);
    gl.uniform2f(u.uScale, f.plateW * k, f.plateH * k);
    gl.uniform2f(u.uRot, Math.cos(f.rotation), Math.sin(f.rotation));
    gl.uniform1f(u.uAspect, a.aspect);
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uBreath, f.breath);
    gl.uniform1f(u.uLife, f.life);
    gl.uniform1f(u.uEyes, f.eyes);
    gl.uniform2f(u.uCore, a.core.x, a.core.y);
    gl.uniform2f(u.uHead, a.head.x, a.head.y);
    gl.uniform2f(u.uEyeL, a.eyes[0].x, a.eyes[0].y);
    gl.uniform2f(u.uEyeR, a.eyes[1].x, a.eyes[1].y);
    gl.uniform2f(u.uTexSize, this.texSize.width, this.texSize.height);
    gl.uniform1f(u.uZoom, f.zoom);
    gl.uniform1f(u.uGlow, f.glow);
    // Heartbeat: a calm lub-dub every 1.8 s — "lub" at 0, "dub" 0.3 s later.
    const beat = time % HEARTBEAT;
    const pulseAt = (t: number, width: number) =>
      Math.exp(-(((beat - t) / width) ** 2)) + Math.exp(-(((beat - t - HEARTBEAT) / width) ** 2));
    gl.uniform1f(u.uPulse, pulseAt(0, 0.09) + 0.55 * pulseAt(0.3, 0.1));
    gl.uniform1f(u.uWave, beat);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy(): void {
    this.canvas.removeEventListener('webglcontextlost', this.onLost);
    if (this.texture) this.gl.deleteTexture(this.texture);
    this.gl.deleteTexture(this.noiseTex);
    this.gl.deleteTexture(this.maskTex);
    this.gl.deleteProgram(this.program);
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
