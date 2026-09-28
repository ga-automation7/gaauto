#!/usr/bin/env node
/**
 * generate-textures.mjs
 * ─────────────────────
 * Procedural, seamlessly tiling atmosphere textures (fog, nebula clouds).
 * They are used as CSS masks over coloured gradients, so one grayscale texture
 * can become violet nebula or blue city mist, and drift by translating a layer
 * (compositor-only — no repaints while animating).
 *
 *   npm run assets:textures
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public/assets/textures');

/** Deterministic hash → [0,1) for integer lattice points. */
function hash(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const smooth = (t) => t * t * t * (t * (t * 6 - 15) + 10);

/** Periodic value noise: the lattice wraps every `period` cells, so the texture tiles. */
function valueNoise(x, y, period, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const px = period.x;
  const py = period.y;
  const w = (v, p) => ((v % p) + p) % p;
  const a = hash(w(xi, px), w(yi, py), seed);
  const b = hash(w(xi + 1, px), w(yi, py), seed);
  const c = hash(w(xi, px), w(yi + 1, py), seed);
  const d = hash(w(xi + 1, px), w(yi + 1, py), seed);
  const u = smooth(xf);
  const v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x, y, { cellsX, cellsY, octaves, seed, gain = 0.5, ridged = false }) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let fx = cellsX;
  let fy = cellsY;
  for (let o = 0; o < octaves; o++) {
    let n = valueNoise(x * fx, y * fy, { x: fx, y: fy }, seed + o * 17);
    if (ridged) n = 1 - Math.abs(n * 2 - 1);
    sum += n * amp;
    norm += amp;
    amp *= gain;
    fx *= 2;
    fy *= 2;
  }
  return sum / norm;
}

const smoothstep = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

async function write(name, width, height, alphaAt) {
  const px = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      px[i] = px[i + 1] = px[i + 2] = 255;
      px[i + 3] = Math.round(alphaAt(x / width, y / height) * 255);
    }
  }
  await fs.mkdir(OUT, { recursive: true });
  const file = path.join(OUT, name);
  const info = await sharp(px, { raw: { width, height, channels: 4 } }).webp({ quality: 82, alphaQuality: 70 }).toFile(file);
  console.log(`  ✓ ${path.relative(ROOT, file)}  ${width}×${height}  ${(info.size / 1024).toFixed(0)} KB`);
}

async function main() {
  console.log('textures');
  // Wispy horizontal fog: stretched cells, soft threshold.
  await write('fog.webp', 1024, 384, (u, v) => {
    const n = fbm(u, v, { cellsX: 4, cellsY: 3, octaves: 6, seed: 11 });
    const wisps = fbm(u, v, { cellsX: 8, cellsY: 6, octaves: 4, seed: 29, ridged: true });
    return smoothstep(0.38, 0.8, n * 0.75 + wisps * 0.35) * 0.95;
  });
  // Billowing nebula: rounder cells, ridged detail for filaments.
  await write('nebula.webp', 768, 768, (u, v) => {
    const base = fbm(u, v, { cellsX: 3, cellsY: 3, octaves: 6, seed: 5 });
    const filaments = fbm(u, v, { cellsX: 6, cellsY: 6, octaves: 5, seed: 41, ridged: true });
    return smoothstep(0.42, 0.9, base * 0.7 + filaments * 0.4);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
