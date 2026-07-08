/** Minimal WebGL helpers: compile, link, fullscreen quad, texture upload. */

const programShaders = new WeakMap<WebGLProgram, WebGLShader[]>();

export function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

export function createProgram(
  gl: WebGLRenderingContext,
  vertexSrc: string,
  fragmentSrc: string
): WebGLProgram {
  const program = beginProgram(gl, vertexSrc, fragmentSrc);
  finishProgram(gl, program);
  return program;
}

/**
 * Compiles and links WITHOUT querying any status. Querying forces the
 * browser to finish compilation synchronously; big shaders can block the
 * main thread for seconds on ANGLE. Pair with KHR_parallel_shader_compile
 * polling, then call finishProgram once compilation has completed.
 */
export function beginProgram(
  gl: WebGLRenderingContext,
  vertexSrc: string,
  fragmentSrc: string
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  const vs = gl.createShader(gl.VERTEX_SHADER);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  if (!vs || !fs) {
    if (vs) gl.deleteShader(vs);
    if (fs) gl.deleteShader(fs);
    gl.deleteProgram(program);
    throw new Error("Failed to create shaders");
  }
  gl.shaderSource(vs, vertexSrc);
  gl.compileShader(vs);
  gl.shaderSource(fs, fragmentSrc);
  gl.compileShader(fs);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  programShaders.set(program, [vs, fs]);
  return program;
}

/** Validates a program begun with beginProgram. Throws on failure. */
export function finishProgram(gl: WebGLRenderingContext, program: WebGLProgram): void {
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || "no program info log";
    const shaderLogs =
      programShaders
        .get(program)
        ?.map((shader, index) => {
          const kind = index === 0 ? "vertex" : "fragment";
          const ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
          return `${kind} compile ${ok ? "ok" : "failed"}: ${
            gl.getShaderInfoLog(shader) || "no shader info log"
          }`;
        })
        .join("; ") || "no attached shader info";
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${log}; ${shaderLogs}`);
  }

  const shaders = programShaders.get(program);
  if (shaders) {
    for (const shader of shaders) {
      gl.detachShader(program, shader);
      gl.deleteShader(shader);
    }
    programShaders.delete(program);
  }
}

/** One oversized triangle covering clip space; binds to the given attribute. */
export function setupFullscreenQuad(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  attributeName: string
): void {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );
  const location = gl.getAttribLocation(program, attributeName);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
}

/** Uploads a single-channel byte field as a luminance texture. */
export function uploadLuminanceTexture(
  gl: WebGLRenderingContext,
  texture: WebGLTexture,
  data: Uint8Array,
  size: number
): void {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    size,
    size,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    data
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}
