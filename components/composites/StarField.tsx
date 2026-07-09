"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  /** 0..1, drives size, brightness, and parallax strength. */
  depth: number;
  twinklePhase: number;
  twinkleSpeed: number;
  color: string;
}

const STAR_DENSITY = 1 / 14000; // stars per px², keeps it sparse
const MAX_STARS = 220;
const PARALLAX_PX = 14; // max drift toward the pointer at full depth

const STAR_COLORS = [
  "235, 237, 243", // starlight
  "235, 237, 243",
  "235, 237, 243",
  "249, 235, 170", // warm star
  "96, 205, 216", // plasma
  "173, 128, 235", // nebula
];

function makeStars(width: number, height: number): Star[] {
  const count = Math.min(MAX_STARS, Math.round(width * height * STAR_DENSITY));
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    depth: Math.random(),
    twinklePhase: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.3 + Math.random() * 0.7,
    color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
  }));
}

/**
 * A sparse starfield behind the page. Stars twinkle slowly and drift
 * a few pixels toward the pointer, more for "closer" stars. Renders a
 * static field for reduced-motion users and pauses in hidden tabs.
 */
export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let stars: Star[] = [];
    let frame = 0;
    let running = true;
    // Pointer position as an offset from center, in [-0.5, 0.5].
    const pointer = { x: 0, y: 0 };
    const drift = { x: 0, y: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = makeStars(window.innerWidth, window.innerHeight);
      if (reducedMotion) draw(0);
    };

    const draw = (time: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // Ease the drift toward the pointer so motion stays calm.
      drift.x += (pointer.x - drift.x) * 0.04;
      drift.y += (pointer.y - drift.y) * 0.04;

      for (const star of stars) {
        const twinkle = reducedMotion
          ? 0.5
          : 0.5 + 0.5 * Math.sin(star.twinklePhase + time * 0.001 * star.twinkleSpeed);
        const alpha = 0.12 + 0.38 * twinkle * (0.4 + 0.6 * star.depth);
        const radius = 0.4 + star.depth * 1.1;
        const px = star.x + drift.x * PARALLAX_PX * star.depth;
        const py = star.y + drift.y * PARALLAX_PX * star.depth;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${star.color}, ${alpha.toFixed(3)})`;
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (time: number) => {
      if (!running) return;
      draw(time);
      frame = requestAnimationFrame(loop);
    };

    const onPointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    };

    // Touch pans cancel pointer events; passive touchmove keeps the
    // parallax following the finger on phones.
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      pointer.x = touch.clientX / window.innerWidth - 0.5;
      pointer.y = touch.clientY / window.innerHeight - 0.5;
    };

    const onVisibility = () => {
      running = document.visibilityState === "visible" && !reducedMotion;
      if (running) frame = requestAnimationFrame(loop);
      else cancelAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);

    if (!reducedMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      frame = requestAnimationFrame(loop);
    }

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
