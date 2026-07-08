"use client";

import { useEffect, useRef } from "react";
import {
  BACKGROUND_FRAGMENT_SRC,
  FOREGROUND_FRAGMENT_SRC,
  PARTICLE_FRAGMENT_SRC,
  PARTICLE_VERTEX_SRC,
  VERTEX_SRC,
} from "@/lib/nebula/glsl";
import { beginProgram, finishProgram } from "@/lib/nebula/webgl";
import { generateParticles, sampleShapeTargets, CloudSpec } from "@/lib/nebula/particles";
import { nebulaPalettes } from "@/lib/nebula/palettes";

const TARGET_POOL = 1024; // glyph sample points per shape
const BASE_RENDER_SCALE = 0.66;
const REDUCED_RENDER_SCALE = 0.45; // adaptive fallback for slow GPUs
const FRAME_INTERVAL_MS = 16;
const SLOW_FRAME_MS = 55;
const MIX_RATE = 2.5; // 1/s, ease toward the glyph target (slower morph)
const MOUSE_FADE_RATE = 4; // 1/s, push fade only; position is direct

/**
 * Procedurally generated deep-space background, unique per page load.
 * A cheap fullscreen pass draws sky, stars, H II fields, and cirrus;
 * the nebulae themselves are thousands of soft point sprites (dust
 * alpha-blended, emission additive). Hovering an element with
 * data-nebula-shape="<key>" flies the emission particles into that
 * glyph. The pointer pushes particles aside like a hand through fog.
 *
 * Shaders compile asynchronously; the canvas fades in when ready.
 * Falls back to nothing if WebGL is unavailable (the starfield remains).
 */
