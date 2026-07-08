/**
 * Shaders for the deep-space background.
 *
 * Two passes:
 * 1. Background quad - near-black sky, blackbody stars in parallax
 *    layers, H II emission fields, and galactic cirrus wisps.
 * 2. Point-cloud nebulae - thousands of soft gaussian sprites in
 *    emulated 3D. Dust particles alpha-blend (they occlude the
 *    background); emission particles add (they glow). Colors come from
 *    a per-particle ionization calculation in the vertex shader.
 *
 * Physics used:
 * - Star colors: blackbody fit of the Planckian locus (after Tanner
 *   Helland), temperatures skewed like a stellar initial mass function;
 *   luminosity rises with temperature (Stefan-Boltzmann flavored).
 * - Gas colors approximate emission lines (H-alpha, H-beta, OIII)
 *   via the palette anchors.
 * - Noise: value-noise fbm per Book of Shaders ch.13; cirrus uses
 *   iq-style domain warping (iquilezles.org/articles/warp).
 */

export const VERTEX_SRC = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const BACKGROUND_FRAGMENT_SRC = `
precision highp float;

uniform vec2 uRes;          // canvas resolution in device px
uniform float uTime;        // seconds
uniform vec2 uMouse;        // pointer in uv space (0..1, y up)
uniform float uMouseActive; // eased 0..1
uniform vec4 uSeed;         // per-load randoms
uniform vec4 uCloud0;       // particle cloud anchors: xy uv, z radius, w strength
uniform vec4 uCloud1;
uniform vec4 uCloud2;
uniform vec4 uHii0;         // H II regions: xy uv, z radius, w strength
uniform vec4 uHii1;
// Two palettes: A tints the lower half, B the upper half. Emission is
// lerped by screen height so bottom clouds glow one color, top another.
uniform vec3 uColCoreA;
uniform vec3 uColCoreB;
uniform vec3 uColMidA;
uniform vec3 uColMidB;
uniform vec3 uColFilA;
uniform vec3 uColFilB;
uniform vec3 uColBlue;  // reflection-blue accent for the gradient wash

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm2(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise2(p);
    p = p * 2.03 + vec2(7.3, 3.1);
    a *= 0.5;
  }
  return v; // ~0..0.875
}

// Blackbody color, Planckian locus fit (~2000K..30000K).
vec3 blackbody(float kelvin) {
  float u = clamp(kelvin, 1500.0, 30000.0) / 100.0;
  vec3 c;
  if (u <= 66.0) {
    c.r = 1.0;
    c.g = clamp(0.3900816 * log(u) - 0.6318414, 0.0, 1.0);
    c.b = u <= 19.0 ? 0.0 : clamp(0.5432068 * log(u - 10.0) - 1.1962541, 0.0, 1.0);
  } else {
    c.r = clamp(1.2929362 * pow(u - 60.0, -0.1332047), 0.0, 1.0);
    c.g = clamp(1.1298909 * pow(u - 60.0, -0.0755148), 0.0, 1.0);
    c.b = 1.0;
  }
  return c;
}

vec3 starLayer(vec2 px, float cell, float extraDensity, float brightness, vec2 seed) {
  vec2 g = floor(px / cell);
  vec2 f = fract(px / cell);
  float h = hash21(g + seed);
  float threshold = 0.72 - extraDensity;
  if (h < threshold) return vec3(0.0);

  vec2 starPos = 0.15 + 0.7 * vec2(hash21(g + 1.3 + seed), hash21(g + 2.7 + seed));
  vec2 d = f - starPos;
  float massRand = hash21(g + 7.7 + seed);
  // IMF-like skew: hot blue giants are rare.
  float kelvin = 2300.0 + 27000.0 * pow(massRand, 3.5);
  float lum = mix(0.10, 1.4, pow(massRand, 2.5)) * brightness;
  float twinkle = 0.9 + 0.1 * sin(uTime * (0.3 + h) + h * 40.0);

  float core = exp(-dot(d, d) * cell * cell * 0.55);
  float glow = exp(-dot(d, d) * cell * cell * 0.06) * 0.05;
  float star = core + glow;

  if (massRand > 0.985) {
    float spikes = exp(-abs(d.x) * cell * 1.4) * exp(-abs(d.y) * cell * 0.18)
                 + exp(-abs(d.y) * cell * 1.4) * exp(-abs(d.x) * cell * 0.18);
    star += spikes * 0.35;
  }

  return blackbody(kelvin) * star * lum * twinkle;
}

// Gaussian proximity to a particle cloud: cirrus and star formation
// gather around the clouds.
float cloudProximity(vec2 pc, vec4 cloud) {
  if (cloud.w <= 0.0) return 0.0;
  float minRes = min(uRes.x, uRes.y);
  vec2 cloudPc = (cloud.xy - 0.5) * uRes / minRes;
  vec2 d = pc - cloudPc;
  float reach = cloud.z * 1.9;
  return exp(-dot(d, d) / (reach * reach));
}

// Faint diffuse ISM wisps around the clouds. Light gas: the pointer
// pushes it the most.
vec3 galacticCirrus(vec2 pc, vec2 look, vec2 push, float prox, vec3 midCol, vec3 filCol) {
  vec2 p = (pc - push * 1.4) * 2.1 + uSeed.xy * 23.0 - look * 0.001;
  float t = uTime * 0.008;
  vec2 q = vec2(fbm2(p + t), fbm2(p + vec2(4.2, 1.9)));
  vec2 r = vec2(fbm2(p + 2.3 * q + vec2(8.1, 2.7) - t), fbm2(p + 2.3 * q + vec2(1.4, 6.6)));
  float f = fbm2(p + 2.5 * r);
  float wisp = smoothstep(0.40, 0.92, f);
  float patch = smoothstep(0.34, 0.72, fbm2(p * 0.5 + uSeed.zw * 17.0));
  vec3 tint = midCol * 0.7 + filCol * 0.3;
  return tint * wisp * patch * prox * 0.11;
}

// A broad gradient wash: overlapping soft Gaussian color fields that
// give a smooth colored backdrop behind the stars and clouds.
float glowField(vec2 pc, vec2 c, float r) {
  vec2 d = pc - c;
  return exp(-dot(d, d) / (r * r));
}

vec3 gradientNebula(vec2 pc, vec2 push) {
  vec2 p = pc - push * 0.6; // the pointer nudges the wash gently
  vec3 g = vec3(0.0);
  g += uColMidA * glowField(p, vec2(0.5, -0.32), 0.8) * 0.13;   // warm, lower-right
  g += uColBlue * glowField(p, vec2(-0.55, -0.2), 0.62) * 0.11; // blue, lower-left
  g += uColMidB * glowField(p, vec2(-0.2, 0.4), 0.72) * 0.10;   // red, upper
  g += uColCoreA * glowField(p, vec2(0.2, 0.08), 0.95) * 0.055; // teal center haze
  return g;
}

// Large oblong emission fields behind everything.
vec3 hiiRegion(vec2 pc, vec4 region, float which, vec2 look, vec3 midCol, vec3 coreCol, out float envOut) {
  envOut = 0.0;
  if (region.w <= 0.0) return vec3(0.0);

  float minRes = min(uRes.x, uRes.y);
  vec2 regionPc = (region.xy - 0.5) * uRes / minRes;
  vec2 lp = (pc - regionPc - look * 0.004) / region.z;

  float ax = 0.55 + 0.5 * hash21(vec2(which, uSeed.x));
  float angle = hash21(vec2(which, uSeed.y)) * 6.28;
  float cs = cos(angle);
  float sn = sin(angle);
  lp = mat2(cs, -sn, sn, cs) * lp;
  lp.y /= ax;

  float r = length(lp);
  if (r > 1.5) return vec3(0.0);
  vec2 dir = lp / max(r, 1e-4);
  vec2 seedOff = uSeed.zw * 31.0 + which * 7.7;

  float boundary = fbm2(dir * 1.6 + seedOff);
  float g = 1.0 - r / (0.5 + 0.75 * boundary);
  if (g <= 0.0) return vec3(0.0);

  float t = uTime * 0.010;
  float tex = fbm2(lp * 2.1 + seedOff + t);
  float body = smoothstep(0.02, 0.8, g * 1.1 - tex * 0.55);
  float shellLevel = 0.22 + 0.2 * (boundary - 0.5);
  float shell = exp(-pow((g - shellLevel) * 6.0, 2.0)) * (0.4 + 0.6 * tex);

  envOut = body * region.w;
  vec3 emission = midCol * (body * 0.55 + shell * 0.5)
                + coreCol * body * body * 0.25;
  return emission * region.w * 0.32;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float minRes = min(uRes.x, uRes.y);
  vec2 look = (uMouse - 0.5) * uMouseActive;
  vec2 pc = (gl_FragCoord.xy - 0.5 * uRes) / minRes;

  // The pointer pushes the light gas aside within a small radius.
  vec2 mousePc = (uMouse - 0.5) * uRes / minRes;
  vec2 fromMouse = pc - mousePc;
  float pushFall = exp(-dot(fromMouse, fromMouse) * 500.0);
  vec2 push = normalize(fromMouse + 1e-4) * pushFall * 0.11 * uMouseActive;

  float prox = min(
    cloudProximity(pc, uCloud0) + cloudProximity(pc, uCloud1) + cloudProximity(pc, uCloud2),
    1.0
  );

  // Lerp emission tint by screen height: A below, B above.
  float fy0 = smoothstep(0.35, 0.65, uHii0.y);
  float fy1 = smoothstep(0.35, 0.65, uHii1.y);
  float fyf = smoothstep(0.35, 0.65, uv.y);

  float hiiEnv0; float hiiEnv1;
  vec3 hii = hiiRegion(pc, uHii0, 0.0, look,
               mix(uColMidA, uColMidB, fy0), mix(uColCoreA, uColCoreB, fy0), hiiEnv0)
           + hiiRegion(pc, uHii1, 1.0, look,
               mix(uColMidA, uColMidB, fy1), mix(uColCoreA, uColCoreB, fy1), hiiEnv1);

  vec3 cirrus = prox < 0.02 ? vec3(0.0)
    : galacticCirrus(pc, look, push, prox,
        mix(uColMidA, uColMidB, fyf), mix(uColFilA, uColFilB, fyf));

  // Star formation clusters near the clouds and inside H II regions.
  float formation = clamp(prox * 0.10 + (hiiEnv0 + hiiEnv1) * 0.06, 0.0, 0.25);
  vec2 px = gl_FragCoord.xy;
  vec3 starCol =
      starLayer(px - look * minRes * 0.002, 190.0, formation, 0.55, uSeed.zw + 11.0)
    + starLayer(px - look * minRes * 0.005, 110.0, formation, 0.8, uSeed.zw + 23.0)
    + starLayer(px - look * minRes * 0.008, 62.0, formation, 1.0, uSeed.zw + 37.0)
    + starLayer(px - look * minRes * 0.012, 36.0, formation, 0.7, uSeed.zw + 51.0);

  vec3 col = vec3(0.003, 0.004, 0.008); // near-black sky
  col += gradientNebula(pc, push); // broad gradient color wash
  col += cirrus + hii + starCol;

  float vig = 1.0 - 0.30 * dot(uv - 0.5, uv - 0.5);
  col *= vig;
  col = col / (1.0 + col); // Reinhard

  gl_FragColor = vec4(col, 1.0);
}
`;

