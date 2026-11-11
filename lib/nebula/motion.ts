/**
 * Per-frame interaction state: the glyph morph mix and the eased
 * pointer that drives parallax and the directional wake. The input
 * listeners write raw targets; stepMotion eases toward them each frame.
 */

const MIX_RATE = 2.5; // 1/s, ease toward the glyph target (slower morph)
const MOUSE_FADE_RATE = 4; // 1/s, push fade only
const MOUSE_VEL_RATE = 7; // 1/s, velocity smoothing for the wake
// Pointer position smoothing. Raw pointer events arrive quantized to
// device pixels; feeding them straight to the parallax makes the whole
// screen step visibly during slow movement. ~80ms of easing removes
// the jitter without making the wake feel laggy.
const MOUSE_POS_RATE = 12; // 1/s

export interface NebulaMotion {
  mix: number;
  activeShape: string | null;
  pendingShape: string | null;
  mouse: { x: number; y: number };
  smoothMouse: { x: number; y: number };
  lastMouse: { x: number; y: number };
  mouseVel: { x: number; y: number };
  mouseActive: number;
  mouseActiveTarget: number;
}

export function createMotion(): NebulaMotion {
  return {
    mix: 0,
    activeShape: null,
    pendingShape: null,
    mouse: { x: 0.5, y: 0.5 },
    smoothMouse: { x: 0.5, y: 0.5 },
    lastMouse: { x: 0.5, y: 0.5 },
    mouseVel: { x: 0, y: 0 },
    mouseActive: 0,
    mouseActiveTarget: 0,
  };
}

/**
 * Advances the morph and pointer easing by dtSec. onShapeSwap fires
 * once the outgoing glyph has dissolved, so the new targets upload
 * while nothing is visibly holding the old shape.
 */
export function stepMotion(
  state: NebulaMotion,
  dtSec: number,
  onShapeSwap: (key: string | null) => void
): void {
  const mixEase = 1 - Math.exp(-MIX_RATE * dtSec);
  const fadeEase = 1 - Math.exp(-MOUSE_FADE_RATE * dtSec);
  const velEase = 1 - Math.exp(-MOUSE_VEL_RATE * dtSec);

  const wantsSwap = state.pendingShape !== state.activeShape;
  const mixTarget = wantsSwap ? 0 : state.activeShape ? 1 : 0;
  state.mix += (mixTarget - state.mix) * mixEase;
  if (wantsSwap && state.mix < 0.03) {
    state.activeShape = state.pendingShape;
    onShapeSwap(state.activeShape);
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
}

/**
 * Feeds pointer and touch positions into the motion state, mapped to
 * the canvas in uv space (y up). Returns a detach function.
 */
export function attachPointerInput(canvas: HTMLCanvasElement, state: NebulaMotion): () => void {
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

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("touchcancel", onTouchEnd, { passive: true });

  return () => {
    window.removeEventListener("pointermove", onPointerMove);
    document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
    window.removeEventListener("touchcancel", onTouchEnd);
  };
}
