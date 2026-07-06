/**
 * Deep-space background, three physical layers plus stars:
 *
 * 1. Molecular clouds (foreground) - dense, partially opaque, irregular
 *    volumes, ray-marched with emission-absorption integration. The only
 *    layer that morphs into section glyphs on hover.
 * 2. H II regions (mid) - large oblong emission fields of ionized
 *    hydrogen glowing behind the clouds.
 * 3. Galactic cirrus (far) - faint diffuse wisps of the interstellar
 *    medium, domain-warped noise masked into sparse patches.
 *
 * Each layer sits at its own parallax depth against the pointer.
 *
 * Physics used:
 * - Beer-Lambert extinction for transmittance: T *= exp(-sigma * dt).
 *   The final sightline transmittance occludes everything behind a cloud.
 * - Emission-line palette: H-alpha 656nm, H-beta 486nm, OIII 501nm.
 * - Star colors from a blackbody fit of the Planckian locus (after
 *   Tanner Helland); temperatures skewed like a stellar initial mass
 *   function; luminosity rising with temperature (Stefan-Boltzmann).
 * - Volume rendering after the Shadertoy dusty-nebula lineage (Duke),
 *   as described in Toni Sagrista's Gaia Sky writeup.
 * - Density model: fog/core split and gradient-limited noise erosion
 *   (Blender volume-nebula breakdown); fbm per Book of Shaders ch.13
 *   and iquilezles.org/articles/warp.
 */

