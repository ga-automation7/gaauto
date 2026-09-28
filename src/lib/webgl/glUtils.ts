/** Minimal WebGL2 helpers — just enough to keep renderers readable. No framework. */

export function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${log ?? 'unknown'}`);
  }
  return shader;
}

export function createProgram(gl: WebGL2RenderingContext, vertex: string, fragment: string): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to create program');
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertex);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragment);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${log ?? 'unknown'}`);
  }
  return program;
}

export type UniformMap<K extends string> = Record<K, WebGLUniformLocation | null>;

export function getUniforms<K extends string>(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: readonly K[],
): UniformMap<K> {
  const out = {} as UniformMap<K>;
  for (const name of names) out[name] = gl.getUniformLocation(program, name);
  return out;
}

/** Load an image into a texture and report its pixel size. */
export async function loadTextureInfo(
  gl: WebGL2RenderingContext,
  url: string,
): Promise<{ texture: WebGLTexture; width: number; height: number }> {
  let size = { width: 0, height: 0 };
  const texture = await loadTexture(gl, url, (w, h) => (size = { width: w, height: h }));
  return { texture, ...size };
}

/** Load an image into a texture. Resolves when uploaded. */
export function loadTexture(
  gl: WebGL2RenderingContext,
  url: string,
  onSize?: (width: number, height: number) => void,
): Promise<WebGLTexture> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const tex = gl.createTexture();
      if (!tex) {
        reject(new Error('Unable to create texture'));
        return;
      }
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      onSize?.(img.naturalWidth, img.naturalHeight);
      resolve(tex);
    };
    img.onerror = () => reject(new Error(`Texture failed to load: ${url}`));
    img.src = url;
  });
}
