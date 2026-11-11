/**
 * The nebula's GPU side: compiles the five programs, uploads the scene
 * (particle buffers, background uniforms, dense star geometry), and
 * draws one frame's passes. Holds no timing or DOM state; the canvas
 * lifecycle drives it.
 */
import {
  BACKGROUND_FRAGMENT_SRC,
  DENSE_STAR_FRAGMENT_SRC,
  DENSE_STAR_VERTEX_SRC,
  FOREGROUND_FRAGMENT_SRC,
  GLYPH_FRAGMENT_SRC,
  PARTICLE_FRAGMENT_SRC,
  PARTICLE_VERTEX_SRC,
  VERTEX_SRC,
} from "./glsl";
import { beginProgram, finishProgram } from "./webgl";
import type { CloudSpec, ParticleBuffers } from "./particles";
import { profilePalettes } from "./palettes";
import type { NebulaMotion } from "./motion";
import { jitter } from "./scene";

const DENSE_STAR_COUNT = 3200;

export interface NebulaLayerVisibility {
  background?: boolean;
  distantStars?: boolean;
  gas?: boolean;
  wisps?: boolean;
  emission?: boolean;
  youngStars?: boolean;
  foregroundStars?: boolean;
}

type Uniforms<K extends string> = Record<K, WebGLUniformLocation | null>;
type SkyUniforms = Uniforms<"res" | "time" | "mouse" | "mouseActive">;
type ParticleUniforms = Uniforms<"res" | "time" | "mouse" | "mouseVel" | "mouseActive" | "shapeMix">;
type DenseUniforms = Uniforms<"res" | "mouse" | "mouseActive">;
type ParticleAttributes = Record<"aPos" | "aData" | "aCloud" | "aColor" | "aMotion" | "aTarget" | "aAngle", number>;
type DenseAttributes = Record<"aStar" | "aTint", number>;
type BufferName = "position" | "data" | "cloud" | "color" | "motion" | "angle" | "target" | "denseStar" | "denseTint";

/** Four random floats that vary the procedural sky per boot. */
export type NebulaSeed = [number, number, number, number];

export class NebulaRenderer {
  readonly gl: WebGLRenderingContext;
  private readonly isMini: boolean;

  // Assigned in compile(), which always runs before anything reads them.
  // The mini variant only compiles the particle and glyph programs.
  private bgProgram!: WebGLProgram;
  private particleProgram!: WebGLProgram;
  private glyphProgram!: WebGLProgram;
  private fgProgram!: WebGLProgram;
  private denseProgram!: WebGLProgram;
  private activePrograms: WebGLProgram[] = [];

  // Filled in upload(), which always runs before anything reads them.
  // Empty until then; the mini variant never fills bgU or fgU.
  private bgU = {} as SkyUniforms;
  private pU = {} as ParticleUniforms;
  private gU = {} as ParticleUniforms;
  private fgU = {} as SkyUniforms;
  private dU = {} as DenseUniforms;
  private pAttr = {} as ParticleAttributes;
  private gAttr = {} as ParticleAttributes;
  private dAttr = {} as DenseAttributes;
  private quadBuffer: WebGLBuffer | null = null;
  private buffers = {} as Record<BufferName, WebGLBuffer | null>;

  particleSeeds: Float32Array = new Float32Array(0);
  particleRoles: Uint8Array = new Uint8Array(0);
  particleCount = 0;
  private dustCount = 0;
  private wispCount = 0;
  private starCount = 0;

  constructor(gl: WebGLRenderingContext, isMini: boolean) {
    this.gl = gl;
    this.isMini = isMini;
  }

  /** Starts compiling every program this variant needs. Throws on failure. */
  compile(): void {
    const gl = this.gl;
    this.particleProgram = beginProgram(gl, PARTICLE_VERTEX_SRC, PARTICLE_FRAGMENT_SRC);
    this.glyphProgram = beginProgram(gl, PARTICLE_VERTEX_SRC, GLYPH_FRAGMENT_SRC);
    this.denseProgram = beginProgram(gl, DENSE_STAR_VERTEX_SRC, DENSE_STAR_FRAGMENT_SRC);
    this.activePrograms = [this.particleProgram, this.glyphProgram, this.denseProgram];
    if (!this.isMini) {
      this.bgProgram = beginProgram(gl, VERTEX_SRC, BACKGROUND_FRAGMENT_SRC);
      this.fgProgram = beginProgram(gl, VERTEX_SRC, FOREGROUND_FRAGMENT_SRC);
      this.activePrograms.push(this.bgProgram, this.fgProgram);
    }
  }

