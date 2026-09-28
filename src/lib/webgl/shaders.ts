/**
 * GLSL for the hero renderer.
 *
 * PARTICLES — instanced capsules. Each particle is a quad stretched between its
 * current position (head) and where it was a moment ago (tail). Slow particles
 * are round sparks / soft bokeh; fast particles become light streaks. Warp
 * speed is therefore emergent, not a separate effect.
 *
 *   kind 0  cosmic dust   3D volume in front of the eye, flown through by the camera
 *   kind 1  iris orbiters sparks circling the iris; spiral into the pupil on approach
 *
 * TUNNEL — passing through the pupil. The eye texture is sampled in polar
 * coordinates, so the tunnel walls are built from the iris's own fibres, then
 * re-lit from human amber to machine blue.
 */

export const particleVertex = /* glsl */ `#version 300 es
precision highp float;

layout(location = 0) in vec2 aCorner;   // quad corner in [-1, 1]
layout(location = 1) in vec4 aSeed;     // xyz position seed, w = kind
layout(location = 2) in vec4 aProps;    // x size, y speed, z colour key, w phase

uniform vec2  uRes;        // canvas px
uniform float uDpr;
uniform float uTime;
uniform float uTravel;     // forward camera travel (scroll-linked, monotonic)
uniform float uSpeed;      // forward speed, world units / s (drives streak length)
uniform vec2  uPointer;    // smoothed pointer, [-1, 1]
uniform vec2  uIrisC;      // iris centre, canvas px (y down)
uniform float uIrisR;      // iris radius, canvas px
uniform float uSuck;       // 0 → 1 orbiters spiral into the pupil
uniform float uWarm;       // share of amber (human) particles
uniform float uAlpha;      // global fade
uniform float uBurst;      // 0 → 1 outward burst when surfacing into the city
uniform float uStreak;     // 0 → 1 how far motion stretches particles (held back until the tunnel)

out vec2  vLocal;
out float vSeg;
out float vR;
out vec3  vColor;
out float vAlpha;
out float vSoft;

const float DEPTH = 7.0;
const float NEAR  = 0.22;

vec3 palette(float key, float warm) {
  vec3 amber  = vec3(1.00, 0.64, 0.29);
  vec3 blue   = vec3(0.36, 0.55, 1.00);
  vec3 violet = vec3(0.55, 0.42, 1.00);
  vec3 ice    = vec3(0.82, 0.88, 1.00);
  if (key < warm) return amber;
  float k = fract(key * 7.31);
  return k < 0.45 ? blue : (k < 0.8 ? violet : ice);
}

void main() {
  float kind = aSeed.w;
  vec2 head;
  vec2 tail;
  float radius;
  float alpha;
  float soft = 0.0;
  vec2 centre = uRes * 0.5;
  float focal = uRes.y * 0.5;

  if (kind < 0.5) {
    // ── Cosmic dust: fly-through volume ─────────────────────────────
    float travel = uTravel * (0.6 + aProps.y * 0.8) + uTime * 0.035 * aProps.y;
    float z = mod(aSeed.z - travel, DEPTH) + NEAR;
    vec2 wp = aSeed.xy;
    wp += vec2(sin(uTime * 0.11 * aProps.y + aProps.w), cos(uTime * 0.09 * aProps.y + aProps.w * 1.7)) * 0.04;
    wp -= uPointer * 0.05 * (1.2 / z);                 // parallax: near moves more
    wp *= 1.0 + uBurst * 1.6 / z;                       // surfacing burst
    head = centre + vec2(wp.x, -wp.y) * focal / z;
    float zt = z + max(uSpeed, 0.0) * (0.03 + aProps.y * 0.03) * uStreak + 0.002;
    tail = centre + vec2(wp.x, -wp.y) * focal / zt;
    radius = aProps.x * uDpr * (0.85 / z);
    radius = min(radius, 26.0 * uDpr);
    soft = smoothstep(1.1, 0.35, z);                    // near = defocused bokeh
    alpha = smoothstep(NEAR, NEAR + 0.9, z) * (1.0 - smoothstep(DEPTH * 0.55, DEPTH + NEAR, z));
    alpha *= mix(0.9, 0.22, soft);
  } else {
    // ── Iris orbiters: accretion disk around the pupil ─────────────
    // Glints drifting slowly around the iris. As the dive begins they ease a
    // little toward the pupil and fade — no long streaks across the eye.
    float dir = aSeed.y > 0.5 ? 1.0 : -1.0;
    float w = (0.05 + aProps.y * 0.07) * dir;
    float pull = smoothstep(aProps.w * 0.3, aProps.w * 0.3 + 0.5, uSuck);
    float ang = aSeed.x * 6.2831853 + uTime * w + pull * 0.6 * dir;
    float r0 = mix(0.42, 1.18, aSeed.z);
    float rr = r0 * (1.0 - pull * 0.3) * uIrisR;
    head = uIrisC + vec2(cos(ang), sin(ang)) * rr;
    float lag = 0.012 * dir;
    tail = uIrisC + vec2(cos(ang - lag), sin(ang - lag)) * rr;
    radius = aProps.x * uDpr * 0.5 * max(uIrisR / (220.0 * uDpr), 0.6);
    radius = clamp(radius, 0.6 * uDpr, 4.0 * uDpr);
    alpha = (0.3 + 0.7 * fract(aProps.w * 13.1)) * (1.0 - smoothstep(0.0, 0.55, uSuck));
    alpha *= 0.5 + 0.5 * sin(uTime * (1.1 + aProps.y) + aProps.w * 20.0);
  }

  // Capsule quad between tail and head.
  vec2 axis = head - tail;
  float len = length(axis);
  vec2 dirv = len > 0.001 ? axis / len : vec2(1.0, 0.0);
  vec2 perp = vec2(-dirv.y, dirv.x);
  float seg = len * 0.5;
  vec2 mid = (head + tail) * 0.5;
  float halfL = seg + radius;
  vec2 pos = mid + dirv * aCorner.x * halfL + perp * aCorner.y * radius;

  vLocal = vec2(aCorner.x * halfL, aCorner.y * radius);
  vSeg = seg;
  vR = max(radius, 0.5);
  vSoft = soft;
  // Only small sparks may be warm — never the large defocused bokeh discs.
  vColor = palette(aProps.z, kind < 0.5 ? (aProps.x < 4.5 ? uWarm * 0.06 : 0.0) : uWarm * 0.45);
  if (kind > 0.5) vColor = mix(vColor, vec3(1.0, 0.93, 0.82), 0.45); // pale gold glints, not orange lines
  // Long streaks spread their energy — keep perceived brightness stable.
  vAlpha = alpha * uAlpha * (1.0 / (1.0 + seg / (radius * 6.0 + 1.0)));

  vec2 clip = (pos / uRes) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}
`;

