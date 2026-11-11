"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { mountNebula } from "@/lib/nebula/lifecycle";
import type { NebulaLayerVisibility } from "@/lib/nebula/renderer";
import type {
  NebulaCorner,
  NebulaMiniShape,
  NebulaMiniSize,
  NebulaVariant,
} from "@/lib/nebula/scene";
import type { MiniPaletteName } from "@/lib/nebula/palettes";

export type { NebulaLayerVisibility } from "@/lib/nebula/renderer";
export type { NebulaCorner, NebulaMiniShape, NebulaMiniSize } from "@/lib/nebula/scene";

interface NebulaBackgroundProps {
  /**
   * "full" is the home-page scene: opaque sky, stars, and three
   * structured nebulae. "mini" is one small random-profile cloud on a
   * transparent canvas, tucked into a corner over the DOM starfield.
   */
  variant?: NebulaVariant;
  /** Where the mini cloud sits (mini only). */
  corner?: NebulaCorner;
  /** Structural profile for the mini cloud. Defaults to random. */
  miniShape?: NebulaMiniShape;
  /** Palette family for the mini cloud. Defaults to profile-native colors. */
  color?: MiniPaletteName | "random";
  /** Decorative mini footprint. Defaults to a larger medium. */
  size?: NebulaMiniSize;
  /**
   * Phone-only dark veil over the cloud's corner (mini only). For pages
   * whose text column runs full-bleed on phones and so scrolls straight
   * through the gas. Fades in with the canvas, so a device without
   * WebGL never shows a veil with nothing under it.
   */
  scrim?: boolean;
  layers?: NebulaLayerVisibility;
  /**
   * Portrait (phone) scene only. "default" spreads the two bright clouds
   * across the width; "right" pins both to the right margin so a
   * left-aligned text column rides clean dark sky.
   */
  heroClouds?: "default" | "right";
}

// A soft black veil anchored over the mini cloud, so body copy stays
// readable where it crosses the gas. Sized to fade out before the
// opposite edges: the rest of the starfield keeps its full contrast.
// The gradient is the .nebula-scrim utility in styles/globals.css; each
// corner only moves its anchor. Literal classes so Tailwind sees them.
const MINI_SCRIM: Record<NebulaCorner, string> = {
  "top-left": "nebula-scrim [--scrim-at:8%_18%]",
  "top-right": "nebula-scrim [--scrim-at:92%_18%]",
  "bottom-left": "nebula-scrim [--scrim-at:8%_82%]",
  "bottom-right": "nebula-scrim [--scrim-at:92%_82%]",
};

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
  scrim = false,
  layers = {},
  heroClouds = "default",
}: NebulaBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef(layers);
  // The render loop reads layers every frame without remounting. A
  // layout effect lands the new value before the next animation frame.
  useLayoutEffect(() => {
    layersRef.current = layers;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return mountNebula(canvas, {
      variant,
      corner,
      miniShape,
      color,
      size,
      heroClouds,
      getLayers: () => layersRef.current,
      getScrim: () => scrimRef.current,
    });
  }, [variant, corner, miniShape, color, size, heroClouds]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        // Starts invisible; mountNebula fades it in once the shaders compile,
        // so the DOM starfield covers the wait. h-lvh, not h-full: the
        // largest-viewport unit ignores the mobile URL bar collapsing,
        // so the sky doesn't shift and re-snap while scrolling.
        className={variant === "demo"
          ? "pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-1000"
          : "pointer-events-none fixed inset-x-0 top-0 -z-10 h-lvh w-full opacity-0 transition-opacity duration-1000"}
      />
      {scrim && variant === "mini" ? (
        // Above the nebula canvas at -z-10, below the page content.
        // Same fixed box as the canvas, so the veil tracks the cloud
        // instead of drifting as the URL bar collapses.
        <div
          ref={scrimRef}
          aria-hidden
          className={`pointer-events-none fixed inset-x-0 top-0 -z-[5] h-lvh w-full opacity-0 transition-opacity duration-1000 md:hidden ${MINI_SCRIM[corner]}`}
        />
      ) : null}
    </>
  );
}
