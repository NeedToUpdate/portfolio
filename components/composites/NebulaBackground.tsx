"use client";

import { useEffect, useRef } from "react";
import { FRAGMENT_SRC, VERTEX_SRC } from "@/lib/nebula/glsl";
import {
  beginProgram,
  finishProgram,
  setupFullscreenQuad,
  uploadLuminanceTexture,
} from "@/lib/nebula/webgl";
import { buildShapeField, emptyField } from "@/lib/nebula/sdf";
import { pickPalette } from "@/lib/nebula/palettes";
import { nebulaShapes } from "@/lib/nebula/shapes";

const SDF_SIZE = 256;
const BASE_RENDER_SCALE = 0.5; // gas is soft; render small and upscale
const REDUCED_RENDER_SCALE = 0.35; // adaptive fallback for slow GPUs
const FRAME_INTERVAL_MS = 25; // ~40fps cadence
const SLOW_FRAME_MS = 55; // sustained frames above this trigger the fallback
const MIX_RATE = 5; // 1/s, exponential ease toward the shape target
const MOUSE_FADE_RATE = 4; // 1/s, ease for push fade-out only; position is direct

/**
 * Procedurally generated deep-space background, unique per page load.
 * Hovering any element with data-nebula-shape="<key>" morphs the
 * foreground molecular clouds into that shape's distance field. The
 * pointer pushes the gas aside like a hand through fog.
 *
 * The shader is compiled asynchronously (KHR_parallel_shader_compile)
 * so the page never blocks; rendering runs at a capped cadence with
 * time-based easing, and drops resolution if the GPU cannot keep up.
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

    let program: WebGLProgram;
    try {
      program = beginProgram(gl, VERTEX_SRC, FRAGMENT_SRC);
    } catch (error) {
      console.error("Nebula shader failed, keeping starfield only:", error);
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

    let u: Record<string, WebGLUniformLocation | null> = {};
    let shapeTexture: WebGLTexture | null = null;
    const fieldCache = new Map<string, Uint8Array>();

    const getField = (key: string | null): Uint8Array => {
      if (!key || !nebulaShapes[key]) return emptyField(SDF_SIZE);
      let field = fieldCache.get(key);
      if (!field) {
        field = buildShapeField(nebulaShapes[key], SDF_SIZE);
        fieldCache.set(key, field);
      }
      return field;
    };

    const resize = () => {
      if (!state.started) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25) * state.renderScale;
      canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
      gl!.viewport(0, 0, canvas.width, canvas.height);
      gl!.uniform2f(u.res, canvas.width, canvas.height);
      if (reducedMotion) renderFrame(12000, 0.016);
    };

    const renderFrame = (timeMs: number, dtSec: number) => {
      // Time-based easing: feel is identical at any frame rate.
      const mixEase = 1 - Math.exp(-MIX_RATE * dtSec);
      const fadeEase = 1 - Math.exp(-MOUSE_FADE_RATE * dtSec);

      const wantsSwap = state.pendingShape !== state.activeShape;
      const mixTarget = wantsSwap ? 0 : state.activeShape ? 1 : 0;
      state.mix += (mixTarget - state.mix) * mixEase;
      if (wantsSwap && state.mix < 0.03) {
        state.activeShape = state.pendingShape;
        uploadLuminanceTexture(gl!, shapeTexture!, getField(state.activeShape), SDF_SIZE);
      }

      // Pointer position is direct; only presence fades in and out.
      state.mouseActive += (state.mouseActiveTarget - state.mouseActive) * fadeEase;

      gl!.uniform1f(u.time, timeMs / 1000);
      gl!.uniform2f(u.mouse, state.mouse.x, state.mouse.y);
      gl!.uniform1f(u.mouseActive, state.mouseActive);
      gl!.uniform1f(u.shapeMix, state.mix);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    };

    const loop = (time: number) => {
      if (!state.running) return;
      state.frame = requestAnimationFrame(loop);

      const elapsed = time - state.lastRenderTime;
      if (elapsed < FRAME_INTERVAL_MS) return; // cap the render cadence

      // Adaptive quality: sustained slow frames drop the resolution once.
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
          state.mix = key ? 1 : 0;
          uploadLuminanceTexture(gl!, shapeTexture!, getField(key), SDF_SIZE);
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

    // Runs once the program has finished compiling in the background.
    const start = () => {
      try {
        finishProgram(gl!, program);
      } catch (error) {
        console.error("Nebula shader failed, keeping starfield only:", error);
        return;
      }
      gl!.useProgram(program);
      setupFullscreenQuad(gl!, program, "aPosition");

      u = {
        res: gl!.getUniformLocation(program, "uRes"),
        time: gl!.getUniformLocation(program, "uTime"),
        mouse: gl!.getUniformLocation(program, "uMouse"),
        mouseActive: gl!.getUniformLocation(program, "uMouseActive"),
        seed: gl!.getUniformLocation(program, "uSeed"),
        cloud0: gl!.getUniformLocation(program, "uCloud0"),
        cloud1: gl!.getUniformLocation(program, "uCloud1"),
        cloud2: gl!.getUniformLocation(program, "uCloud2"),
        hii0: gl!.getUniformLocation(program, "uHii0"),
        hii1: gl!.getUniformLocation(program, "uHii1"),
        colCore: gl!.getUniformLocation(program, "uColCore"),
        colMid: gl!.getUniformLocation(program, "uColMid"),
        colFil: gl!.getUniformLocation(program, "uColFil"),
        dust: gl!.getUniformLocation(program, "uDust"),
        shape: gl!.getUniformLocation(program, "uShape"),
        shapeMix: gl!.getUniformLocation(program, "uShapeMix"),
      };

      // Per-load identity: seed, palette, and placements.
      const seed = [Math.random(), Math.random(), Math.random(), Math.random()];
      const palette = pickPalette(Math.random());
      gl!.uniform4f(u.seed, seed[0], seed[1], seed[2], seed[3]);
      gl!.uniform3f(u.colCore, ...palette.core);
      gl!.uniform3f(u.colMid, ...palette.mid);
      gl!.uniform3f(u.colFil, ...palette.filament);
      gl!.uniform1f(u.dust, palette.dust);

      // Molecular clouds hug the corners so the center stays black.
      const corners: [number, number][] = [
        [0.12, 0.16],
        [0.88, 0.14],
        [0.10, 0.85],
        [0.90, 0.83],
      ];
      corners.sort(() => Math.random() - 0.5);
      const cloudCount = Math.random() < 0.45 ? 3 : 2;
      const jitter = () => (Math.random() - 0.5) * 0.1;
      const cloudUniform = (index: number): [number, number, number, number] => {
        if (index >= cloudCount) return [0, 0, 1, 0];
        const [cx, cy] = corners[index];
        return [cx + jitter(), cy + jitter(), 0.34 + Math.random() * 0.28, 0.7 + Math.random() * 0.5];
      };
      gl!.uniform4f(u.cloud0, ...cloudUniform(0));
      gl!.uniform4f(u.cloud1, ...cloudUniform(1));
      gl!.uniform4f(u.cloud2, ...cloudUniform(2));

      // H II regions: larger, dimmer emission fields along the edges.
      const hiiSpots: [number, number][] = [
        [0.5, 0.9],
        [0.15, 0.5],
        [0.85, 0.55],
        [0.5, 0.1],
      ];
      hiiSpots.sort(() => Math.random() - 0.5);
      const hiiUniform = (index: number): [number, number, number, number] => {
        const [hx, hy] = hiiSpots[index];
        return [hx + jitter(), hy + jitter(), 0.55 + Math.random() * 0.35, 0.5 + Math.random() * 0.4];
      };
      gl!.uniform4f(u.hii0, ...hiiUniform(0));
      gl!.uniform4f(u.hii1, ...hiiUniform(1));

      shapeTexture = gl!.createTexture();
      if (!shapeTexture) return;
      uploadLuminanceTexture(gl!, shapeTexture, emptyField(SDF_SIZE), SDF_SIZE);
      gl!.activeTexture(gl!.TEXTURE0);
      gl!.uniform1i(u.shape, 0);

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
        !gl!.getProgramParameter(program, parallelCompile.COMPLETION_STATUS_KHR)
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
      // Starts invisible; start() fades it in once the shader is compiled,
      // so the DOM starfield covers the compile wait.
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-0 transition-opacity duration-1000"
    />
  );
}