// Sparse bright stars drawn in front of the nebulae: the nearest layer.
// Additively blended after the particles, so they sit on top of the gas.
export const FOREGROUND_FRAGMENT_SRC = `
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uMouseActive;
uniform vec4 uSeed;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec3 blackbody(float kelvin) {
  float u = clamp(kelvin, 1500.0, 30000.0) / 100.0;
  vec3 c;
  if (u <= 66.0) {
    c.r = 1.0;
    c.g = clamp(0.3900816 * log(u) - 0.6318414, 0.0, 1.0);
    c.b = u <= 19.0 ? 0.0 : clamp(0.5432068 * log(u - 10.0) - 1.1962541, 0.0, 1.0);
  } else {
    c.r = clamp(1.2929362 * pow(u - 60.0, -0.1332047), 0.0, 1.0);
    c.g = clamp(1.1298909 * pow(u - 60.0, -0.0755148), 0.0, 1.0);
    c.b = 1.0;
  }
  return c;
}

// Rare, bright, spiked: foreground stars carry the depth cue.
vec3 foregroundStars(vec2 px, float cell, float brightness, vec2 seed) {
  vec2 g = floor(px / cell);
  vec2 f = fract(px / cell);
  float h = hash21(g + seed);
  if (h < 0.93) return vec3(0.0);

  vec2 starPos = 0.2 + 0.6 * vec2(hash21(g + 1.3 + seed), hash21(g + 2.7 + seed));
  vec2 d = f - starPos;
  float massRand = hash21(g + 7.7 + seed);
  float kelvin = 2300.0 + 27000.0 * pow(massRand, 3.0);
  float twinkle = 0.88 + 0.12 * sin(uTime * (0.4 + h * 1.2) + h * 40.0);

  float core = exp(-dot(d, d) * cell * cell * 0.40);
  float halo = exp(-dot(d, d) * cell * cell * 0.035) * 0.08;
  float spikes = exp(-abs(d.x) * cell * 1.1) * exp(-abs(d.y) * cell * 0.16)
               + exp(-abs(d.y) * cell * 1.1) * exp(-abs(d.x) * cell * 0.16);

  return blackbody(kelvin) * (core + halo + spikes * 0.30) * brightness * twinkle;
}

void main() {
  float minRes = min(uRes.x, uRes.y);
  vec2 look = (uMouse - 0.5) * uMouseActive;
  vec2 px = gl_FragCoord.xy;

  // Nearest layers: the strongest parallax on the page.
  vec3 col = foregroundStars(px - look * minRes * 0.018, 260.0, 1.5, uSeed.zw + 71.0)
           + foregroundStars(px - look * minRes * 0.026, 170.0, 1.0, uSeed.zw + 89.0);

  col = col / (1.0 + col); // keep additive highlights soft
  gl_FragColor = vec4(col, 1.0);
}
`;

