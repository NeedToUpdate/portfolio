/**
 * The nebula canvas lifecycle: context acquisition, async compile and
 * particle generation, backing-store sizing, the render loop and its
 * pausing rules, context loss, the reveal fade, and teardown. Composes
 * the renderer, scene, motion, and hover modules; the React component
 * only mounts it.
 */
import { generateParticles, type CloudSpec, type ParticleBuffers } from "./particles";
import { NebulaRenderer, type NebulaLayerVisibility } from "./renderer";
import { buildClouds, type NebulaSceneOptions } from "./scene";
import { attachPointerInput, createMotion, stepMotion } from "./motion";
import { attachShapeHover, createShapeTargeter } from "./hover";

const BASE_RENDER_SCALE = 0.66;
const REDUCED_RENDER_SCALE = 0.45; // adaptive fallback for slow GPUs
// Fill-rate cap: the longest canvas axis never exceeds this many device
// pixels. The scene is fill-bound (soft overlapping sprites plus two
// fullscreen passes), and the gas is blurry by design, so a capped
// backing store upscales invisibly while huge windows would otherwise
// multiply the heaviest per-pixel work several times over.
const MAX_BACKING_PX = 2100;
const FRAME_INTERVAL_MS = 16;
const SLOW_FRAME_MS = 55;

export interface NebulaMountOptions extends NebulaSceneOptions {
  /** Read every frame, so layer toggles apply without a remount. */
  getLayers: () => NebulaLayerVisibility;
  /** Read at reveal time; fades in alongside the canvas when present. */
  getScrim: () => HTMLElement | null;
}

/**
 * Starts the nebula on a canvas. Returns the teardown, or undefined
 * when WebGL is unavailable or software-emulated (the starfield
 * remains).
 */
export function mountNebula(
  canvas: HTMLCanvasElement,
  options: NebulaMountOptions
): (() => void) | undefined {
  const isMini = options.variant === "mini";
  const visible = (key: keyof NebulaLayerVisibility) => options.getLayers()[key] !== false;

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

  // Headless and GPU-less environments (Lighthouse runners, CI, some
  // VMs) emulate WebGL on the CPU via SwiftShader/llvmpipe. There the
  // render loop turns into one long main-thread task per frame and
  // blocking time explodes, so those machines keep the starfield only.
  const dbgExt = gl.getExtension("WEBGL_debug_renderer_info");
  if (dbgExt) {
    const renderer = String(gl.getParameter(dbgExt.UNMASKED_RENDERER_WEBGL) ?? "");
    if (/swiftshader|llvmpipe|software/i.test(renderer)) return;
  }

  const renderer = new NebulaRenderer(gl, isMini);
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
  };
  const motion = createMotion();
  const shapeTargets = createShapeTargeter();

  // The scene layout, fixed at boot; start() also reads it for the
  // background wash uniforms. Kept across context restores so the
  // regenerated GPU buffers rebuild the same sky.
  let clouds: CloudSpec[] = [];
  // CPU-side particle buffers, normally built by the worker while the
  // shaders compile. Kept for the same restore reason as the clouds.
  let particles: ParticleBuffers | null = null;
  let particleWorker: Worker | null = null;

  const uploadTargets = (key: string | null) => {
    if (!key) return; // mix eases to 0; stale targets are invisible
    const targets = shapeTargets(key, {
      count: renderer.particleCount,
      roles: renderer.particleRoles,
      seeds: renderer.particleSeeds,
    });
    if (targets) renderer.uploadTargets(targets);
  };

  const renderFrame = (timeMs: number, dtSec: number) => {
    stepMotion(motion, dtSec, uploadTargets);
    renderer.draw(timeMs, motion, visible);
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
    renderer.setResolution(canvas.width, canvas.height);
    if (reducedMotion) renderFrame(12000, 0.016);
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

  const setPendingShape = (key: string | null) => {
    if (key === motion.pendingShape) return;
    motion.pendingShape = key;
    if (reducedMotion) {
      motion.activeShape = key;
      uploadTargets(key);
      motion.mix = key ? 1 : 0;
      renderFrame(12000, 0.016);
    }
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

  // Runs once the programs have finished compiling in the background
  // and the worker has delivered the particle buffers.
  const start = () => {
    try {
      renderer.finish();
    } catch (error) {
      console.error("Nebula shaders failed, keeping starfield only:", error);
      return;
    }

    const seed = [Math.random(), Math.random(), Math.random(), Math.random()];

    // Particle buffers, prebuilt by the worker in the common case. The
    // sync path covers a worker that failed to spawn or crashed.
    const particleData = particles ?? generateParticles(clouds);
    particles = particleData;
    renderer.upload(particleData, clouds, seed);

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
    // Flip opacity on a later frame so the opacity:0 baseline is painted
    // first and the transition animates. Drivers that finish compiling
    // within the reveal frame (Windows D3D11) otherwise snap in.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (state.disposed) return;
        canvas.style.opacity = "1";
        const scrim = options.getScrim();
        if (scrim) scrim.style.opacity = "1";
      });
    });
  };

  // Poll for compile and particle-generation completion without
  // blocking the main thread. The worker nulls itself when it delivers.
  const waitForCompile = () => {
    if (state.disposed) return;
    if (renderer.isCompiling(parallelCompile) || particleWorker) {
      state.frame = requestAnimationFrame(waitForCompile);
      return;
    }
    start();
  };

  // Compiles the programs and kicks off the async-compile poll. Runs
  // either immediately or after a parked context is restored.
  const boot = () => {
    if (state.disposed) return;

    // Build the particle buffers on a worker while the shaders
    // compile; both finish under the starfield's cover. On a context
    // restore the cached result re-uploads without regenerating.
    if (!particles) {
      if (clouds.length === 0) clouds = buildClouds(options);
      try {
        particleWorker = new Worker(new URL("./particles.worker.ts", import.meta.url));
        particleWorker.onmessage = (e: MessageEvent<ParticleBuffers>) => {
          particles = e.data;
          particleWorker?.terminate();
          particleWorker = null;
        };
        // On error, fall through to the sync path in start().
        particleWorker.onerror = () => {
          particleWorker?.terminate();
          particleWorker = null;
        };
        particleWorker.postMessage(clouds);
      } catch {
        particleWorker = null;
      }
    }

    try {
      renderer.compile();
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
  const detachHover = attachShapeHover(() => state.started, setPendingShape);
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);
  let detachPointer: (() => void) | null = null;
  if (!reducedMotion) {
    detachPointer = attachPointerInput(canvas, motion);
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
    particleWorker?.terminate();
    particleWorker = null;
    canvas.removeEventListener("webglcontextlost", onContextLost);
    canvas.removeEventListener("webglcontextrestored", onContextRestored);
    window.removeEventListener("resize", resize);
    detachHover();
    detachPointer?.();
    document.removeEventListener("visibilitychange", onVisibility);
    // Do NOT loseContext() here: the router keeps this canvas alive
    // across navigations and a parked context cannot reliably be
    // revived, which left the page nebula-less on return. Free the
    // heavy GPU resources instead and let the context idle.
    renderer.release();
  };
}
