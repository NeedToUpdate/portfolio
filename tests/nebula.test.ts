import { chamferDistance, distancesToBytes, emptyField } from "@/lib/nebula/sdf";
import { nebulaShapes } from "@/lib/nebula/shapes";
import { nebulaPalettes, pickPalette } from "@/lib/nebula/palettes";
import { generateParticles } from "@/lib/nebula/particles";

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

describe("generateParticles", () => {
  const clouds = [
    { x: 0.2, y: 0.2, radius: 0.2, strength: 1, paletteGroup: 0 as const, shape: "pillar" as const },
    { x: 0.8, y: 0.8, radius: 0.15, strength: 1, paletteGroup: 1 as const, shape: "round" as const },
  ];

  it("produces the requested particle count across clouds", () => {
    const p = generateParticles(clouds, 500);
    expect(p.count).toBe(1000);
    expect(p.position).toHaveLength(3000);
    expect(p.data).toHaveLength(3000);
    expect(p.cloud).toHaveLength(3000);
    expect(p.shade).toHaveLength(2000);
    expect(p.palette).toHaveLength(1000);
    expect(p.bright).toHaveLength(1000);
  });

  it("tags particles with their cloud's palette group", () => {
    const p = generateParticles(clouds, 500);
    // Every particle's palette group is 0 or 1.
    for (let i = 0; i < p.count; i++) {
      expect([0, 1]).toContain(p.palette[i]);
    }
    // Both groups are present across the two clouds.
    expect(Array.from(p.palette)).toContain(0);
    expect(Array.from(p.palette)).toContain(1);
  });

  it("keeps rim in [0,1] and facing in [-1,1]", () => {
    const p = generateParticles(clouds, 500);
    for (let i = 0; i < p.count; i++) {
      const rim = p.shade[i * 2];
      const facing = p.shade[i * 2 + 1];
      expect(rim).toBeGreaterThanOrEqual(0);
      expect(rim).toBeLessThanOrEqual(1);
      expect(facing).toBeGreaterThanOrEqual(-1);
      expect(facing).toBeLessThanOrEqual(1);
    }
  });

  it("orders dust particles before emission particles", () => {
    const p = generateParticles(clouds, 500);
    expect(p.dustCount).toBeGreaterThan(0);
    expect(p.dustCount).toBeLessThan(p.count);
    // kind lives at data[i*3+2]: 1 for dust in the first range, 0 after.
    expect(p.data[2]).toBe(1);
    expect(p.data[(p.count - 1) * 3 + 2]).toBe(0);
  });

  it("skips clouds with zero strength", () => {
    const p = generateParticles(
      [{ x: 0.5, y: 0.5, radius: 0.2, strength: 0, paletteGroup: 0, shape: "pillar" }],
      500
    );
    expect(p.count).toBe(0);
  });
});

describe("nebula shapes and palettes", () => {
  it("defines a shape for every home section key", () => {
    for (const key of ["spark", "hex", "book", "bars", "plane"]) {
      expect(nebulaShapes[key]).toBeTruthy();
    }
  });

  it("picks a palette deterministically across the 0..1 range", () => {
    expect(pickPalette(0)).toBe(nebulaPalettes[0]);
    expect(pickPalette(0.999)).toBe(nebulaPalettes[nebulaPalettes.length - 1]);
  });
});