export const VERTEX_SRC = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const FRAGMENT_SRC = `
precision highp float;

uniform vec2 uRes;          // canvas resolution in device px
uniform float uTime;        // seconds
uniform vec2 uMouse;        // pointer in uv space (0..1, y up), eased in JS
uniform float uMouseActive; // eased 0..1; scales parallax
uniform vec4 uSeed;         // per-load randoms
uniform vec4 uCloud0;       // molecular clouds: xy = uv pos, z = radius, w = strength
uniform vec4 uCloud1;
uniform vec4 uCloud2;
uniform vec4 uHii0;         // H II regions: xy = uv pos, z = radius, w = strength
uniform vec4 uHii1;
uniform vec3 uColCore;      // emission of dense cores
uniform vec3 uColMid;       // main outer-gas emission
uniform vec3 uColFil;       // filament emission accent
uniform float uDust;        // dust absorption strength
uniform sampler2D uShape;   // distance field: 0 inside shape -> 1 far
uniform float uShapeMix;    // eased 0..1 glyph morph strength

// Few steps + per-pixel jitter reads as smooth gas at a fraction of the cost.
const int MARCH_STEPS = 16;

// ---------- hashes and noise ----------
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
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

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i);
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

float fbm3_2(vec3 p) {
  return 0.6 * noise3(p) + 0.4 * noise3(p * 2.11 + vec3(5.2, 9.1, 3.3));
}

// ---------- blackbody color (Planckian locus fit, ~2000K..30000K) ----------
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

// ---------- the sea of stars ----------
vec3 starLayer(vec2 px, float cell, float extraDensity, float brightness, vec2 seed) {
  vec2 g = floor(px / cell);
  vec2 f = fract(px / cell);
  float h = hash21(g + seed);
  float threshold = 0.72 - extraDensity;
  if (h < threshold) return vec3(0.0);

  vec2 starPos = 0.15 + 0.7 * vec2(hash21(g + 1.3 + seed), hash21(g + 2.7 + seed));
  vec2 d = f - starPos;
  float massRand = hash21(g + 7.7 + seed);
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

// ---------- layer 3: galactic cirrus ----------
// Gaussian proximity to the molecular clouds: cirrus lives around them.
float cloudProximity(vec2 pc, vec4 cloud) {
  if (cloud.w <= 0.0) return 0.0;
  float minRes = min(uRes.x, uRes.y);
  vec2 cloudPc = (cloud.xy - 0.5) * uRes / minRes;
  vec2 d = pc - cloudPc;
  float reach = cloud.z * 1.9;
  return exp(-dot(d, d) / (reach * reach));
}

// Faint diffuse ISM wisps: double-warped fbm, gathered around the
// molecular clouds and masked into patches. Light gas: the pointer
// pushes it the most.
vec3 galacticCirrus(vec2 pc, vec2 look, vec2 push) {
  float prox = cloudProximity(pc, uCloud0)
             + cloudProximity(pc, uCloud1)
             + cloudProximity(pc, uCloud2);
  prox = min(prox, 1.0);
  if (prox < 0.02) return vec3(0.0); // black sky costs nothing

  vec2 p = (pc - push * 1.4) * 2.1 + uSeed.xy * 23.0 - look * 0.001; // deepest parallax
  float t = uTime * 0.008;
  vec2 q = vec2(fbm2(p + t), fbm2(p + vec2(4.2, 1.9)));
  vec2 r = vec2(fbm2(p + 2.3 * q + vec2(8.1, 2.7) - t), fbm2(p + 2.3 * q + vec2(1.4, 6.6)));
  float f = fbm2(p + 2.5 * r);
  float wisp = smoothstep(0.40, 0.92, f);
  float patch = smoothstep(0.34, 0.72, fbm2(p * 0.5 + uSeed.zw * 17.0));
  vec3 tint = uColMid * 0.7 + uColFil * 0.3;
  return tint * wisp * patch * prox * 0.11;
}

// ---------- layer 2: H II regions ----------
// Large oblong emission fields behind the clouds. 2D, no march: an
// anisotropic lumpy envelope with a shell rim and cloudy texture.
vec3 hiiRegion(vec2 pc, vec4 region, float which, vec2 look, out float envOut) {
  envOut = 0.0;
  if (region.w <= 0.0) return vec3(0.0);

  float minRes = min(uRes.x, uRes.y);
  vec2 regionPc = (region.xy - 0.5) * uRes / minRes;
  vec2 lp = (pc - regionPc - look * 0.004) / region.z; // mid parallax

  // Oblong: squash one seeded axis.
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

  // Lumpy boundary: radius depends on direction.
  float boundary = fbm2(dir * 1.6 + seedOff);
  float g = 1.0 - r / (0.5 + 0.75 * boundary);
  if (g <= 0.0) return vec3(0.0);

  float t = uTime * 0.010;
  float tex = fbm2(lp * 2.1 + seedOff + t);
  float body = smoothstep(0.02, 0.8, g * 1.1 - tex * 0.55);
  float shellLevel = 0.22 + 0.2 * (boundary - 0.5);
  float shell = exp(-pow((g - shellLevel) * 6.0, 2.0)) * (0.4 + 0.6 * tex);

  envOut = body * region.w;
  vec3 emission = uColMid * (body * 0.55 + shell * 0.5)
                + uColCore * body * body * 0.25;
  return emission * region.w * 0.32; // dim: it sits behind everything
}

// ---------- layer 1: molecular clouds ----------
// Density: fog + core + shell + spokes + opaque dust, inside an
// irregular bounding gradient (anisotropy, direction-warped radius,
// two-lobe union). The gradient morphs into the hovered glyph's
// distance field, so the same cloud re-bounds itself on hover.
// Polynomial smooth maximum: merges lobe gradients like touching globs.
float smax(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
  return mix(b, a, h) + k * h * (1.0 - h);
}

// The domain warp and the lobes are computed once per ray and passed in.
// Density model after the Pillars of Creation: several blobby lobes
// smooth-merged into an irregular mass, interior filled with dark dust,
// a thin bright photoevaporation rim right at the surface, faint outer
// fog, and rare hot knots deep inside.
// Both kinds of gas share one mass: lobes 0-1 are bright ionized
// emission gas, lobes 2-3 are dark molecular dust. The rim lights the
// combined surface.
float cloudDensity(vec3 lpIn, vec3 seedOff, vec3 aniso, vec3 warp,
                   vec4 lobe0, vec4 lobe1, vec4 lobe2, vec4 lobe3,
                   out float coreFrac, out float rim, out float glow, out float dust) {
  coreFrac = 0.0;
  rim = 0.0;
  glow = 0.0;
  dust = 0.0;

  vec3 lp = lpIn / aniso; // elongate: aniso >= 1 stretches that axis
  vec3 lw = lp + warp * 0.35;

  // Metaball unions: globs stuck to each other, no particular shape.
  float gBright = smax(1.0 - length(lw - lobe0.xyz) / lobe0.w,
                       1.0 - length(lw - lobe1.xyz) / lobe1.w, 0.18);
  float gDark = smax(1.0 - length(lw - lobe2.xyz) / lobe2.w,
                     1.0 - length(lw - lobe3.xyz) / lobe3.w, 0.18);

  if (uShapeMix > 0.004) {
    float sdS = texture2D(uShape, lpIn.xy * 0.5 + 0.5).r;
    float gShape = clamp(1.0 - sdS * 2.8, 0.0, 1.0) * clamp(1.0 - abs(lpIn.z) * 1.6, 0.0, 1.0);
    // The glyph forms from the bright gas; the dust thins away.
    gBright = mix(gBright, gShape, uShapeMix);
    gDark = mix(gDark, gShape * 0.35 - 0.2, uShapeMix);
  }

  float g = smax(gBright, gDark, 0.18); // the combined surface
  if (g <= -0.15) return 0.0;

  float n = fbm3_2(lw * 2.6 + seedOff + uTime * 0.012);

  // Thin bright rim at the combined surface, broken up by the noise.
  rim = exp(-pow((g - 0.045 - 0.10 * (n - 0.5)) * 11.0, 2.0));

  // Dark gas: dust mass filling its lobes. Absorbs, barely emits.
  dust = smoothstep(0.06, 0.40, gDark - (n - 0.5) * 0.30) * 2.6;

  // Bright gas: glowing ionized interior of its lobes.
  glow = smoothstep(0.0, 0.55, gBright - (n - 0.5) * 0.45);

  // Faint fog hugging the outside of everything.
  float fog = smoothstep(-0.12, 0.25, g) * (0.25 + 0.5 * n);

  // Hot knots deep inside the bright gas, where new stars ignite.
  float core = pow(max(gBright - 0.45 - (n - 0.5) * 0.4, 0.0), 2.0) * 1.2;

  coreFrac = clamp(core * 2.0, 0.0, 1.0);
  return fog * 0.25 + rim * 0.80 + glow * 0.75 + core;
}

vec3 marchMolecularCloud(vec2 pc, vec4 cloud, float which, vec2 look, vec2 push,
                         out float envOut, out float transOut) {
  envOut = 0.0;
  transOut = 1.0;
  if (cloud.w <= 0.0) return vec3(0.0);

  float minRes = min(uRes.x, uRes.y);
  vec2 cloudPc = (cloud.xy - 0.5) * uRes / minRes;
  // The pointer pushes the gas aside; parallax stays subtle.
  vec2 lp2d = (pc - push - cloudPc - look * 0.012) / cloud.z;
  if (dot(lp2d, lp2d) > 1.45) return vec3(0.0);

  // No rotation: the clouds hang still, drifting only through their noise.
  vec3 roV = vec3(lp2d, -2.2);
  vec3 rdV = normalize(vec3(look * 0.06, 1.0)); // gentle ray tilt

  float b = dot(roV, rdV);
  float c2 = dot(roV, roV) - 1.0;
  float h = b * b - c2;
  if (h < 0.0) return vec3(0.0);
  h = sqrt(h);
  float t0 = -b - h;
  float t1 = -b + h;
  float dt = (t1 - t0) / float(MARCH_STEPS);

  vec3 seedOff = vec3(uSeed.xy * 37.0, uSeed.z * 21.0) + which * 9.3;
  vec3 aniso = vec3(
    1.0 + 0.5 * hash13(seedOff + 11.0),
    1.0 + 0.5 * hash13(seedOff + 13.0),
    1.0
  );
  vec2 dustDir = normalize(vec2(hash21(seedOff.xy) - 0.5, hash21(seedOff.xy + 3.1) - 0.5) + 1e-3);

  // Seeded metaball lobes: centers and radii, once per ray.
  vec4 lobe0 = vec4((vec3(hash13(seedOff + 1.0), hash13(seedOff + 2.0), hash13(seedOff + 3.0)) - 0.5) * 0.6,
                    0.22 + 0.2 * hash13(seedOff + 4.0));
  vec4 lobe1 = vec4((vec3(hash13(seedOff + 5.0), hash13(seedOff + 6.0), hash13(seedOff + 7.0)) - 0.5) * 0.6,
                    0.20 + 0.2 * hash13(seedOff + 8.0));
  vec4 lobe2 = vec4((vec3(hash13(seedOff + 9.0), hash13(seedOff + 10.0), hash13(seedOff + 12.0)) - 0.5) * 0.6,
                    0.18 + 0.22 * hash13(seedOff + 14.0));
  vec4 lobe3 = vec4((vec3(hash13(seedOff + 15.0), hash13(seedOff + 16.0), hash13(seedOff + 17.0)) - 0.5) * 0.6,
                    0.16 + 0.24 * hash13(seedOff + 18.0));

  // Domain warp for this ray, from its midpoint through the volume.
  // Low frequency, so per-ray is indistinguishable from per-step.
  vec3 midl = (roV + rdV * (0.5 * (t0 + t1))) / aniso;
  float wx = fbm3_2(midl * 1.4 + seedOff + 31.0);
  float wy = fbm3_2(midl * 1.4 + seedOff + 57.0);
  vec3 warp = vec3(wx - 0.5, wy - 0.5, (wx - wy) * 0.5);

  // Per-pixel jitter hides banding from the low step count.
  float jitter = hash21(gl_FragCoord.xy + which) - 0.5;

  vec3 acc = vec3(0.0);
  float trans = 1.0;
  for (int i = 0; i < MARCH_STEPS; i++) {
    vec3 pos = roV + rdV * (t0 + (float(i) + 0.5 + jitter) * dt);
    float coreFrac;
    float rim;
    float glow;
    float dustD;
    float d = cloudDensity(pos, seedOff, aniso, warp, lobe0, lobe1, lobe2, lobe3,
                           coreFrac, rim, glow, dustD);
    if (d > 0.001 || dustD > 0.001) {
      float aEmit = d * cloud.w * 3.2 * dt;
      float lane = 0.4 + 1.2 * smoothstep(-0.4, 0.7, dot(pos.xy, dustDir));
      float aDust = dustD * cloud.w * (2.5 + uDust * 7.0) * lane * dt;

      // Both gases: glowing ionized lobes, dark dusty lobes, and a
      // bright thin rim where the shared surface catches the light.
      vec3 emission = uColMid * (0.30 + glow * 1.0)
                    + uColFil * rim * 1.8
                    + uColCore * coreFrac * 1.2;
      acc += emission * aEmit * trans;
      acc += uColMid * dustD * 0.05 * aDust * trans;

      trans *= exp(-(aEmit * 0.55 + aDust)); // Beer-Lambert
      if (trans < 0.01) break;
    }
  }

  envOut = (1.0 - trans) * cloud.w;
  transOut = trans;
  return acc;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float minRes = min(uRes.x, uRes.y);
  vec2 look = (uMouse - 0.5) * uMouseActive;
  vec2 pc = (gl_FragCoord.xy - 0.5 * uRes) / minRes;

  // The pointer pushes gas aside, like a hand through fog: a radial
  // displacement with gaussian falloff around the cursor. Sampling is
  // offset against the push, so the gas bulges away and eases back.
  vec2 mousePc = (uMouse - 0.5) * uRes / minRes;
  vec2 fromMouse = pc - mousePc;
  float pushFall = exp(-dot(fromMouse, fromMouse) * 20.0);
  vec2 push = normalize(fromMouse + 1e-4) * pushFall * 0.11 * uMouseActive;

  // Layer 1: molecular clouds (foreground, opaque, glyph-morphing).
  float env0; float env1; float env2;
  float trans0; float trans1; float trans2;
  vec3 clouds = marchMolecularCloud(pc, uCloud0, 0.0, look, push, env0, trans0)
              + marchMolecularCloud(pc, uCloud1, 1.0, look, push, env1, trans1)
              + marchMolecularCloud(pc, uCloud2, 2.0, look, push, env2, trans2);
  float sightline = trans0 * trans1 * trans2; // background light that survives

  // Layer 2: H II regions (mid, glowing fields). Too far away to push.
  float hiiEnv0; float hiiEnv1;
  vec3 hii = hiiRegion(pc, uHii0, 0.0, look, hiiEnv0)
           + hiiRegion(pc, uHii1, 1.0, look, hiiEnv1);

  // Layer 3: galactic cirrus (far, faint wisps; pushed the most).
  vec3 cirrus = galacticCirrus(pc, look, push);

  // Star formation clusters inside clouds and H II regions.
  float env = min(env0 + env1 + env2 + (hiiEnv0 + hiiEnv1) * 0.5, 1.0);
  float formation = clamp(env * 0.14, 0.0, 0.3);
  vec2 px = gl_FragCoord.xy;
  vec3 starCol =
      starLayer(px - look * minRes * 0.002, 190.0, formation, 0.55, uSeed.zw + 11.0)
    + starLayer(px - look * minRes * 0.005, 110.0, formation, 0.8, uSeed.zw + 23.0)
    + starLayer(px - look * minRes * 0.008, 62.0, formation, 1.0, uSeed.zw + 37.0)
    + starLayer(px - look * minRes * 0.012, 36.0, formation, 0.7, uSeed.zw + 51.0);

  // Compose back to front: everything behind the molecular clouds is
  // dimmed by the sightline transmittance (dust blocks the stars).
  vec3 background = vec3(0.003, 0.004, 0.008) + cirrus + hii + starCol;
  vec3 col = background * sightline + clouds;

  float vig = 1.0 - 0.30 * dot(uv - 0.5, uv - 0.5);
  col *= vig;
  col = col / (1.0 + col); // Reinhard

  gl_FragColor = vec4(col, 1.0);
}
`;