export const PARTICLE_VERTEX_SRC = `
precision highp float;

attribute vec3 aPos;    // local offset in cloud-radius units; z is depth
attribute vec3 aData;   // size (radius units), seed, kind (0 emission, 1 dust)
attribute vec3 aCloud;  // cloud center uv xy, radius (min-axis units)
attribute vec2 aTarget; // glyph target in [-1,1] glyph space
attribute vec2 aShade;  // rim (0 core..1 surface), facing (-1 backlit..1 lit)
attribute float aPalette; // palette index: 0 pillars, 1 red, 2 blue
attribute float aBright;  // per-cloud brightness multiplier

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;        // uv, y up
uniform float uMouseActive; // eased 0..1
uniform float uShapeMix;    // eased 0..1 glyph morph
// Three palettes per particle, chosen by aPalette.
uniform vec3 uCore[3];  // hot core / cool backlit rim
uniform vec3 uMid[3];   // main gas
uniform vec3 uFil[3];   // filament sparks
uniform vec3 uWarm[3];  // warm lit rim
uniform float uDustS[3];

varying vec4 vColor;
varying float vSoft; // 0 = small & sharp, 1 = large & soft
varying float vSeed;

void main() {
  float minRes = min(uRes.x, uRes.y);
  float isDust = step(0.5, aData.z);
  float depth01 = aPos.z * 0.5 + 0.5;

  // Resolve this particle's palette.
  int pi = int(aPalette + 0.5);
  float isPillar = 1.0 - step(0.5, aPalette);
  vec3 uColCore = uCore[pi];
  vec3 uColMid = uMid[pi];
  vec3 uColFil = uFil[pi];
  vec3 uColWarm = uWarm[pi];
  float uDust = uDustS[pi];

  // Slow individual drift: the cloud breathes without global rotation.
  float t = uTime * 0.05 + aData.y * 6.28;
  vec2 drift = vec2(cos(t), sin(t * 0.83)) * 0.035 * (0.4 + 0.6 * depth01);
  vec2 local = aPos.xy + drift;

  // Glyph morph: emission particles fly to the shape; dust mostly stays.
  float morphAmt = uShapeMix * mix(1.0, 0.25, isDust);
  vec2 shaped = mix(local, aTarget * 1.05, morphAmt);

  // Cloud-local to aspect-corrected screen coords, with depth parallax.
  vec2 look = (uMouse - 0.5) * uMouseActive;
  vec2 pc = (aCloud.xy - 0.5) * uRes / minRes + shaped * aCloud.z;
  pc -= look * (0.010 + 0.014 * depth01);

  // The pointer pushes particles aside within a small radius.
  vec2 mousePc = (uMouse - 0.5) * uRes / minRes;
  vec2 dm = pc - mousePc;
  float pushFall = exp(-dot(dm, dm) * 500.0);
  pc += normalize(dm + 1e-4) * pushFall * 0.11 * uMouseActive * (1.0 - 0.4 * isDust);

  gl_Position = vec4(pc * 2.0 * minRes / uRes, 0.0, 1.0);

  // Size: nearer particles render larger; the glyph tightens slightly.
  float depthScale = 0.8 + 0.5 * depth01;
  float tighten = 1.0 - 0.35 * morphAmt * (1.0 - isDust);
  gl_PointSize = clamp(aData.x * aCloud.z * minRes * depthScale * tighten, 1.5, 120.0);

  // Blur and opacity follow sprite size: large sprites are soft and faint
  // (volume fill), small sprites are sharp and opaque (outline detail).
  vSoft = clamp((gl_PointSize - 3.0) / 38.0, 0.08, 1.0);
  vSeed = aData.y;
  float sizeOpacity = mix(0.85, 0.32, vSoft);

  // Rim lighting: cores stay near-black, only the thin surface catches
  // light (warm where it faces the source, cool cyan where backlit).
  float rim = clamp(aShade.x, 0.0, 1.0);
  float facing = aShade.y;
  float lit = max(facing, 0.0);
  float back = max(-facing, 0.0);
  float surf = smoothstep(0.55, 1.0, rim);
  float twinkle = 0.9 + 0.1 * sin(uTime * 0.6 + aData.y * 40.0);

  if (aData.z < 0.5) {
    // Emission: ambient nebula glow, brighter and warmer at lit rims.
    // Keep the hue close to the main gas so additive overlap stays clean;
    // only the innermost gas leans toward the core color.
    float ion = clamp(1.0 - length(aPos.xy) * 0.7, 0.0, 1.0);
    vec3 col = mix(uColMid, uColCore, ion * ion * (0.2 + 0.35 * aData.y));
    col = mix(col, uColWarm, surf * lit * 0.6 * (1.0 - uShapeMix));
    col = mix(col, uColFil, step(0.94, aData.y) * 0.7); // rare hot sparks
    float alpha = (0.006 + 0.014 * aData.y) * twinkle * sizeOpacity * aBright;
    alpha *= mix(1.0, 0.38 + 0.42 * surf, isPillar);
    alpha *= 1.0 + uShapeMix * 0.7; // the glyph glows a little brighter
    vColor = vec4(col, alpha);
  } else {
    // Molecular dust: near-black in the dense core, warming as it thins.
    vec3 dark = mix(uColMid * 0.05 + vec3(0.006), vec3(0.030, 0.014, 0.018), isPillar);
    vec3 body = mix(uColMid * 0.24, vec3(0.18, 0.105, 0.09), isPillar);
    vec3 col = mix(dark, body, smoothstep(0.30, 0.95, rim));
    col += uColWarm * surf * pow(lit, 1.5) * mix(0.7, 0.9, isPillar);   // gold lit edges
    col += uColCore * surf * pow(back, 2.0) * mix(0.24, 0.34, isPillar); // cyan backlit edges
    float alpha = (0.022 + 0.052 * aData.y) * clamp(uDust, 0.3, 1.2) * sizeOpacity * aBright;
    alpha *= mix(1.0, 2.8, isPillar);
    alpha *= 1.0 - uShapeMix * 0.85; // dust clears while a glyph is up
    vColor = vec4(col, alpha);
  }
}
`;

export const PARTICLE_FRAGMENT_SRC = `
precision mediump float;

varying vec4 vColor;
varying float vSoft;
varying float vSeed;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  // Feathered, slightly irregular gaussian sprite. This avoids visible
  // particle dots while still letting thousands of sprites accumulate
  // into cloudy astronomical gas.
  // Premultiplied: dust draws (ONE, ONE_MINUS_SRC_ALPHA), emission (ONE, ONE).
  vec2 d = gl_PointCoord - 0.5;
  float angle = atan(d.y, d.x);
  float lobe = 1.0
    + 0.11 * sin(angle * 3.0 + vSeed * 18.0)
    + 0.07 * sin(angle * 7.0 - vSeed * 31.0);
  d /= lobe;

  float r2 = dot(d, d);
  float k = mix(18.0, 4.8, vSoft);
  float feather = smoothstep(0.34, mix(0.12, 0.02, vSoft), r2);
  float grain = 0.9 + 0.1 * hash21(gl_PointCoord * 13.0 + vSeed);
  float fall = exp(-r2 * k) * feather * grain;
  float a = vColor.a * fall;
  gl_FragColor = vec4(vColor.rgb * a, a);
}
`;
