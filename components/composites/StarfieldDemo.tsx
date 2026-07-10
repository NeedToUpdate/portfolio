"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import NebulaBackground, { type NebulaLayerVisibility } from "./NebulaBackground";
import InteractiveFigure from "./InteractiveFigure";

const LAYERS = [
  ["background", "Diffuse ISM + H II emission"],
  ["distantStars", "Distant stellar field"],
  ["gas", "Ionized gas + ejecta envelope"],
  ["wisps", "Filamentary wisps"],
  ["emission", "Recombination emission glow"],
  ["youngStars", "Luminous shell stars"],
  ["foregroundStars", "Foreground stellar field"],
] as const;

type LayerKey = (typeof LAYERS)[number][0];
const allVisible = Object.fromEntries(LAYERS.map(([key]) => [key, true])) as Required<NebulaLayerVisibility>;

/** A cropped instance of the production WebGL renderer with its real passes exposed. */
export default function StarfieldDemo() {
  const [layers, setLayers] = useState<Required<NebulaLayerVisibility>>(allVisible);
  const [generation, setGeneration] = useState(0);

  const toggle = (key: LayerKey) => {
    setLayers((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <InteractiveFigure caption="This is the production WebGL renderer, cropped to one Helix-like nebula. Toggle its actual draw groups from the distant interstellar medium forward.">
      <div className="flex flex-col gap-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-md border border-line/60 bg-[#05070c]">
          <NebulaBackground key={generation} variant="demo" layers={layers} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="WebGL render layers">
          {LAYERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={layers[key]}
              onClick={() => toggle(key)}
              className={`rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                layers[key]
                  ? "border-accent/60 bg-accent/10 text-ink"
                  : "border-line text-muted opacity-60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setGeneration((current) => current + 1)}>
            Generate a new sky
          </Button>
          <Button variant="outline" onClick={() => setLayers({ ...allVisible })}>
            Show all layers
          </Button>
        </div>
      </div>
    </InteractiveFigure>
  );
}
