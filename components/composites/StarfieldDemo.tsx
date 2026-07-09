"use client";

import { useCallback, useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import InteractiveFigure from "./InteractiveFigure";

const STAR_COLORS = [
  "235, 237, 243",
  "235, 237, 243",
  "249, 235, 170",
  "96, 205, 216",
  "173, 128, 235",
];

/**
 * A miniature of the site's procedural sky: every press draws a new
 * field of stars that has never existed before. The full background
 * runs the same idea through WebGL with forty thousand sprites.
 */
export default function StarfieldDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "rgb(8, 10, 16)";
    ctx.fillRect(0, 0, w, h);

    const count = 120 + Math.floor(Math.random() * 80);
    for (let i = 0; i < count; i++) {
      const depth = Math.random();
      const color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
      ctx.beginPath();
      ctx.fillStyle = `rgba(${color}, ${(0.25 + 0.65 * depth).toFixed(3)})`;
      ctx.arc(Math.random() * w, Math.random() * h, 0.4 + depth * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // A few bright stars get a soft halo, like the real background.
    for (let i = 0; i < 4; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const halo = ctx.createRadialGradient(x, y, 0, x, y, 9);
      halo.addColorStop(0, "rgba(235, 237, 243, 0.7)");
      halo.addColorStop(1, "rgba(235, 237, 243, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(x - 9, y - 9, 18, 18);
    }
  }, []);

  useEffect(() => {
    generate();
  }, [generate]);

  return (
    <InteractiveFigure caption="Each press rolls a sky no one has seen before. The page background does this on every load.">
      <div className="flex flex-col gap-4">
        <canvas
          ref={canvasRef}
          aria-label="A randomly generated field of stars"
          className="aspect-video w-full rounded-md border border-line/60"
        />
        <div>
          <Button onClick={generate}>Generate a new sky</Button>
        </div>
      </div>
    </InteractiveFigure>
  );
}