  /** True while any program is still compiling in the background. */
  isCompiling(parallelCompile: KHR_parallel_shader_compile | null): boolean {
    return Boolean(
      parallelCompile &&
        this.activePrograms.some(
          (program) => !this.gl.getProgramParameter(program, parallelCompile.COMPLETION_STATUS_KHR)
        )
    );
  }

  /** Validates the compiled programs. Throws on failure. */
  finish(): void {
    for (const program of this.activePrograms) finishProgram(this.gl, program);
  }

  /**
   * Uploads the particle buffers and every program's fixed uniforms and
   * attribute locations. Runs once per boot, after finish().
   */
  upload(particleData: ParticleBuffers, clouds: CloudSpec[], seed: NebulaSeed): void {
    const gl = this.gl;
    const {
      bgProgram,
      particleProgram,
      glyphProgram,
      fgProgram,
      denseProgram,
    } = this;

    this.particleCount = particleData.count;
    this.dustCount = particleData.dustCount;
    this.wispCount = particleData.wispCount;
    this.starCount = particleData.starCount;
    this.particleRoles = particleData.roles;
    const particleCount = this.particleCount;
    this.particleSeeds = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      this.particleSeeds[i] = particleData.data[i * 3 + 1]!;
    }

    const makeBuffer = (data: Float32Array): WebGLBuffer | null => {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      return buffer;
    };
    this.buffers = {
      position: makeBuffer(particleData.position),
      data: makeBuffer(particleData.data),
      cloud: makeBuffer(particleData.cloud),
      color: makeBuffer(particleData.color),
      motion: makeBuffer(particleData.motion),
      angle: makeBuffer(particleData.angle),
      target: makeBuffer(new Float32Array(particleCount * 2)),
      // Created below, once the dense star geometry exists.
      denseStar: null,
      denseTint: null,
    };

    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    if (!this.isMini) {
      // Uniforms: background program. The wash tints come from the
      // profiles: A follows the lowest cloud, B the upper one. The
      // portrait scene has no third cloud; the cool accent falls
      // back to the first (the teal web).
      // The full-page scene always has at least one cloud.
      const firstCloud = clouds[0]!;
      const palA = profilePalettes[firstCloud.profile].bg;
      const palB = profilePalettes[(clouds[1] ?? firstCloud).profile].bg;
      const palC = profilePalettes[(clouds[2] ?? firstCloud).profile].bg;
      gl.useProgram(bgProgram);
      this.bgU = {
        res: gl.getUniformLocation(bgProgram, "uRes"),
        time: gl.getUniformLocation(bgProgram, "uTime"),
        mouse: gl.getUniformLocation(bgProgram, "uMouse"),
        mouseActive: gl.getUniformLocation(bgProgram, "uMouseActive"),
      };
      gl.uniform4f(gl.getUniformLocation(bgProgram, "uSeed"), seed[0], seed[1], seed[2], seed[3]);
      clouds.forEach((c, i) => {
        gl.uniform4f(gl.getUniformLocation(bgProgram, `uCloud${i}`), c.x, c.y, c.radius, 1);
      });
      const hiiSpots: [number, number][] = [
        [0.5, 0.9],
        [0.15, 0.5],
        [0.85, 0.55],
        [0.5, 0.1],
      ];
      hiiSpots.sort(() => Math.random() - 0.5);
      for (let i = 0; i < 2; i++) {
        gl.uniform4f(
          gl.getUniformLocation(bgProgram, `uHii${i}`),
          hiiSpots[i]![0] + jitter(),
          hiiSpots[i]![1] + jitter(),
          0.55 + Math.random() * 0.35,
          0.5 + Math.random() * 0.4
        );
      }
      gl.uniform3f(gl.getUniformLocation(bgProgram, "uColCoreA"), ...palA.core);
      gl.uniform3f(gl.getUniformLocation(bgProgram, "uColCoreB"), ...palB.core);
      gl.uniform3f(gl.getUniformLocation(bgProgram, "uColMidA"), ...palA.mid);
      gl.uniform3f(gl.getUniformLocation(bgProgram, "uColMidB"), ...palB.mid);
      gl.uniform3f(gl.getUniformLocation(bgProgram, "uColFilA"), ...palA.fil);
      gl.uniform3f(gl.getUniformLocation(bgProgram, "uColFilB"), ...palB.fil);
      gl.uniform3f(gl.getUniformLocation(bgProgram, "uColBlue"), ...palC.core);
    }