export default function NebulaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      gl = null;
    }
    if (!gl) return;

    let bgProgram: WebGLProgram;
    let particleProgram: WebGLProgram;
    let fgProgram: WebGLProgram;
    try {
      bgProgram = beginProgram(gl, VERTEX_SRC, BACKGROUND_FRAGMENT_SRC);
      particleProgram = beginProgram(gl, PARTICLE_VERTEX_SRC, PARTICLE_FRAGMENT_SRC);
      fgProgram = beginProgram(gl, VERTEX_SRC, FOREGROUND_FRAGMENT_SRC);
    } catch (error) {
      console.error("Nebula shaders failed, keeping starfield only:", error);
      return;
    }
    const parallelCompile = gl.getExtension("KHR_parallel_shader_compile");

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const state = {
      disposed: false,
      started: false,
      running: false,
      frame: 0,
      renderScale: BASE_RENDER_SCALE,
      lastRenderTime: 0,
      slowFrameStreak: 0,
      mix: 0,
      activeShape: null as string | null,
      pendingShape: null as string | null,
      mouse: { x: 0.5, y: 0.5 },
      mouseActive: 0,
      mouseActiveTarget: 0,
    };

    let bgU: Record<string, WebGLUniformLocation | null> = {};
    let pU: Record<string, WebGLUniformLocation | null> = {};
    let fgU: Record<string, WebGLUniformLocation | null> = {};
    let pAttr: Record<string, number> = {};
    let quadBuffer: WebGLBuffer | null = null;
    let buffers: Record<string, WebGLBuffer | null> = {};
    let particleSeeds: Float32Array = new Float32Array(0);
    let particleCount = 0;
    let dustCount = 0;
    const targetCache = new Map<string, Float32Array>();

    const uploadTargets = (key: string | null) => {
      if (!key) return; // mix eases to 0; stale targets are invisible
      let pool = targetCache.get(key);
      if (!pool) {
        pool = sampleShapeTargets(key, TARGET_POOL);
        targetCache.set(key, pool);
      }
      const targets = new Float32Array(particleCount * 2);
      for (let i = 0; i < particleCount; i++) {
        const idx = Math.floor(particleSeeds[i] * (TARGET_POOL - 1));
        targets[i * 2] = pool[idx * 2];
        targets[i * 2 + 1] = pool[idx * 2 + 1];
      }
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buffers.target);
      gl!.bufferData(gl!.ARRAY_BUFFER, targets, gl!.DYNAMIC_DRAW);
    };

    const resize = () => {
      if (!state.started) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * state.renderScale;
      canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
      gl!.viewport(0, 0, canvas.width, canvas.height);
      gl!.useProgram(bgProgram);
      gl!.uniform2f(bgU.res, canvas.width, canvas.height);
      gl!.useProgram(particleProgram);
      gl!.uniform2f(pU.res, canvas.width, canvas.height);
      gl!.useProgram(fgProgram);
      gl!.uniform2f(fgU.res, canvas.width, canvas.height);
      if (reducedMotion) renderFrame(12000, 0.016);
    };

    const bindParticleAttribute = (name: string, buffer: WebGLBuffer | null, size: number) => {
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
      gl!.enableVertexAttribArray(pAttr[name]);
      gl!.vertexAttribPointer(pAttr[name], size, gl!.FLOAT, false, 0, 0);
    };

    const renderFrame = (timeMs: number, dtSec: number) => {
      const mixEase = 1 - Math.exp(-MIX_RATE * dtSec);
      const fadeEase = 1 - Math.exp(-MOUSE_FADE_RATE * dtSec);

      const wantsSwap = state.pendingShape !== state.activeShape;
      const mixTarget = wantsSwap ? 0 : state.activeShape ? 1 : 0;
      state.mix += (mixTarget - state.mix) * mixEase;
      if (wantsSwap && state.mix < 0.03) {
        state.activeShape = state.pendingShape;
        uploadTargets(state.activeShape);
      }
      state.mouseActive += (state.mouseActiveTarget - state.mouseActive) * fadeEase;

      const time = timeMs / 1000;

      // Pass 1: background (sky, stars, H II, cirrus).
      gl!.disable(gl!.BLEND);
      gl!.useProgram(bgProgram);
      gl!.uniform1f(bgU.time, time);
      gl!.uniform2f(bgU.mouse, state.mouse.x, state.mouse.y);
      gl!.uniform1f(bgU.mouseActive, state.mouseActive);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, quadBuffer);
      const quadLoc = gl!.getAttribLocation(bgProgram, "aPosition");
      gl!.enableVertexAttribArray(quadLoc);
      gl!.vertexAttribPointer(quadLoc, 2, gl!.FLOAT, false, 0, 0);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);

      // Pass 2 + 3: particle nebulae.
      gl!.useProgram(particleProgram);
      gl!.uniform1f(pU.time, time);
      gl!.uniform2f(pU.mouse, state.mouse.x, state.mouse.y);
      gl!.uniform1f(pU.mouseActive, state.mouseActive);
      gl!.uniform1f(pU.shapeMix, state.mix);
      bindParticleAttribute("aPos", buffers.position, 3);
      bindParticleAttribute("aData", buffers.data, 3);
      bindParticleAttribute("aCloud", buffers.cloud, 3);
      bindParticleAttribute("aShade", buffers.shade, 2);
      bindParticleAttribute("aPalette", buffers.palette, 1);
      bindParticleAttribute("aBright", buffers.bright, 1);
      bindParticleAttribute("aTarget", buffers.target, 2);

      gl!.enable(gl!.BLEND);
      // Dust first: premultiplied over, so it occludes stars behind it.
      gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
      if (dustCount > 0) gl!.drawArrays(gl!.POINTS, 0, dustCount);
      // Emission: additive glow.
      gl!.blendFunc(gl!.ONE, gl!.ONE);
      if (particleCount > dustCount) {
        gl!.drawArrays(gl!.POINTS, dustCount, particleCount - dustCount);
      }

      // Pass 4: foreground stars, additive, in front of the gas.
      gl!.useProgram(fgProgram);
      gl!.uniform1f(fgU.time, time);
      gl!.uniform2f(fgU.mouse, state.mouse.x, state.mouse.y);
      gl!.uniform1f(fgU.mouseActive, state.mouseActive);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, quadBuffer);
      const fgLoc = gl!.getAttribLocation(fgProgram, "aPosition");
      gl!.enableVertexAttribArray(fgLoc);
      gl!.vertexAttribPointer(fgLoc, 2, gl!.FLOAT, false, 0, 0);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
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

    const onPointerOver = (e: Event) => {
      if (!state.started) return;
      const target = (e.target as Element | null)?.closest?.("[data-nebula-shape]");
      const key = target?.getAttribute("data-nebula-shape") ?? null;
      if (key !== state.pendingShape) {
        state.pendingShape = key;
        if (reducedMotion) {
          state.activeShape = key;
          uploadTargets(key);
          state.mix = key ? 1 : 0;
          renderFrame(12000, 0.016);
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      state.mouse.x = e.clientX / window.innerWidth;
      state.mouse.y = 1 - e.clientY / window.innerHeight;
      state.mouseActiveTarget = 1;
    };

    const onPointerLeave = () => {
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

    // Runs once both programs have finished compiling in the background.
    const start = () => {
      try {
        finishProgram(gl!, bgProgram);
        finishProgram(gl!, particleProgram);
        finishProgram(gl!, fgProgram);
      } catch (error) {
        console.error("Nebula shaders failed, keeping starfield only:", error);
        return;
      }

      // Per-load identity: seed and three palettes.
      //   0 = pillars (ochre/teal), 1 = red H-alpha, 2 = reflection blue.
      const seed = [Math.random(), Math.random(), Math.random(), Math.random()];
      const findPal = (name: string, fallback: number) =>
        nebulaPalettes.find((p) => p.name === name) ?? nebulaPalettes[fallback];
      const palA = findPal("pillars", 0);
      const palB = findPal("horsehead", 1);
      const palC = findPal("reflection", 3);
      const palettes = [palA, palB, palC];

      // Wider viewports get more, bigger pillars.
      const isDesktop = window.innerWidth >= 768;
      const jitter = () => (Math.random() - 0.5) * 0.06;

      // Particle count scales with footprint so density stays constant:
      // big clouds do not go transparent, small clouds do not blow out.
      const countFor = (r: number, shape: "pillar" | "round", spread = 1) => {
        const density = 68000;
        const area = r * r * (shape === "pillar" ? spread : 0.9);
        return Math.max(900, Math.min(30000, Math.round(density * area)));
      };

      // Size the hero at ~30vmax, expressed in our min-axis radius units.
      const vRatio =
        Math.max(window.innerWidth, window.innerHeight) /
        Math.min(window.innerWidth, window.innerHeight);
      const heroR = Math.min(0.58, (isDesktop ? 0.3 : 0.26) * vRatio);
      const heroSpread = isDesktop ? 1.35 : 1.1; // narrower: upright columns, not a fan
      const topR = 0.2;
      const cornerR = 0.15;

      const clouds: CloudSpec[] = [
        {
          // The hero: a big, wide bank of pillars in the lower-right.
          // Finer sprites so the larger cloud stays crisp, not blurry.
          x: 0.8 + jitter(),
          y: 0.17 + jitter(),
          radius: heroR,
          strength: 1.0 + Math.random() * 0.3,
          paletteGroup: 0,
          shape: "pillar",
          fingerCount: isDesktop ? 4 : 2 + Math.floor(Math.random() * 2),
          spread: heroSpread,
          count: countFor(heroR, "pillar", heroSpread),
          sizeScale: 0.8,
        },
        {
          // An irregular round red cloud up top.
          x: (Math.random() < 0.5 ? 0.18 : 0.82) + jitter(),
          y: 0.82 + jitter(),
          radius: topR,
          strength: 0.8 + Math.random() * 0.3,
          paletteGroup: 1,
          shape: "round",
          count: countFor(topR, "round"),
          bright: 2.2,
        },
        {
          // A smaller irregular blue cloud anchoring the bottom-left.
          x: 0.16 + jitter(),
          y: 0.2 + jitter(),
          radius: cornerR,
          strength: 0.65 + Math.random() * 0.3,
          paletteGroup: 2,
          shape: "round",
          count: countFor(cornerR, "round"),
          bright: 2.2,
        },
      ];

      // Particle buffers.
      const particles = generateParticles(clouds.filter((c) => c.strength > 0));
      particleCount = particles.count;
      dustCount = particles.dustCount;
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
        shade: makeBuffer(particles.shade),
        palette: makeBuffer(particles.palette),
        bright: makeBuffer(particles.bright),
        target: makeBuffer(new Float32Array(particleCount * 2)),
      };

      quadBuffer = gl!.createBuffer();
      gl!.bindBuffer(gl!.ARRAY_BUFFER, quadBuffer);
      gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl!.STATIC_DRAW);

      // Uniforms: background program.
      gl!.useProgram(bgProgram);
      bgU = {
        res: gl!.getUniformLocation(bgProgram, "uRes"),
        time: gl!.getUniformLocation(bgProgram, "uTime"),
        mouse: gl!.getUniformLocation(bgProgram, "uMouse"),
        mouseActive: gl!.getUniformLocation(bgProgram, "uMouseActive"),
      };
      gl!.uniform4f(gl!.getUniformLocation(bgProgram, "uSeed"), seed[0], seed[1], seed[2], seed[3]);
      clouds.forEach((c, i) => {
        gl!.uniform4f(gl!.getUniformLocation(bgProgram, `uCloud${i}`), c.x, c.y, c.radius, c.strength);
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
      gl!.uniform3f(gl!.getUniformLocation(bgProgram, "uColFilA"), ...palA.filament);
      gl!.uniform3f(gl!.getUniformLocation(bgProgram, "uColFilB"), ...palB.filament);
      gl!.uniform3f(gl!.getUniformLocation(bgProgram, "uColBlue"), ...palC.core);

      // Uniforms and attributes: particle program.
      gl!.useProgram(particleProgram);
      pU = {
        res: gl!.getUniformLocation(particleProgram, "uRes"),
        time: gl!.getUniformLocation(particleProgram, "uTime"),
        mouse: gl!.getUniformLocation(particleProgram, "uMouse"),
        mouseActive: gl!.getUniformLocation(particleProgram, "uMouseActive"),
        shapeMix: gl!.getUniformLocation(particleProgram, "uShapeMix"),
      };
      palettes.forEach((p, i) => {
        gl!.uniform3f(gl!.getUniformLocation(particleProgram, `uCore[${i}]`), ...p.core);
        gl!.uniform3f(gl!.getUniformLocation(particleProgram, `uMid[${i}]`), ...p.mid);
        gl!.uniform3f(gl!.getUniformLocation(particleProgram, `uFil[${i}]`), ...p.filament);
        gl!.uniform3f(gl!.getUniformLocation(particleProgram, `uWarm[${i}]`), ...p.warm);
        gl!.uniform1f(gl!.getUniformLocation(particleProgram, `uDustS[${i}]`), p.dust);
      });
      pAttr = {
        aPos: gl!.getAttribLocation(particleProgram, "aPos"),
        aData: gl!.getAttribLocation(particleProgram, "aData"),
        aCloud: gl!.getAttribLocation(particleProgram, "aCloud"),
        aShade: gl!.getAttribLocation(particleProgram, "aShade"),
        aPalette: gl!.getAttribLocation(particleProgram, "aPalette"),
        aBright: gl!.getAttribLocation(particleProgram, "aBright"),
        aTarget: gl!.getAttribLocation(particleProgram, "aTarget"),
      };

      // Uniforms: foreground star program.
      gl!.useProgram(fgProgram);
      fgU = {
        res: gl!.getUniformLocation(fgProgram, "uRes"),
        time: gl!.getUniformLocation(fgProgram, "uTime"),
        mouse: gl!.getUniformLocation(fgProgram, "uMouse"),
        mouseActive: gl!.getUniformLocation(fgProgram, "uMouseActive"),
      };
      gl!.uniform4f(gl!.getUniformLocation(fgProgram, "uSeed"), seed[0], seed[1], seed[2], seed[3]);

      state.started = true;
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
        (!gl!.getProgramParameter(bgProgram, parallelCompile.COMPLETION_STATUS_KHR) ||
          !gl!.getProgramParameter(particleProgram, parallelCompile.COMPLETION_STATUS_KHR) ||
          !gl!.getProgramParameter(fgProgram, parallelCompile.COMPLETION_STATUS_KHR))
      ) {
        state.frame = requestAnimationFrame(waitForCompile);
        return;
      }
      start();
    };

    window.addEventListener("resize", resize);
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    if (!reducedMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave);
      document.addEventListener("visibilitychange", onVisibility);
    }
    waitForCompile();

    return () => {
      state.disposed = true;
      state.running = false;
      cancelAnimationFrame(state.frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("pointerover", onPointerOver);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      // Starts invisible; start() fades it in once the shaders compile,
      // so the DOM starfield covers the wait.
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-0 transition-opacity duration-1000"
    />
  );
}
