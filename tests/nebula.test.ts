import { chamferDistance, distancesToBytes, emptyField } from "@/lib/nebula/sdf";
import { nebulaShapes } from "@/lib/nebula/shapes";
import { profilePalettes } from "@/lib/nebula/palettes";
import { generateParticles, CloudSpec } from "@/lib/nebula/particles";
import {
  arcShell,
  filamentWeb,
  lobeCluster,
  periodicNoise,
  starSprinkle,
  stroke,
  wispStreaks,
} from "@/lib/nebula/structures";

describe("chamferDistance", () => {
  it("is zero inside the shape", () => {
    const size = 8;
    const mask = new Uint8Array(size * size);
    mask[3 * size + 3] = 1;
    const dist = chamferDistance(mask, size, size);
    expect(dist[3 * size + 3]).toBe(0);
  });

  it("grows with distance from the shape", () => {
    const size = 16;
    const mask = new Uint8Array(size * size);
    mask[8 * size + 8] = 1;
    const dist = chamferDistance(mask, size, size);
    const near = dist[8 * size + 9]; // one pixel away
    const far = dist[8 * size + 14]; // six pixels away
    expect(near).toBeLessThan(far);
    expect(near).toBe(3); // chamfer straight step
  });

  it("approximates diagonal distance with the 3-4 chamfer", () => {
    const size = 16;
    const mask = new Uint8Array(size * size);
    mask[8 * size + 8] = 1;
    const dist = chamferDistance(mask, size, size);
    expect(dist[9 * size + 9]).toBe(4); // one diagonal step
  });

  it("marks everything far when the mask is empty", () => {
    const size = 4;
    const dist = chamferDistance(new Uint8Array(size * size), size, size);
    expect(Math.min(...dist)).toBeGreaterThan(1e8);
  });
});

describe("distancesToBytes", () => {
  it("clamps to the byte range", () => {
    const dist = new Float32Array([0, 5, 1e9]);
    const bytes = distancesToBytes(dist, 16, 16);
    expect(bytes[0]).toBe(0);
    expect(bytes[2]).toBe(255);
  });
});

describe("emptyField", () => {
  it("reads far away everywhere", () => {
    const field = emptyField(4);
    expect(field.every((v) => v === 255)).toBe(true);
  });
});

