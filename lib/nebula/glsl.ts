/**
 * Shaders for the deep-space background.
 *
 * Two passes:
 * 1. Background quad - near-black sky, blackbody stars in parallax
 *    layers, H II emission fields, and galactic cirrus wisps.
 * 2. Point-cloud nebulae - thousands of soft gaussian sprites in
 *    emulated 3D. Dust particles alpha-blend (they occlude the
 *    background); emission particles add (they glow). Colors and layer
 *    behavior come precomputed per particle from the generator.
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
// 0..1 reveal. The sky compiles far slower than the particle programs, so
// the scene shows without it and this ramps the wash in once it lands.
// Blended over a clear of the same near-black base, so fade 0 is seamless.
uniform float uFade;

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
  float threshold = 0.60 - extraDensity;
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
  g += uColMidA * glowField(p, vec2(0.5, -0.32), 0.8) * 0.12;    // amber, lower-right
  g += mix(uColBlue, vec3(0.04, 0.48, 0.68), 0.72)
    * glowField(p, vec2(-0.58, -0.34), 0.76) * 0.19;              // cyan-blue, lower-left edge
  g += mix(uColBlue, vec3(0.04, 0.58, 0.48), 0.78)
    * glowField(p, vec2(0.58, -0.38), 0.7) * 0.17;                // teal, lower-right edge
  g += mix(uColBlue, vec3(0.08, 0.55, 0.52), 0.65)
    * glowField(p, vec2(0.55, 0.34), 0.62) * 0.12;                // teal, upper-right side
  g += mix(uColCoreB, vec3(0.48, 0.18, 0.68), 0.75)
    * glowField(p, vec2(-0.5, 0.36), 0.68) * 0.13;                // violet, upper-left side
  g += vec3(0.16, 0.20, 0.58)
    * glowField(p, vec2(-0.72, 0.0), 0.58) * 0.12;                // indigo along left edge
  g += uColMidB * glowField(p, vec2(0.02, 0.58), 0.48) * 0.065;  // rust-red crest
  g += mix(uColCoreA, uColBlue, 0.38)
    * glowField(p, vec2(0.08, 0.02), 0.92) * 0.045;               // blended center haze
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
  // Soft body glow only. This used to also draw a bright ring at a
  // fixed fraction of the region's radius; since this region sits at
  // one of a few fixed screen spots with its own randomized (and
  // often huge, up to 90% of the screen's short axis) radius, totally
  // independent of any particle cloud's position, that ring read as a
  // large, unexplained circle detached from the actual nebulae.
  float body = smoothstep(0.02, 0.8, g * 1.1 - tex * 0.55);

  envOut = body * region.w;
  vec3 emission = midCol * body * 0.7 + coreCol * body * body * 0.25;
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

  vec3 col = vec3(0.004, 0.004, 0.006); // near-black sky, barely cool
  col += gradientNebula(pc, push); // broad gradient color wash
  col += cirrus + hii + starCol;

  float vig = 1.0 - 0.30 * dot(uv - 0.5, uv - 0.5);
  col *= vig;
  col = col / (1.0 + col); // Reinhard

  gl_FragColor = vec4(col, uFade);
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
  if (h < 0.85) return vec3(0.0);

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

// The dense field of faint distant suns, drawn as static tiny points
// instead of per-pixel hashing in the background shader: a few
// thousand vertices and a handful of lit pixels per star cost almost
// nothing, where a fullscreen procedural layer taxes every fragment
// every frame.
export const DENSE_STAR_VERTEX_SRC = `
precision mediump float;

attribute vec3 aStar; // xy uv position, z size in reference px
attribute vec4 aTint; // rgb tint, brightness

uniform vec2 uRes;
uniform vec2 uMouse;        // uv, y up
uniform float uMouseActive; // eased 0..1

varying vec4 vTint;

void main() {
  // Deepest parallax layer on the page: barely moves.
  vec2 look = (uMouse - 0.5) * uMouseActive;
  vec2 uv = aStar.xy + look * 0.003;
  gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = clamp(aStar.z * uRes.y / 1100.0, 1.0, 4.0);
  vTint = aTint;
}
`;

export const DENSE_STAR_FRAGMENT_SRC = `
precision mediump float;

varying vec4 vTint;

void main() {
  vec2 d = gl_PointCoord - 0.5;
  float fall = exp(-dot(d, d) * 14.0);
  vec3 col = vTint.rgb * vTint.a * fall;
  gl_FragColor = vec4(col, 0.0); // additive over the opaque sky
}
`;

export const PARTICLE_VERTEX_SRC = `
precision highp float;

attribute vec3 aPos;    // local offset in cloud-radius units; z is depth
attribute vec3 aData;   // size (radius units), seed, kind (see below)
attribute vec3 aCloud;  // cloud center uv xy, radius (min-axis units)
attribute vec4 aColor;  // layer color from the generator, straight alpha
attribute vec3 aMotion; // drift amplitude, pointer response, morph weight
attribute vec2 aTarget; // glyph target in [-1,1] glyph space
attribute float aAngle; // streak orientation, radians (wisps)

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;        // uv, y up
uniform vec2 uMouseVel;     // uv/s, smoothed on the CPU
uniform float uMouseActive; // eased 0..1
uniform float uShapeMix;    // eased 0..1 glyph morph

varying vec4 vColor;
varying float vSoft; // 0 = small & sharp, 1 = large & soft
varying float vSeed;
varying float vKind; // 0 emission blob, 1 dust blob, 2 spike star, 3 wisp streak
varying float vAngle;

void main() {
  float minRes = min(uRes.x, uRes.y);
  float kind = aData.z;
  float isDust = step(0.5, kind) * (1.0 - step(1.5, kind));
  float isStar = step(1.5, kind) * (1.0 - step(2.5, kind));
  float depth01 = aPos.z * 0.5 + 0.5;
  float seed = aData.y;

  // Ambient motion: a slow personal orbit plus a broad shared
  // circulation field. Amplitude comes per-layer from the generator,
  // so the outer volume barely moves while wisps circulate visibly.
  float t = uTime * 0.05 + seed * 6.2832;
  vec2 drift = vec2(cos(t), sin(t * 0.83));
  vec2 circ = vec2(
    sin(aPos.y * 1.9 + uTime * 0.030 + seed * 2.1),
    sin(aPos.x * 1.7 - uTime * 0.026 + seed * 4.7)
  );
  vec2 local = aPos.xy + (drift * 0.55 + circ * 0.45) * aMotion.x * (0.5 + 0.5 * depth01);

  // Glyph morph, weighted per layer: body/shells fly, volume lingers.
  float morphAmt = uShapeMix * aMotion.z;
  vec2 shaped = mix(local, aTarget * 1.05 + drift * 0.02, morphAmt);

  // Cloud-local to aspect-corrected screen coords, with depth parallax.
  vec2 look = (uMouse - 0.5) * uMouseActive;
  vec2 pc = (aCloud.xy - 0.5) * uRes / minRes + shaped * aCloud.z;
  pc -= look * (0.010 + 0.014 * depth01);

  // Pointer wake, like an object moving through water: the influence
  // region is a teardrop, not a circle. A rounded head sits at the
  // cursor and a tapering tail trails behind the recent motion; at
  // rest it relaxes into a softly wobbling blob.
  vec2 mousePc = (uMouse - 0.5) * uRes / minRes;
  vec2 dm = pc - mousePc;
  float speed = min(length(uMouseVel), 3.0);
  float moving = clamp(speed * 2.5, 0.0, 1.0);
  vec2 vn = speed > 0.05 ? uMouseVel / speed : vec2(1.0, 0.0);
  vec2 vperp = vec2(-vn.y, vn.x);

  // Boundary wobble: even the resting dent is never a clean circle.
  float ang = atan(dm.y, dm.x);
  float wob = 1.0 + 0.24 * sin(ang * 3.0 + uTime * 0.8)
                  + 0.14 * sin(ang * 5.0 - uTime * 1.3);

  // Teardrop metric: compressed reach ahead of the head, a tail
  // stretching ~4x farther behind, narrowing toward its tip.
  // (along, side) is dm in the motion frame; the anisotropy blends in
  // via the scale factors, never by mixing vectors across bases —
  // that cancels at intermediate speeds and lights up distant gas.
  float along = dot(dm, vn);
  float side = dot(dm, vperp);
  float behind = max(-along, 0.0);
  float axis = along > 0.0
    ? along * mix(1.0, 1.4, moving)
    : along / (1.0 + 3.5 * moving);
  float taper = 1.0 + behind * 1.8 * moving;
  vec2 warped = vec2(axis, side * taper) / wob;
  float fall = exp(-dot(warped, warped) * 260.0);

  vec2 dir = normalize(dm + 1e-4);
  vec2 wake = dir * (0.30 + 0.30 * speed)                    // bow push at the head
            + vperp * dot(dir, vperp) * 0.55 * speed         // gas parting around the path
            + vn * max(dot(dir, -vn), 0.0) * 0.45 * speed;   // tail dragged along
  pc += wake * fall * 0.09 * uMouseActive * aMotion.y;

  gl_Position = vec4(pc * 2.0 * minRes / uRes, 0.0, 1.0);

  // Size: nearer particles render larger; the glyph tightens slightly.
  float depthScale = 0.8 + 0.5 * depth01;
  float tighten = 1.0 - 0.3 * morphAmt;
  gl_PointSize = clamp(aData.x * aCloud.z * minRes * depthScale * tighten, 1.5, 180.0);

  // Blur follows sprite size: large sprites soft, small sprites sharp.
  vSoft = clamp((gl_PointSize - 3.0) / 44.0, 0.08, 1.0);
  vSeed = seed;
  vKind = kind;
  vAngle = aAngle;

  // Layer color comes precomputed; only brightness lives here.
  // Emission gas shimmers gently; spike stars scintillate harder.
  float twAmp = mix(0.08 * (1.0 - isDust), 0.30, isStar);
  float twinkle = 1.0 - twAmp * sin(uTime * (0.6 + 1.1 * isStar) + seed * 40.0);
  float alpha = aColor.a * twinkle;
  // Gas that is not part of the glyph thins while a glyph is up, and
  // glyph gas glows slightly brighter, so the shape emerges from the
  // nebula instead of replacing it.
  alpha *= 1.0 - uShapeMix * (1.0 - aMotion.z) * 0.75;
  alpha *= 1.0 + morphAmt * 0.5;
  vColor = vec4(aColor.rgb, alpha);
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

// Spike stars and wisp streaks share the particle vertex shader but
// render through their own tiny program: the tens of thousands of gas
// sprites never pay for the glyph math, and the mostly-empty glyph
// sprites discard early instead of blending transparent pixels.
export const GLYPH_FRAGMENT_SRC = `
precision mediump float;

varying vec4 vColor;
varying float vSeed;
varying float vKind;  // 2 spike star, 3 wisp streak
varying float vAngle; // streak orientation

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Soft gas strand along y = m*x + b + curve*x^2 in stroke space.
float strand(vec2 p, float m, float b, float curve, float w) {
  float d = p.y - (p.x * m + b + curve * p.x * p.x);
  return exp(-d * d / w);
}

void main() {
  vec2 d = gl_PointCoord - 0.5;
  float fall;

  if (vKind > 2.5) {
    // Wisp: one soft elongated ribbon along the flow direction. Two
    // dim internal strands give it fiber texture, but they only
    // modulate the ribbon, so nothing pokes past its envelope.
    // gl_PointCoord y runs down while world y runs up: flip before
    // rotating or every streak mirrors off its ring tangent.
    vec2 q = vec2(d.x, -d.y);
    float c = cos(vAngle);
    float s = sin(vAngle);
    vec2 p = vec2(c * q.x + s * q.y, -s * q.x + c * q.y);

    float h1 = hash21(vec2(vSeed, 1.7)) - 0.5;
    float h2 = hash21(vec2(vSeed, 9.2)) - 0.5;
    float ribbon = exp(-p.x * p.x * 5.0 - p.y * p.y * 150.0);
    float fibers = strand(p, h1 * 0.3, 0.03 + h2 * 0.06, h2 * 0.7, 0.004)
                 + strand(p, h2 * 0.3, -0.03 + h1 * 0.06, h1 * 0.7, 0.006);
    fall = ribbon * (0.55 + 0.5 * fibers) * smoothstep(0.5, 0.12, abs(p.x));
  } else {
    // Young star: tight gaussian core, soft halo, and the four
    // diffraction spikes every bright star carries in nebula photos.
    float r2 = dot(d, d);
    float core = exp(-r2 * 90.0);
    float halo = exp(-r2 * 10.0) * 0.10;
    float spikes = exp(-abs(d.x) * 26.0) * exp(-abs(d.y) * 3.5)
                 + exp(-abs(d.y) * 26.0) * exp(-abs(d.x) * 3.5);
    fall = (core * 1.7 + halo + spikes * 0.5) * smoothstep(0.25, 0.16, r2);
  }

  float a = min(vColor.a * fall, 1.0);
  // Most of a glyph sprite is empty: skip the blend entirely.
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor.rgb * a, a);
}
`;
