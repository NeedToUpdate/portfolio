import { chamferDistance, distancesToBytes, emptyField } from "@/lib/nebula/sdf";
import { nebulaShapes } from "@/lib/nebula/shapes";
import { nebulaPalettes, pickPalette } from "@/lib/nebula/palettes";

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