    // Uniforms and attributes: particle program.
    gl.useProgram(particleProgram);
    this.pU = {
      res: gl.getUniformLocation(particleProgram, "uRes"),
      time: gl.getUniformLocation(particleProgram, "uTime"),
      mouse: gl.getUniformLocation(particleProgram, "uMouse"),
      mouseVel: gl.getUniformLocation(particleProgram, "uMouseVel"),
      mouseActive: gl.getUniformLocation(particleProgram, "uMouseActive"),
      shapeMix: gl.getUniformLocation(particleProgram, "uShapeMix"),
    };
    this.pAttr = {
      aPos: gl.getAttribLocation(particleProgram, "aPos"),
      aData: gl.getAttribLocation(particleProgram, "aData"),
      aCloud: gl.getAttribLocation(particleProgram, "aCloud"),
      aColor: gl.getAttribLocation(particleProgram, "aColor"),
      aMotion: gl.getAttribLocation(particleProgram, "aMotion"),
      aTarget: gl.getAttribLocation(particleProgram, "aTarget"),
      aAngle: gl.getAttribLocation(particleProgram, "aAngle"),
    };

    // Uniforms and attributes: glyph program (same vertex shader).
    gl.useProgram(glyphProgram);
    this.gU = {
      res: gl.getUniformLocation(glyphProgram, "uRes"),
      time: gl.getUniformLocation(glyphProgram, "uTime"),
      mouse: gl.getUniformLocation(glyphProgram, "uMouse"),
      mouseVel: gl.getUniformLocation(glyphProgram, "uMouseVel"),
      mouseActive: gl.getUniformLocation(glyphProgram, "uMouseActive"),
      shapeMix: gl.getUniformLocation(glyphProgram, "uShapeMix"),
    };
    this.gAttr = {
      aPos: gl.getAttribLocation(glyphProgram, "aPos"),
      aData: gl.getAttribLocation(glyphProgram, "aData"),
      aCloud: gl.getAttribLocation(glyphProgram, "aCloud"),
      aColor: gl.getAttribLocation(glyphProgram, "aColor"),
      aMotion: gl.getAttribLocation(glyphProgram, "aMotion"),
      aTarget: gl.getAttribLocation(glyphProgram, "aTarget"),
      aAngle: gl.getAttribLocation(glyphProgram, "aAngle"),
    };

    // Uniforms: foreground star program.
    if (!this.isMini) {
      gl.useProgram(fgProgram);
      this.fgU = {
        res: gl.getUniformLocation(fgProgram, "uRes"),
        time: gl.getUniformLocation(fgProgram, "uTime"),
        mouse: gl.getUniformLocation(fgProgram, "uMouse"),
        mouseActive: gl.getUniformLocation(fgProgram, "uMouseActive"),
      };
      gl.uniform4f(gl.getUniformLocation(fgProgram, "uSeed"), seed[0], seed[1], seed[2], seed[3]);
    }

