"use client";

import { useEffect, useRef } from "react";
import {
  BACKGROUND_FRAGMENT_SRC,
  DENSE_STAR_FRAGMENT_SRC,
  DENSE_STAR_VERTEX_SRC,
  FOREGROUND_FRAGMENT_SRC,
  GLYPH_FRAGMENT_SRC,
  PARTICLE_FRAGMENT_SRC,
  PARTICLE_VERTEX_SRC,
  VERTEX_SRC,
} from "@/lib/nebula/glsl";
import { beginProgram, finishProgram } from "@/lib/nebula/webgl";
import {
  generateParticles,
  sampleShapeTargets,
  CloudSpec,
  ShapePools,
} from "@/lib/nebula/particles";
import {
  miniPalettes,
  profilePalettes,
  type MiniPaletteName,
  type ProfileName,
} from "@/lib/nebula/palettes";

const TARGET_POOL = 1024; // glyph sample points per shape
const BASE_RENDER_SCALE = 0.66;
const REDUCED_RENDER_SCALE = 0.45; // adaptive fallback for slow GPUs
// Fill-rate cap: the longest canvas axis never exceeds this many device
// pixels. The scene is fill-bound (soft overlapping sprites plus two
// fullscreen passes), and the gas is blurry by design, so a capped
// backing store upscales invisibly while huge windows would otherwise
// multiply the heaviest per-pixel work several times over.
const MAX_BACKING_PX = 2100;
const DENSE_STAR_COUNT = 3200;
const FRAME_INTERVAL_MS = 16;
const SLOW_FRAME_MS = 55;
const MIX_RATE = 2.5; // 1/s, ease toward the glyph target (slower morph)
const MOUSE_FADE_RATE = 4; // 1/s, push fade only
const MOUSE_VEL_RATE = 7; // 1/s, velocity smoothing for the wake
// Pointer position smoothing. Raw pointer events arrive quantized to
// device pixels; feeding them straight to the parallax makes the whole
// screen step visibly during slow movement. ~80ms of easing removes
// the jitter without making the wake feel laggy.
const MOUSE_POS_RATE = 12; // 1/s

export type NebulaCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type NebulaMiniShape = ProfileName | "random";
export type NebulaMiniSize = "md" | "lg" | "xl";
export interface NebulaLayerVisibility {
  background?: boolean;
  distantStars?: boolean;
  gas?: boolean;
  wisps?: boolean;
  emission?: boolean;
  youngStars?: boolean;
  foregroundStars?: boolean;
}

interface NebulaBackgroundProps {
  /**
   * "full" is the home-page scene: opaque sky, stars, and three
   * structured nebulae. "mini" is one small random-profile cloud on a
   * transparent canvas, tucked into a corner over the DOM starfield.
   */
  variant?: "full" | "mini" | "demo";
  /** Where the mini cloud sits (mini only). */
  corner?: NebulaCorner;
  /** Structural profile for the mini cloud. Defaults to random. */
  miniShape?: NebulaMiniShape;
  /** Palette family for the mini cloud. Defaults to profile-native colors. */
  color?: MiniPaletteName | "random";
  /** Decorative mini footprint. Defaults to a larger medium. */
  size?: NebulaMiniSize;
  layers?: NebulaLayerVisibility;
}

const MINI_CORNERS: Record<NebulaCorner, [number, number]> = {
  // uv space, y up; pulled in from the edges so the gas has room.
  "top-left": [0.16, 0.76],
  "top-right": [0.84, 0.76],
  "bottom-left": [0.16, 0.24],
  "bottom-right": [0.84, 0.24],
};

// Mobile radii run ~70-90vmin: at phone sizes a 30vmin corner cloud
// reads as a smudge. Sprite sizes scale with the radius, so the bigger
// footprint costs nothing extra as long as the count stays put (the
// density constant below compensates).
const MINI_SIZE_RADIUS: Record<NebulaMiniSize, { mobile: number; desktop: number }> = {
  md: { mobile: 0.36, desktop: 0.19 },
  lg: { mobile: 0.4, desktop: 0.23 },
  xl: { mobile: 0.44, desktop: 0.28 },
};

const MINI_PROFILES: ProfileName[] = ["orion", "helix", "crab"];
const MINI_COLORS: Exclude<MiniPaletteName, "profile">[] = ["aurora", "solar", "frost"];

/**
 * Procedurally generated deep-space background, unique per page load.
 * A cheap fullscreen pass draws sky, stars, H II fields, and cirrus;
 * the nebulae are thousands of soft point sprites arranged by
 * structural profiles (Orion-like arcs, a Helix-like broken ring, a
 * Crab-like filament web). Hovering an element with
 * data-nebula-shape="<key>" flies the structured layers into that
 * glyph. The pointer carves a directional wake through the gas.
 *
 * Shaders compile asynchronously; the canvas fades in when ready.
 * Falls back to nothing if WebGL is unavailable (the starfield remains).
 */