describe("structure emitters", () => {
  const rng = () => Math.random();

  it("lobeCluster respects the density mask", () => {
    const particles = lobeCluster(rng, {
      count: 400,
      lobes: [{ cx: 0, cy: 0, r: 0.5 }],
      colors: [[1, 0, 0]],
      alpha: [0.02, 0.1],
      size: [0.1, 0.2],
      drift: 0.02,
      pointer: 0.5,
      morph: 1,
      // Everything inside r=0.3 of the origin is carved away.
      mask: (x, y) => (Math.hypot(x, y) < 0.3 ? 0 : 1),
    });
    expect(particles.length).toBeGreaterThan(0);
    for (const p of particles) {
      expect(Math.hypot(p.x, p.y)).toBeGreaterThanOrEqual(0.3);
    }
  });

  it("arcShell deposits near the requested radius and marks outline role", () => {
    const particles = arcShell(rng, {
      count: 300,
      cx: 0,
      cy: 0,
      r: 0.7,
      a0: 0,
      a1: Math.PI * 2,
      width: 0.08,
      wobble: 0.1,
      gaps: 0.3,
      colors: [[1, 0.5, 0]],
      alpha: [0.05, 0.15],
      size: [0.04, 0.08],
      drift: 0.02,
      pointer: 0.6,
      morph: 1,
    });
    expect(particles.length).toBeGreaterThan(100);
    for (const p of particles) {
      const r = Math.hypot(p.x, p.y);
      expect(r).toBeGreaterThan(0.25);
      expect(r).toBeLessThan(1.3);
      expect(p.role).toBe(1);
    }
  });

  it("filamentWeb stays within reach and fades", () => {
    const particles = filamentWeb(rng, {
      count: 500,
      roots: 10,
      origin: [0.1, 0.3],
      reach: 1.0,
      step: 0.04,
      curl: 0.5,
      branch: 0.1,
      colors: [[0.8, 0.3, 0.1]],
      brightColors: [[1, 0.7, 0.3]],
      alpha: [0.05, 0.15],
      size: [0.02, 0.05],
      drift: 0.03,
      pointer: 0.9,
      morph: 1,
    });
    expect(particles.length).toBeGreaterThan(50);
    for (const p of particles) {
      expect(Math.hypot(p.x, p.y)).toBeLessThan(1.15);
      expect(p.alpha).toBeGreaterThan(0);
      expect(p.alpha).toBeLessThanOrEqual(0.15 * 1.4 + 1e-9);
    }
  });

  it("stroke fades its ends", () => {
    const particles = stroke(rng, {
      count: 300,
      from: [-0.5, 0],
      ctrl: [0, 0.4],
      to: [0.5, 0],
      width: 0.05,
      colors: [[0.1, 0.05, 0.08]],
      alpha: [0.1, 0.1],
      size: [0.05, 0.1],
      drift: 0.02,
      pointer: 0.5,
      morph: 0.1,
    });
    const nearEnd = particles.filter((p) => p.x < -0.45);
    const middle = particles.filter((p) => Math.abs(p.x) < 0.1);
    const avg = (list: typeof particles) =>
      list.reduce((s, p) => s + p.alpha, 0) / Math.max(list.length, 1);
    expect(avg(middle)).toBeGreaterThan(avg(nearEnd));
  });

  it("wispStreaks hug their arc and align with the flow", () => {
    const particles = wispStreaks(rng, {
      count: 200,
      arcs: [{ cx: 0, cy: 0, r: 0.7, width: 0.05 }],
      colors: [[0.6, 0.3, 0.4]],
      alpha: [0.03, 0.1],
      size: [0.08, 0.16],
      drift: 0.03,
      pointer: 0.85,
      morph: 0.5,
    });
    expect(particles.length).toBeGreaterThan(150);
    for (const p of particles) {
      const r = Math.hypot(p.x, p.y);
      expect(r).toBeGreaterThan(0.4);
      expect(r).toBeLessThan(1.0);
      expect(p.kind).toBe(3);
      // The streak runs along the ring: its angle stays near the local
      // tangent (radial angle + 90deg) modulo the +-0.4 jitter.
      const tangent = Math.atan2(p.y, p.x) + Math.PI / 2;
      let diff = (p.angle! - tangent) % (Math.PI * 2);
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      expect(Math.abs(diff)).toBeLessThan(0.45);
    }
  });

  it("starSprinkle marks stars for the uniform outline pool", () => {
    const particles = starSprinkle(rng, {
      count: 60,
      arcs: [{ cx: 0, cy: 0, r: 0.6, width: 0.06 }],
      blobs: [{ cx: 0, cy: 0, r: 0.4 }],
      scatter: 0.4,
      colors: [[0.9, 0.95, 1]],
      alpha: [0.12, 0.46],
      size: [0.02, 0.08],
    });
    expect(particles).toHaveLength(60);
    for (const p of particles) {
      expect(p.kind).toBe(2);
      expect(p.role).toBe(2);
      expect(p.morph).toBe(1);
      expect(p.alpha).toBeLessThan(0.5);
    }
  });

  it("periodicNoise wraps around 2*PI", () => {
    const n = periodicNoise(() => Math.random(), 8);
    expect(n(0)).toBeCloseTo(n(Math.PI * 2), 5);
    const v = n(1.3);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe("generateParticles", () => {
  const clouds: CloudSpec[] = [
    { x: 0.7, y: 0.3, radius: 0.4, profile: "orion", count: 2000 },
    { x: 0.2, y: 0.8, radius: 0.2, profile: "helix", count: 1500 },
    { x: 0.15, y: 0.2, radius: 0.15, profile: "crab", count: 1500 },
  ];

  it("packs matching buffer lengths", () => {
    const p = generateParticles(clouds);
    expect(p.count).toBeGreaterThan(1000);
    expect(p.position).toHaveLength(p.count * 3);
    expect(p.data).toHaveLength(p.count * 3);
    expect(p.cloud).toHaveLength(p.count * 3);
    expect(p.color).toHaveLength(p.count * 4);
    expect(p.motion).toHaveLength(p.count * 3);
    expect(p.roles).toHaveLength(p.count);
  });

  it("orders dust particles before emission particles", () => {
    const p = generateParticles(clouds);
    expect(p.dustCount).toBeGreaterThan(0);
    expect(p.dustCount).toBeLessThan(p.count);
    // kind lives at data[i*3+2]: the dust bucket holds gas blobs (1)
    // and wisp streaks (3); the emission bucket holds glow blobs (0)
    // and spike stars (2).
    let bucketsOk = true;
    for (let i = 0; i < p.count; i++) {
      const kind = p.data[i * 3 + 2];
      const ok = i < p.dustCount ? kind === 1 || kind === 3 : kind === 0 || kind === 2;
      if (!ok) bucketsOk = false;
    }
    expect(bucketsOk).toBe(true);
  });

  it("emits spike stars and wisp streaks for every profile", () => {
    for (const cloud of clouds) {
      const p = generateParticles([cloud]);
      const kinds = new Set<number>();
      for (let i = 0; i < p.count; i++) kinds.add(p.data[i * 3 + 2]);
      expect(kinds.has(2)).toBe(true);
      expect(kinds.has(3)).toBe(true);
    }
  });

  it("keeps every particle translucent: volume comes from accumulation", () => {
    const p = generateParticles(clouds);
    for (let i = 0; i < p.count; i++) {
      const alpha = p.color[i * 4 + 3];
      expect(alpha).toBeGreaterThan(0);
      expect(alpha).toBeLessThan(0.5);
    }
  });

  it("gives every profile both outline and interior morph roles", () => {
    const p = generateParticles(clouds);
    const roles = new Set<number>();
    for (let i = 0; i < p.count; i++) roles.add(p.roles[i]);
    expect(roles.has(0)).toBe(true);
    expect(roles.has(1)).toBe(true);
  });

  it("produces different silhouettes per profile, not one recolored blob", () => {
    // Compare radial density histograms: the helix ring must be
    // hollow-centred relative to the orion body.
    const radialFill = (profile: CloudSpec["profile"]) => {
      let state = profile === "helix" ? 0x12345678 : 0x87654321;
      const seededRandom = () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 0x100000000;
      };
      const p = generateParticles(
        [{ x: 0.5, y: 0.5, radius: 0.3, profile, count: 3000 }],
        seededRandom
      );
      let inner = 0;
      let total = 0;
      for (let i = 0; i < p.count; i++) {
        const r = Math.hypot(p.position[i * 3], p.position[i * 3 + 1]);
        if (r < 0.35) inner++;
        total++;
      }
      return inner / total;
    };
    expect(Math.abs(radialFill("helix") - radialFill("orion"))).toBeGreaterThan(0.08);
  });
});

describe("nebula shapes and palettes", () => {
  it("defines a shape for every home section key", () => {
    for (const key of ["spark", "hex", "book", "bars", "plane"]) {
      expect(nebulaShapes[key]).toBeTruthy();
    }
  });

  it("keeps one coherent palette per profile with every layer present", () => {
    for (const pal of Object.values(profilePalettes)) {
      expect(pal.volume.length).toBeGreaterThan(0);
      expect(pal.shell.length).toBeGreaterThan(0);
      expect(pal.body.length).toBeGreaterThan(0);
      expect(pal.dust.length).toBeGreaterThan(0);
      expect(pal.glow.length).toBeGreaterThan(0);
      for (const layer of [pal.volume, pal.shell, pal.body, pal.dust, pal.glow]) {
        for (const c of layer) {
          for (const ch of c) {
            expect(ch).toBeGreaterThanOrEqual(0);
            expect(ch).toBeLessThanOrEqual(1);
          }
        }
      }
    }
  });
});