    // Dense distant stars, on every variant: one-time random
    // geometry, faint-heavy brightness skew, warm/cool tint spread.
    this.dU = {
      res: gl.getUniformLocation(denseProgram, "uRes"),
      mouse: gl.getUniformLocation(denseProgram, "uMouse"),
      mouseActive: gl.getUniformLocation(denseProgram, "uMouseActive"),
    };
    this.dAttr = {
      aStar: gl.getAttribLocation(denseProgram, "aStar"),
      aTint: gl.getAttribLocation(denseProgram, "aTint"),
    };
    const starData = new Float32Array(DENSE_STAR_COUNT * 3);
    const tintData = new Float32Array(DENSE_STAR_COUNT * 4);
    for (let i = 0; i < DENSE_STAR_COUNT; i++) {
      const m = Math.random();
      const cool = Math.random();
      starData[i * 3] = Math.random();
      starData[i * 3 + 1] = Math.random();
      starData[i * 3 + 2] = 1 + 1.3 * Math.random() + (Math.random() < 0.05 ? 1.1 : 0);
      tintData[i * 4] = 1 - 0.25 * cool;
      tintData[i * 4 + 1] = 0.87 - 0.02 * cool;
      tintData[i * 4 + 2] = 0.72 + 0.28 * cool;
      tintData[i * 4 + 3] = 0.1 + 0.45 * m * m;
    }
    this.buffers.denseStar = makeBuffer(starData);
    this.buffers.denseTint = makeBuffer(tintData);
  }

  /** Points the viewport and every program at a new backing size. */
  setResolution(width: number, height: number): void {
    const gl = this.gl;
    gl.viewport(0, 0, width, height);
    if (!this.isMini) {
      gl.useProgram(this.bgProgram);
      gl.uniform2f(this.bgU.res, width, height);
      gl.useProgram(this.fgProgram);
      gl.uniform2f(this.fgU.res, width, height);
    }
    gl.useProgram(this.denseProgram);
    gl.uniform2f(this.dU.res, width, height);
    gl.useProgram(this.particleProgram);
    gl.uniform2f(this.pU.res, width, height);
    gl.useProgram(this.glyphProgram);
    gl.uniform2f(this.gU.res, width, height);
  }

  /** Replaces the per-particle glyph targets (xy pairs). */
  uploadTargets(targets: Float32Array): void {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.target);
    gl.bufferData(gl.ARRAY_BUFFER, targets, gl.DYNAMIC_DRAW);
  }

  // The location can be -1: the gas program never reads vKind/vAngle,
  // so its compiler may strip the attributes that feed them.
  private bindParticleAttribute(loc: number, buffer: WebGLBuffer | null, size: number): void {
    const gl = this.gl;
    if (loc < 0) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }

  private applyParticleState(
    program: WebGLProgram,
    u: ParticleUniforms,
    attrs: ParticleAttributes,
    time: number,
    state: NebulaMotion
  ): void {
    const gl = this.gl;
    const buffers = this.buffers;
    gl.useProgram(program);
    gl.uniform1f(u.time, time);
    gl.uniform2f(u.mouse, state.smoothMouse.x, state.smoothMouse.y);
    gl.uniform2f(u.mouseVel, state.mouseVel.x, state.mouseVel.y);
    gl.uniform1f(u.mouseActive, state.mouseActive);
    gl.uniform1f(u.shapeMix, state.mix);
    this.bindParticleAttribute(attrs.aPos, buffers.position, 3);
    this.bindParticleAttribute(attrs.aData, buffers.data, 3);
    this.bindParticleAttribute(attrs.aCloud, buffers.cloud, 3);
    this.bindParticleAttribute(attrs.aColor, buffers.color, 4);
    this.bindParticleAttribute(attrs.aMotion, buffers.motion, 3);
    this.bindParticleAttribute(attrs.aTarget, buffers.target, 2);
    this.bindParticleAttribute(attrs.aAngle, buffers.angle, 1);
  }

  /** Draws every visible pass for one frame. */
  draw(
    timeMs: number,
    state: NebulaMotion,
    visible: (key: keyof NebulaLayerVisibility) => boolean
  ): void {
    const gl = this.gl;
    const { bgProgram, particleProgram, glyphProgram, fgProgram, denseProgram } = this;
    const { bgU, pU, gU, fgU, dU, pAttr, gAttr, dAttr, quadBuffer, buffers } = this;
    const { particleCount, dustCount, wispCount, starCount } = this;
    const time = timeMs / 1000;

    if (this.isMini) {
      // Transparent canvas: the DOM starfield shows through.
      gl.disable(gl.BLEND);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    } else if (visible("background")) {
      // Pass 1: background (sky, stars, H II, cirrus).
      gl.disable(gl.BLEND);
      gl.useProgram(bgProgram);
      gl.uniform1f(bgU.time, time);
      gl.uniform2f(bgU.mouse, state.smoothMouse.x, state.smoothMouse.y);
      gl.uniform1f(bgU.mouseActive, state.mouseActive);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      const quadLoc = gl.getAttribLocation(bgProgram, "aPosition");
      gl.enableVertexAttribArray(quadLoc);
      gl.vertexAttribPointer(quadLoc, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      gl.disable(gl.BLEND);
      gl.clearColor(0.004, 0.004, 0.006, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // Pass 1.5: the dense dust of faint distant suns, as static
    // point geometry instead of per-pixel procedural stars. On the
    // mini variant the canvas is transparent, so the points land
    // additively over the DOM starfield.
    if (visible("distantStars")) {
      gl.useProgram(denseProgram);
      gl.uniform2f(dU.mouse, state.smoothMouse.x, state.smoothMouse.y);
      gl.uniform1f(dU.mouseActive, state.mouseActive);
      this.bindParticleAttribute(dAttr.aStar, buffers.denseStar, 3);
      this.bindParticleAttribute(dAttr.aTint, buffers.denseTint, 4);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawArrays(gl.POINTS, 0, DENSE_STAR_COUNT);
    }

    // Pass 2 + 3: particle nebulae. Gas draws through the original
    // lean program; wisp streaks and spike stars sit at the end of
    // their buckets and draw through the glyph program, so the tens
    // of thousands of gas sprites never pay for the glyph math.
    gl.enable(gl.BLEND);
    // Dust first: premultiplied over, so it occludes stars behind it.
    // Generation order layers it: volume under body under shells,
    // dark dust lanes on top, wisp streaks above the lanes.
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const dustGasCount = dustCount - wispCount;
    if (visible("gas") && dustGasCount > 0) {
      this.applyParticleState(particleProgram, pU, pAttr, time, state);
      gl.drawArrays(gl.POINTS, 0, dustGasCount);
    }
    if (visible("wisps") && wispCount > 0) {
      this.applyParticleState(glyphProgram, gU, gAttr, time, state);
      gl.drawArrays(gl.POINTS, dustGasCount, wispCount);
    }
    // Emission: additive glow, filament webs, then the spike stars.
    gl.blendFunc(gl.ONE, gl.ONE);
    const emitGasCount = particleCount - dustCount - starCount;
    if (visible("emission") && emitGasCount > 0) {
      this.applyParticleState(particleProgram, pU, pAttr, time, state);
      gl.drawArrays(gl.POINTS, dustCount, emitGasCount);
    }
    if (visible("youngStars") && starCount > 0) {
      this.applyParticleState(glyphProgram, gU, gAttr, time, state);
      gl.drawArrays(gl.POINTS, particleCount - starCount, starCount);
    }

    // Pass 4: foreground stars, additive, in front of the gas.
    if (!this.isMini && visible("foregroundStars")) {
      gl.useProgram(fgProgram);
      gl.uniform1f(fgU.time, time);
      gl.uniform2f(fgU.mouse, state.smoothMouse.x, state.smoothMouse.y);
      gl.uniform1f(fgU.mouseActive, state.mouseActive);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      const fgLoc = gl.getAttribLocation(fgProgram, "aPosition");
      gl.enableVertexAttribArray(fgLoc);
      gl.vertexAttribPointer(fgLoc, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  /** Deletes the buffers and programs; leaves the context itself alone. */
  release(): void {
    const gl = this.gl;
    if (!gl.isContextLost()) {
      for (const buffer of Object.values(this.buffers)) {
        if (buffer) gl.deleteBuffer(buffer);
      }
      if (this.quadBuffer) gl.deleteBuffer(this.quadBuffer);
      for (const program of this.activePrograms) {
        gl.deleteProgram(program);
      }
    }
  }
}