export default function NebulaBackground({
  variant = "full",
  corner = "bottom-right",
  miniShape = "random",
  color = "profile",
  size = "md",
  layers = {},
}: NebulaBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layersRef = useRef(layers);
  layersRef.current = layers;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const isMini = variant === "mini";
    const isDemo = variant === "demo";
    const visible = (key: keyof NebulaLayerVisibility) => layersRef.current[key] !== false;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext("webgl", {
        // The mini variant composites over the DOM starfield.
        alpha: isMini,
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      gl = null;
    }
    if (!gl) return;

    // Assigned in boot(), which always runs before any closure reads them.
    // The mini variant only compiles the particle and glyph programs.
    let bgProgram!: WebGLProgram;
    let particleProgram!: WebGLProgram;
    let glyphProgram!: WebGLProgram;
    let fgProgram!: WebGLProgram;
    let denseProgram!: WebGLProgram;
    let activePrograms: WebGLProgram[] = [];
    let parallelCompile: KHR_parallel_shader_compile | null = null;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const state = {
      disposed: false,
      started: false,
      running: false,
      frame: 0,
      renderScale: BASE_RENDER_SCALE,
      lastRenderTime: 0,
      slowFrameStreak: 0,
      // Backing size this boot has uploaded to the programs. Not read
      // from the canvas: the router can hand us back a canvas whose
      // attributes are already right while the freshly compiled
      // programs still have zeroed uniforms.
      uploadedW: 0,
      uploadedH: 0,
      mix: 0,
      activeShape: null as string | null,
      pendingShape: null as string | null,
      mouse: { x: 0.5, y: 0.5 },
      smoothMouse: { x: 0.5, y: 0.5 },
      lastMouse: { x: 0.5, y: 0.5 },
      mouseVel: { x: 0, y: 0 },
      mouseActive: 0,
      mouseActiveTarget: 0,
    };

    let bgU: Record<string, WebGLUniformLocation | null> = {};
    let pU: Record<string, WebGLUniformLocation | null> = {};
    let gU: Record<string, WebGLUniformLocation | null> = {};
    let fgU: Record<string, WebGLUniformLocation | null> = {};
    let dU: Record<string, WebGLUniformLocation | null> = {};
    let pAttr: Record<string, number> = {};
    let gAttr: Record<string, number> = {};
    let dAttr: Record<string, number> = {};
    let quadBuffer: WebGLBuffer | null = null;
    let buffers: Record<string, WebGLBuffer | null> = {};
    let particleSeeds: Float32Array = new Float32Array(0);
    let particleRoles: Uint8Array = new Uint8Array(0);
    let particleCount = 0;
    let dustCount = 0;
    let wispCount = 0;
    let starCount = 0;
    const targetCache = new Map<string, ShapePools>();

    const uploadTargets = (key: string | null) => {
      if (!key) return; // mix eases to 0; stale targets are invisible
      let pools = targetCache.get(key);
      if (!pools) {
        pools = sampleShapeTargets(key, TARGET_POOL);
        targetCache.set(key, pools);
      }
      const { edge, interior } = pools;
      if (edge.length === 0 && interior.length === 0) return;
      const targets = new Float32Array(particleCount * 2);
      // Spike stars (role 2) space evenly along the outline instead of
      // seeding randomly, so they bead the shape's edge like a rim of
      // young stars. The edge pool is stratified, so rank order maps to
      // even coverage.
      let starTotal = 0;
      for (let i = 0; i < particleCount; i++) {
        if (particleRoles[i] === 2) starTotal++;
      }
      let starRank = 0;
      for (let i = 0; i < particleCount; i++) {
        // Shell/filament particles trace the outline; body gas fills it.
        const onEdge = particleRoles[i] >= 1 && edge.length > 0;
        const pool = onEdge ? edge : interior;
        const pairs = pool.length / 2;
        let idx: number;
        if (particleRoles[i] === 2 && onEdge && starTotal > 0) {
          idx = Math.min(pairs - 1, Math.floor(((starRank + 0.5) / starTotal) * pairs));
          starRank++;
        } else {
          idx = Math.min(pairs - 1, Math.floor(particleSeeds[i] * pairs));
        }
        targets[i * 2] = pool[idx * 2];
        targets[i * 2 + 1] = pool[idx * 2 + 1];
      }
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buffers.target);
      gl!.bufferData(gl!.ARRAY_BUFFER, targets, gl!.DYNAMIC_DRAW);
    };

    const resize = () => {
      if (!state.started) return;
      let dpr = Math.min(window.devicePixelRatio || 1, 1.5) * state.renderScale;
      // Size from the lvh-fixed element, not window.innerHeight: the
      // mobile URL bar collapsing fires resize without changing the
      // element, and re-rendering then makes the sky visibly snap.
      const cssW = canvas.clientWidth || window.innerWidth;
      const cssH = canvas.clientHeight || window.innerHeight;
      const longest = Math.max(cssW, cssH) * dpr;
      if (longest > MAX_BACKING_PX) dpr *= MAX_BACKING_PX / longest;
      const width = Math.max(1, Math.round(cssW * dpr));
      const height = Math.max(1, Math.round(cssH * dpr));
      if (width === state.uploadedW && height === state.uploadedH) return;
      state.uploadedW = width;
      state.uploadedH = height;
      canvas.width = width;
      canvas.height = height;
      gl!.viewport(0, 0, canvas.width, canvas.height);
      if (!isMini) {
        gl!.useProgram(bgProgram);
        gl!.uniform2f(bgU.res, canvas.width, canvas.height);
        gl!.useProgram(fgProgram);
        gl!.uniform2f(fgU.res, canvas.width, canvas.height);
      }
      gl!.useProgram(denseProgram);
      gl!.uniform2f(dU.res, canvas.width, canvas.height);
      gl!.useProgram(particleProgram);
      gl!.uniform2f(pU.res, canvas.width, canvas.height);
      gl!.useProgram(glyphProgram);
      gl!.uniform2f(gU.res, canvas.width, canvas.height);
      if (reducedMotion) renderFrame(12000, 0.016);
    };

    // The location can be -1: the gas program never reads vKind/vAngle,
    // so its compiler may strip the attributes that feed them.
    const bindParticleAttribute = (loc: number, buffer: WebGLBuffer | null, size: number) => {
      if (loc < 0) return;
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
      gl!.enableVertexAttribArray(loc);
      gl!.vertexAttribPointer(loc, size, gl!.FLOAT, false, 0, 0);
    };

    const renderFrame = (timeMs: number, dtSec: number) => {
      const mixEase = 1 - Math.exp(-MIX_RATE * dtSec);
      const fadeEase = 1 - Math.exp(-MOUSE_FADE_RATE * dtSec);
      const velEase = 1 - Math.exp(-MOUSE_VEL_RATE * dtSec);

      const wantsSwap = state.pendingShape !== state.activeShape;
      const mixTarget = wantsSwap ? 0 : state.activeShape ? 1 : 0;
      state.mix += (mixTarget - state.mix) * mixEase;
      if (wantsSwap && state.mix < 0.03) {
        state.activeShape = state.pendingShape;
        uploadTargets(state.activeShape);
      }
      state.mouseActive += (state.mouseActiveTarget - state.mouseActive) * fadeEase;

      // Eased pointer position: everything downstream (parallax, wake,
      // velocity) reads this, never the raw quantized events.
      const posEase = 1 - Math.exp(-MOUSE_POS_RATE * dtSec);
      state.smoothMouse.x += (state.mouse.x - state.smoothMouse.x) * posEase;
      state.smoothMouse.y += (state.mouse.y - state.smoothMouse.y) * posEase;

      // Smoothed pointer velocity drives the directional wake. It decays
      // on its own when the pointer rests, so the gas settles back.
      const instVx = (state.smoothMouse.x - state.lastMouse.x) / dtSec;
      const instVy = (state.smoothMouse.y - state.lastMouse.y) / dtSec;
      state.lastMouse.x = state.smoothMouse.x;
      state.lastMouse.y = state.smoothMouse.y;
      state.mouseVel.x += (instVx - state.mouseVel.x) * velEase;
      state.mouseVel.y += (instVy - state.mouseVel.y) * velEase;

      const time = timeMs / 1000;

      if (isMini) {
        // Transparent canvas: the DOM starfield shows through.
        gl!.disable(gl!.BLEND);
        gl!.clearColor(0, 0, 0, 0);
        gl!.clear(gl!.COLOR_BUFFER_BIT);
      } else if (visible("background")) {
        // Pass 1: background (sky, stars, H II, cirrus).
        gl!.disable(gl!.BLEND);
        gl!.useProgram(bgProgram);
        gl!.uniform1f(bgU.time, time);
        gl!.uniform2f(bgU.mouse, state.smoothMouse.x, state.smoothMouse.y);
        gl!.uniform1f(bgU.mouseActive, state.mouseActive);
        gl!.bindBuffer(gl!.ARRAY_BUFFER, quadBuffer);
        const quadLoc = gl!.getAttribLocation(bgProgram, "aPosition");
        gl!.enableVertexAttribArray(quadLoc);
        gl!.vertexAttribPointer(quadLoc, 2, gl!.FLOAT, false, 0, 0);
        gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      } else {
        gl!.disable(gl!.BLEND);
        gl!.clearColor(0.004, 0.004, 0.006, 1);
        gl!.clear(gl!.COLOR_BUFFER_BIT);
      }

      // Pass 1.5: the dense dust of faint distant suns, as static
      // point geometry instead of per-pixel procedural stars. On the
      // mini variant the canvas is transparent, so the points land
      // additively over the DOM starfield.
      if (visible("distantStars")) {
        gl!.useProgram(denseProgram);
        gl!.uniform2f(dU.mouse, state.smoothMouse.x, state.smoothMouse.y);
        gl!.uniform1f(dU.mouseActive, state.mouseActive);
        bindParticleAttribute(dAttr.aStar, buffers.denseStar, 3);
        bindParticleAttribute(dAttr.aTint, buffers.denseTint, 4);
        gl!.enable(gl!.BLEND);
        gl!.blendFunc(gl!.ONE, gl!.ONE);
        gl!.drawArrays(gl!.POINTS, 0, DENSE_STAR_COUNT);
      }

      // Pass 2 + 3: particle nebulae. Gas draws through the original
      // lean program; wisp streaks and spike stars sit at the end of
      // their buckets and draw through the glyph program, so the tens
      // of thousands of gas sprites never pay for the glyph math.
      const applyParticleState = (
        program: WebGLProgram,
        u: Record<string, WebGLUniformLocation | null>,
        attrs: Record<string, number>
      ) => {
        gl!.useProgram(program);
        gl!.uniform1f(u.time, time);
        gl!.uniform2f(u.mouse, state.smoothMouse.x, state.smoothMouse.y);
        gl!.uniform2f(u.mouseVel, state.mouseVel.x, state.mouseVel.y);
        gl!.uniform1f(u.mouseActive, state.mouseActive);
        gl!.uniform1f(u.shapeMix, state.mix);
        bindParticleAttribute(attrs.aPos, buffers.position, 3);
        bindParticleAttribute(attrs.aData, buffers.data, 3);
        bindParticleAttribute(attrs.aCloud, buffers.cloud, 3);
        bindParticleAttribute(attrs.aColor, buffers.color, 4);
        bindParticleAttribute(attrs.aMotion, buffers.motion, 3);
        bindParticleAttribute(attrs.aTarget, buffers.target, 2);
        bindParticleAttribute(attrs.aAngle, buffers.angle, 1);
      };

      gl!.enable(gl!.BLEND);
      // Dust first: premultiplied over, so it occludes stars behind it.
      // Generation order layers it: volume under body under shells,
      // dark dust lanes on top, wisp streaks above the lanes.
      gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
      const dustGasCount = dustCount - wispCount;
      if (visible("gas") && dustGasCount > 0) {
        applyParticleState(particleProgram, pU, pAttr);
        gl!.drawArrays(gl!.POINTS, 0, dustGasCount);
      }
      if (visible("wisps") && wispCount > 0) {
        applyParticleState(glyphProgram, gU, gAttr);
        gl!.drawArrays(gl!.POINTS, dustGasCount, wispCount);
      }
      // Emission: additive glow, filament webs, then the spike stars.
      gl!.blendFunc(gl!.ONE, gl!.ONE);
      const emitGasCount = particleCount - dustCount - starCount;
      if (visible("emission") && emitGasCount > 0) {
        applyParticleState(particleProgram, pU, pAttr);
        gl!.drawArrays(gl!.POINTS, dustCount, emitGasCount);
      }
      if (visible("youngStars") && starCount > 0) {
        applyParticleState(glyphProgram, gU, gAttr);
        gl!.drawArrays(gl!.POINTS, particleCount - starCount, starCount);
      }

      // Pass 4: foreground stars, additive, in front of the gas.
      if (!isMini && visible("foregroundStars")) {
        gl!.useProgram(fgProgram);
        gl!.uniform1f(fgU.time, time);
        gl!.uniform2f(fgU.mouse, state.smoothMouse.x, state.smoothMouse.y);
        gl!.uniform1f(fgU.mouseActive, state.mouseActive);
        gl!.bindBuffer(gl!.ARRAY_BUFFER, quadBuffer);
        const fgLoc = gl!.getAttribLocation(fgProgram, "aPosition");
        gl!.enableVertexAttribArray(fgLoc);
        gl!.vertexAttribPointer(fgLoc, 2, gl!.FLOAT, false, 0, 0);
        gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      }
    };

    const loop = (time: number) => {
      if (!state.running) return;
      state.frame = requestAnimationFrame(loop);
      const elapsed = time - state.lastRenderTime;
      if (elapsed < FRAME_INTERVAL_MS) return;

      if (state.renderScale > REDUCED_RENDER_SCALE) {
        state.slowFrameStreak = elapsed > SLOW_FRAME_MS ? state.slowFrameStreak + 1 : 0;
        if (state.slowFrameStreak > 20) {
          state.renderScale = REDUCED_RENDER_SCALE;
          resize();
        }
      }

      state.lastRenderTime = time;
      renderFrame(time, Math.min(elapsed / 1000, 0.1));
    };

    // A trigger's data-nebula-shape can sit on the hovered/focused element
    // itself (nav links, TextLink, footer icons) or on a decorative span
    // nested inside a larger link (a card's title, a list row's CTA).
    // Pointer hover naturally lands on whichever element is innermost, so
    // closest() alone finds it; keyboard focus lands on the outer link, so
    // a descendant lookup is needed too.
    const resolveShapeKey = (
      el: Element | null,
      includeDescendants = false
    ): string | null => {
      if (!el) return null;
      const match =
        el.closest?.("[data-nebula-shape]") ??
        (includeDescendants ? el.querySelector?.("[data-nebula-shape]") : null);
      return match?.getAttribute("data-nebula-shape") ?? null;
    };

    const setPendingShape = (key: string | null) => {
      if (key === state.pendingShape) return;
      state.pendingShape = key;
      if (reducedMotion) {
        state.activeShape = key;
        uploadTargets(key);
        state.mix = key ? 1 : 0;
        renderFrame(12000, 0.016);
      }
    };

    const onPointerOver = (e: Event) => {
      if (!state.started) return;
      setPendingShape(resolveShapeKey(e.target as Element | null));
    };

    // Keyboard parity: focusing a trigger morphs the shape the same way
    // hovering it does. focusin/focusout bubble (focus/blur don't), so one
    // pair of document listeners covers every trigger on the page.
    const onFocusIn = (e: FocusEvent) => {
      if (!state.started) return;
      setPendingShape(resolveShapeKey(e.target as Element | null, true));
    };

    const onFocusOut = (e: FocusEvent) => {
      if (!state.started) return;
      // Tabbing directly from one trigger to another should hand off, not
      // flash back to "no shape" in between.
      if (resolveShapeKey(e.relatedTarget as Element | null, true) === null) {
        setPendingShape(null);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      // Map against the canvas, which can outsize the visual viewport
      // by the collapsed URL bar's height on mobile.
      state.mouse.x = e.clientX / (canvas.clientWidth || window.innerWidth);
      state.mouse.y = 1 - e.clientY / (canvas.clientHeight || window.innerHeight);
      state.mouseActiveTarget = 1;
    };

    const onPointerLeave = () => {
      state.mouseActiveTarget = 0;
    };

    // Touch: pointermove dies at pointercancel as soon as the browser
    // claims the pan gesture, so the wake never fires on phones.
    // Passive touchmove keeps reporting through the whole pan; drive
    // the same state from it.
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      state.mouse.x = touch.clientX / (canvas.clientWidth || window.innerWidth);
      state.mouse.y = 1 - touch.clientY / (canvas.clientHeight || window.innerHeight);
      state.mouseActiveTarget = 1;
    };

    const onTouchStart = (e: TouchEvent) => {
      onTouchMove(e);
      // First contact can land anywhere: snap the eased trackers so the
      // wake starts under the finger instead of sweeping in from the
      // last known position with a huge velocity spike.
      state.smoothMouse.x = state.mouse.x;
      state.smoothMouse.y = state.mouse.y;
      state.lastMouse.x = state.mouse.x;
      state.lastMouse.y = state.mouse.y;
      state.mouseVel.x = 0;
      state.mouseVel.y = 0;
    };

    const onTouchEnd = () => {
      state.mouseActiveTarget = 0;
    };

    const onVisibility = () => {
      if (!state.started) return;
      const visible = document.visibilityState === "visible";
      if (visible && !state.running && !reducedMotion) {
        state.running = true;
        state.frame = requestAnimationFrame(loop);
      } else if (!visible) {
        state.running = false;
        cancelAnimationFrame(state.frame);
      }
    };

    // Runs once all programs have finished compiling in the background.
    const start = () => {
      try {
        for (const program of activePrograms) finishProgram(gl!, program);
      } catch (error) {
        console.error("Nebula shaders failed, keeping starfield only:", error);
        return;
      }

      const seed = [Math.random(), Math.random(), Math.random(), Math.random()];
      const isDesktop = window.innerWidth >= 768;
      const jitter = () => (Math.random() - 0.5) * 0.06;

      // Particle count scales with footprint; the smaller clouds carry
      // finer structure, so they get a higher areal density.
      const countFor = (r: number, density: number) =>
        Math.max(1200, Math.min(24000, Math.round(density * r * r)));

      // Size the hero at ~30vmax, expressed in our min-axis radius units.
      const vRatio =
        Math.max(window.innerWidth, window.innerHeight) /
        Math.min(window.innerWidth, window.innerHeight);
      // Portrait gets its own scene below: no hero at all, two small
      // bright clouds in the open corners instead.
      const portrait = window.innerHeight > window.innerWidth;
      // A medium hero (~20vmax, down from ~30): big enough to anchor
      // the corner, small enough that its structure stays readable.
      const heroR = Math.min(0.38, (isDesktop ? 0.2 : 0.18) * vRatio);
      // Portrait clouds run ~80vmin: at 0.19 they read teeny on a
      // phone. The density constants below hold the counts where the
      // small clouds had them, so brightness and cost don't move.
      const ringR = isDesktop ? 0.21 : portrait ? 0.4 : 0.17;
      const webR = isDesktop ? 0.16 : portrait ? 0.17 : 0.13;
      const miniRadius = MINI_SIZE_RADIUS[size] ?? MINI_SIZE_RADIUS.md;
      const miniR = (isDesktop ? miniRadius.desktop : miniRadius.mobile) + Math.random() * 0.025;

      const [miniX, miniY] = MINI_CORNERS[corner];
      const pickedMiniShape =
        miniShape === "random"
          ? MINI_PROFILES[Math.floor(Math.random() * MINI_PROFILES.length)]
          : miniShape;
      const pickedMiniColor =
        color === "random" ? MINI_COLORS[Math.floor(Math.random() * MINI_COLORS.length)] : color;
      const clouds: CloudSpec[] = isDemo
        ? [{ x: 0.5, y: 0.5, radius: 0.34, profile: "helix", count: 15000 }]
        : isMini
        ? [
            {
              // One decorative cloud with independently selectable shape
              // and palette, larger than the original corner accent.
              x: miniX + jitter(),
              y: miniY + jitter(),
              radius: miniR,
              profile: pickedMiniShape,
              palette: miniPalettes[pickedMiniColor] ?? undefined,
              // Mobile density compensates the much larger radius so
              // the count — and with it per-pixel brightness and the
              // particle budget — matches the old small cloud.
              count: countFor(miniR, isDesktop ? 155000 : 30000),
            },
          ]
        : portrait
        ? [
            // Phones: the hero disc never had open sky to live in —
            // the card stack covers it and only a washed glow gets
            // through. Instead, the two strongest profiles run big
            // (~80vmin) and bright: an Orion cloud low, the amber ring
            // high. No web here; it reads as a smudge at phone sizes.
            // Ordered bottom-first so the tint pair (A low, B high)
            // lines up.
            {
              x: 0.35 + jitter(),
              y: 0.24 + jitter(),
              radius: ringR,
              profile: "orion",
              count: countFor(ringR, 45000),
              bright: 1.35,
            },
            {
              x: (Math.random() < 0.5 ? 0.3 : 0.7) + jitter(),
              y: 0.74 + jitter(),
              radius: ringR,
              profile: "helix",
              count: countFor(ringR, 41000),
              bright: 1.3,
            },
          ]
        : [
            {
              // The hero: an Orion-like structured cloud in the lower-right.
              // Dimmed a touch: per-pixel brightness follows areal
              // density, so the lower density and bright do the work.
              x: 0.74 + jitter(),
              y: 0.26 + jitter(),
              radius: heroR,
              profile: "orion",
              count: countFor(heroR, 80000),
              bright: 0.9,
            },
            {
              // A Helix-like broken ring up top, opposite the hero.
              x: (Math.random() < 0.5 ? 0.2 : 0.84) + jitter(),
              y: 0.8 + jitter(),
              radius: ringR,
              profile: "helix",
              count: countFor(ringR, 160000),
            },
            {
              // A Crab-like filament web anchoring the bottom-left.
              x: 0.14 + jitter(),
              y: 0.22 + jitter(),
              radius: webR,
              profile: "crab",
              count: countFor(webR, 170000),
            },
          ];

      // Particle buffers.
      const particles = generateParticles(clouds);
      particleCount = particles.count;
      dustCount = particles.dustCount;
      wispCount = particles.wispCount;
      starCount = particles.starCount;
      particleRoles = particles.roles;
      particleSeeds = new Float32Array(particleCount);
      for (let i = 0; i < particleCount; i++) {
        particleSeeds[i] = particles.data[i * 3 + 1];
      }

      const makeBuffer = (data: Float32Array): WebGLBuffer | null => {
        const buffer = gl!.createBuffer();
        gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
        gl!.bufferData(gl!.ARRAY_BUFFER, data, gl!.STATIC_DRAW);
        return buffer;
      };
      buffers = {
        position: makeBuffer(particles.position),
        data: makeBuffer(particles.data),
        cloud: makeBuffer(particles.cloud),
        color: makeBuffer(particles.color),
        motion: makeBuffer(particles.motion),
        angle: makeBuffer(particles.angle),
        target: makeBuffer(new Float32Array(particleCount * 2)),
      };

      quadBuffer = gl!.createBuffer();
      gl!.bindBuffer(gl!.ARRAY_BUFFER, quadBuffer);
      gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl!.STATIC_DRAW);

      if (!isMini) {
        // Uniforms: background program. The wash tints come from the
        // profiles: A follows the lowest cloud, B the upper one. The
        // portrait scene has no third cloud; the cool accent falls
        // back to the first (the teal web).
        const palA = profilePalettes[clouds[0].profile].bg;
        const palB = profilePalettes[(clouds[1] ?? clouds[0]).profile].bg;
        const palC = profilePalettes[(clouds[2] ?? clouds[0]).profile].bg;
        gl!.useProgram(bgProgram);
        bgU = {
          res: gl!.getUniformLocation(bgProgram, "uRes"),
          time: gl!.getUniformLocation(bgProgram, "uTime"),
          mouse: gl!.getUniformLocation(bgProgram, "uMouse"),
          mouseActive: gl!.getUniformLocation(bgProgram, "uMouseActive"),
        };
        gl!.uniform4f(gl!.getUniformLocation(bgProgram, "uSeed"), seed[0], seed[1], seed[2], seed[3]);
        clouds.forEach((c, i) => {
          gl!.uniform4f(gl!.getUniformLocation(bgProgram, `uCloud${i}`), c.x, c.y, c.radius, 1);
        });
        const hiiSpots: [number, number][] = [
          [0.5, 0.9],
          [0.15, 0.5],
          [0.85, 0.55],
          [0.5, 0.1],
        ];
        hiiSpots.sort(() => Math.random() - 0.5);
        for (let i = 0; i < 2; i++) {
          gl!.uniform4f(
            gl!.getUniformLocation(bgProgram, `uHii${i}`),
            hiiSpots[i][0] + jitter(),
            hiiSpots[i][1] + jitter(),
            0.55 + Math.random() * 0.35,
            0.5 + Math.random() * 0.4
          );
        }
        gl!.uniform3f(gl!.getUniformLocation(bgProgram, "uColCoreA"), ...palA.core);
        gl!.uniform3f(gl!.getUniformLocation(bgProgram, "uColCoreB"), ...palB.core);
        gl!.uniform3f(gl!.getUniformLocation(bgProgram, "uColMidA"), ...palA.mid);
        gl!.uniform3f(gl!.getUniformLocation(bgProgram, "uColMidB"), ...palB.mid);
        gl!.uniform3f(gl!.getUniformLocation(bgProgram, "uColFilA"), ...palA.fil);
        gl!.uniform3f(gl!.getUniformLocation(bgProgram, "uColFilB"), ...palB.fil);
        gl!.uniform3f(gl!.getUniformLocation(bgProgram, "uColBlue"), ...palC.core);
      }

      // Uniforms and attributes: particle program.
      gl!.useProgram(particleProgram);
      pU = {
        res: gl!.getUniformLocation(particleProgram, "uRes"),
        time: gl!.getUniformLocation(particleProgram, "uTime"),
        mouse: gl!.getUniformLocation(particleProgram, "uMouse"),
        mouseVel: gl!.getUniformLocation(particleProgram, "uMouseVel"),
        mouseActive: gl!.getUniformLocation(particleProgram, "uMouseActive"),
        shapeMix: gl!.getUniformLocation(particleProgram, "uShapeMix"),
      };
      pAttr = {
        aPos: gl!.getAttribLocation(particleProgram, "aPos"),
        aData: gl!.getAttribLocation(particleProgram, "aData"),
        aCloud: gl!.getAttribLocation(particleProgram, "aCloud"),
        aColor: gl!.getAttribLocation(particleProgram, "aColor"),
        aMotion: gl!.getAttribLocation(particleProgram, "aMotion"),
        aTarget: gl!.getAttribLocation(particleProgram, "aTarget"),
        aAngle: gl!.getAttribLocation(particleProgram, "aAngle"),
      };

      // Uniforms and attributes: glyph program (same vertex shader).
      gl!.useProgram(glyphProgram);
      gU = {
        res: gl!.getUniformLocation(glyphProgram, "uRes"),
        time: gl!.getUniformLocation(glyphProgram, "uTime"),
        mouse: gl!.getUniformLocation(glyphProgram, "uMouse"),
        mouseVel: gl!.getUniformLocation(glyphProgram, "uMouseVel"),
        mouseActive: gl!.getUniformLocation(glyphProgram, "uMouseActive"),
        shapeMix: gl!.getUniformLocation(glyphProgram, "uShapeMix"),
      };
      gAttr = {
        aPos: gl!.getAttribLocation(glyphProgram, "aPos"),
        aData: gl!.getAttribLocation(glyphProgram, "aData"),
        aCloud: gl!.getAttribLocation(glyphProgram, "aCloud"),
        aColor: gl!.getAttribLocation(glyphProgram, "aColor"),
        aMotion: gl!.getAttribLocation(glyphProgram, "aMotion"),
        aTarget: gl!.getAttribLocation(glyphProgram, "aTarget"),
        aAngle: gl!.getAttribLocation(glyphProgram, "aAngle"),
      };

      // Uniforms: foreground star program.
      if (!isMini) {
        gl!.useProgram(fgProgram);
        fgU = {
          res: gl!.getUniformLocation(fgProgram, "uRes"),
          time: gl!.getUniformLocation(fgProgram, "uTime"),
          mouse: gl!.getUniformLocation(fgProgram, "uMouse"),
          mouseActive: gl!.getUniformLocation(fgProgram, "uMouseActive"),
        };
        gl!.uniform4f(gl!.getUniformLocation(fgProgram, "uSeed"), seed[0], seed[1], seed[2], seed[3]);
      }

      // Dense distant stars, on every variant: one-time random
      // geometry, faint-heavy brightness skew, warm/cool tint spread.
      dU = {
        res: gl!.getUniformLocation(denseProgram, "uRes"),
        mouse: gl!.getUniformLocation(denseProgram, "uMouse"),
        mouseActive: gl!.getUniformLocation(denseProgram, "uMouseActive"),
      };
      dAttr = {
        aStar: gl!.getAttribLocation(denseProgram, "aStar"),
        aTint: gl!.getAttribLocation(denseProgram, "aTint"),
      };
      const starData = new Float32Array(DENSE_STAR_COUNT * 3);
      const tintData = new Float32Array(DENSE_STAR_COUNT * 4);
      for (let i = 0; i < DENSE_STAR_COUNT; i++) {
        const m = Math.random();
        const cool = Math.random();
        starData[i * 3] = Math.random();
        starData[i * 3 + 1] = Math.random();
        starData[i * 3 + 2] = 1 + 1.3 * Math.random() + (Math.random() < 0.05 ? 1.1 : 0);
        tintData[i * 4] = 1 - 0.25 * cool;
        tintData[i * 4 + 1] = 0.87 - 0.02 * cool;
        tintData[i * 4 + 2] = 0.72 + 0.28 * cool;
        tintData[i * 4 + 3] = 0.1 + 0.45 * m * m;
      }
      buffers.denseStar = makeBuffer(starData);
      buffers.denseTint = makeBuffer(tintData);

      state.started = true;
      // Fresh programs know nothing: force the next resize to upload
      // even if the backing size is unchanged (context restore reuses
      // this state object).
      state.uploadedW = 0;
      state.uploadedH = 0;
      resize();

      if (!reducedMotion) {
        state.running = true;
        state.frame = requestAnimationFrame(loop);
      } else {
        renderFrame(12000, 0.016);
      }

      // Reveal: the starfield covered the compile wait; fade the nebula in.
      canvas.style.opacity = "1";
    };

    // Poll for compile completion without blocking the main thread.
    const waitForCompile = () => {
      if (state.disposed) return;
      if (
        parallelCompile &&
        activePrograms.some(
          (program) => !gl!.getProgramParameter(program, parallelCompile!.COMPLETION_STATUS_KHR)
        )
      ) {
        state.frame = requestAnimationFrame(waitForCompile);
        return;
      }
      start();
    };

    // Compiles the programs and kicks off the async-compile poll. Runs
    // either immediately or after a parked context is restored.
    const boot = () => {
      if (state.disposed) return;
      try {
        particleProgram = beginProgram(gl!, PARTICLE_VERTEX_SRC, PARTICLE_FRAGMENT_SRC);
        glyphProgram = beginProgram(gl!, PARTICLE_VERTEX_SRC, GLYPH_FRAGMENT_SRC);
        denseProgram = beginProgram(gl!, DENSE_STAR_VERTEX_SRC, DENSE_STAR_FRAGMENT_SRC);
        activePrograms = [particleProgram, glyphProgram, denseProgram];
        if (!isMini) {
          bgProgram = beginProgram(gl!, VERTEX_SRC, BACKGROUND_FRAGMENT_SRC);
          fgProgram = beginProgram(gl!, VERTEX_SRC, FOREGROUND_FRAGMENT_SRC);
          activePrograms.push(bgProgram, fgProgram);
        }
      } catch (error) {
        console.error("Nebula shaders failed, keeping starfield only:", error);
        return;
      }
      parallelCompile = gl!.getExtension("KHR_parallel_shader_compile");
      waitForCompile();
    };
    const onContextRestored = () => boot();
    // Without preventDefault here, a lost context can never be restored.
    const onContextLost = (e: Event) => e.preventDefault();

    window.addEventListener("resize", resize);
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    if (!reducedMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave);
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onTouchEnd, { passive: true });
      window.addEventListener("touchcancel", onTouchEnd, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
    }

    if (gl.isContextLost()) {
      // The context died while the router kept this canvas alive (e.g.
      // GPU eviction). A canvas only ever has one context, so ask for
      // that same one back; boot() runs from the restored event.
      gl.getExtension("WEBGL_lose_context")?.restoreContext();
    } else {
      boot();
    }

    return () => {
      state.disposed = true;
      state.running = false;
      cancelAnimationFrame(state.frame);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      window.removeEventListener("resize", resize);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      document.removeEventListener("visibilitychange", onVisibility);
      // Do NOT loseContext() here: the router keeps this canvas alive
      // across navigations and a parked context cannot reliably be
      // revived, which left the page nebula-less on return. Free the
      // heavy GPU resources instead and let the context idle.
      if (gl && !gl.isContextLost()) {
        for (const buffer of Object.values(buffers)) {
          if (buffer) gl.deleteBuffer(buffer);
        }
        if (quadBuffer) gl.deleteBuffer(quadBuffer);
        for (const program of activePrograms) {
          gl.deleteProgram(program);
        }
      }
    };
  }, [variant, corner, miniShape, color, size]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      // Starts invisible; start() fades it in once the shaders compile,
      // so the DOM starfield covers the wait. h-lvh, not h-full: the
      // largest-viewport unit ignores the mobile URL bar collapsing,
      // so the sky doesn't shift and re-snap while scrolling.
      className={variant === "demo"
        ? "pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-1000"
        : "pointer-events-none fixed inset-x-0 top-0 -z-10 h-lvh w-full opacity-0 transition-opacity duration-1000"}
    />
  );
}