export const particleFragment = /* glsl */ `#version 300 es
precision highp float;

in vec2  vLocal;
in float vSeg;
in float vR;
in vec3  vColor;
in float vAlpha;
in float vSoft;

out vec4 outColor;

void main() {
  float dx = max(abs(vLocal.x) - vSeg, 0.0);
  float d = length(vec2(dx, vLocal.y)) / vR;
  if (d > 1.0) discard;
  float falloff = 1.0 - d;
  // Sharp spark with a hot core, or a flat soft disc for defocused bokeh.
  float spark = falloff * falloff * falloff;
  float bokeh = smoothstep(0.0, 0.35, falloff) * 0.55;
  float a = mix(spark, bokeh, vSoft) * vAlpha;
  vec3 hot = mix(vColor, vec3(1.0), pow(falloff, 6.0) * (1.0 - vSoft) * 0.7);
  outColor = vec4(hot * a, a);
}
`;

export const fullscreenVertex = /* glsl */ `#version 300 es
precision highp float;
const vec2 verts[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() {
  gl_Position = vec4(verts[gl_VertexID], 0.0, 1.0);
}
`;

export const tunnelFragment = /* glsl */ `#version 300 es
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uCenter;     // portal centre, canvas px (y down)
uniform float uPortal;     // portal radius, canvas px
uniform float uReveal;     // 0 = dark pupil, 1 = lit tunnel
uniform float uTravel;     // distance travelled down the tunnel
uniform float uShift;      // 0 = human amber, 1 = machine blue
uniform float uFlash;      // light at the end of the tunnel
uniform sampler2D uTex;    // the eye plate
uniform vec2  uIrisUV;     // iris centre in texture uv
uniform vec2  uIrisRUV;    // iris radius in uv (x, y)
uniform float uPupilK;     // pupil radius / iris radius

out vec4 outColor;

float hash(float n) { return fract(sin(n) * 43758.5453123); }

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 p = px - uCenter;
  float r = length(p);
  // Wide, soft edge: the pupil dissolves into the tunnel instead of reading as a disc.
  float edge = max(uPortal * 0.42, 2.0);
  float mask = 1.0 - smoothstep(uPortal - edge, uPortal, r);
  if (mask <= 0.0) { outColor = vec4(0.0); return; }

  float scale = min(uRes.x, uRes.y) * 0.5;
  float rn = r / scale;
  float a = atan(p.y, p.x);
  vec2 dir = vec2(cos(a), sin(a));

  // Tunnel depth: walls near the screen edge are close, the centre is far.
  float depth = 0.36 / max(rn, 0.015);
  float z = depth + uTravel;

  // Iris fibres wrapped around the tunnel, motion-blurred along depth.
  vec3 col = vec3(0.0);
  float blur = 0.012 + uShift * 0.03;
  for (int i = 0; i < 4; i++) {
    float zi = z + float(i) * blur;
    float band = abs(fract(zi * 0.28) * 2.0 - 1.0);
    float rr = mix(uPupilK * 1.1, 0.97, band);
    vec2 uv = uIrisUV + dir * uIrisRUV * rr;
    col += texture(uTex, uv).rgb;
  }
  col *= 0.25;

  // Re-light: human amber → machine blue.
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 machine = mix(vec3(0.16, 0.28, 1.0), vec3(0.78, 0.86, 1.0), smoothstep(0.3, 0.85, l)) * (l * 2.1);
  col = mix(col * 1.35, machine, uShift);

  // Data lanes: thin dashes racing toward the camera, appear as the light turns blue.
  float lanes = 120.0;
  float lx = (a / 6.2831853 + 0.5) * lanes;
  float lane = floor(lx);
  float h = hash(lane);
  float onLane = step(0.55, h);
  float thin = 1.0 - smoothstep(0.0, 0.18 + rn * 0.1, abs(fract(lx) - 0.5));
  float dash = smoothstep(0.86, 0.95, fract(z * (0.6 + h * 1.4) + h * 17.0 + uTime * (0.2 + h)));
  col += vec3(0.55, 0.75, 1.0) * dash * thin * onLane * smoothstep(0.08, 0.5, rn) * uShift * 1.4;

  // Distance fog swallows the far end; later the far end becomes the light of the city.
  float far = 1.0 - smoothstep(0.0, 0.45, rn);
  col *= 1.0 - far * 0.9 * (1.0 - uFlash);
  col += vec3(0.72, 0.82, 1.0) * exp(-rn * mix(10.0, 2.2, uFlash)) * (0.18 * uShift + uFlash * 2.2);

  col *= uReveal * uReveal;

  col += vec3(0.93, 0.95, 1.0) * uFlash * uFlash * uFlash;

  outColor = vec4(col * mask, mask);
}
`;
