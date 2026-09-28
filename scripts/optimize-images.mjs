#!/usr/bin/env node
/**
 * optimize-images.mjs
 * ───────────────────
 * Turns the raw reference artwork in /public/assets/references into web-ready
 * derivatives. The originals are NEVER modified.
 *
 *   npm run assets:images
 *
 * Output
 *   public/assets/images/<scene>/<name>.avif|webp        full resolution
 *   public/assets/images/<scene>/<name>-lite.avif|webp   low-tier / save-data
 *   public/assets/images/og/og-image.jpg                 1200×630 share card
 *   public/assets/textures/grain.png                     film grain tile
 *   src/data/generated/media-meta.json                   sizes + LQIP data URIs
 *
 * To replace an image: drop the new file in /public/assets/references using the
 * same numeric prefix (01-, 02-, 03-) and re-run. See docs/assets.md.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const REF_DIR = path.join(ROOT, 'public/assets/references');
const IMG_DIR = path.join(ROOT, 'public/assets/images');
const META_FILE = path.join(ROOT, 'src/data/generated/media-meta.json');

/** Reference files are matched by numeric prefix so odd extensions (e.g. `.png.png`) still work. */
// (02- is the original city still — the film now uses the drone footage instead: scripts/extract-frames.mjs.)
const SOURCES = { eye: '01-', cosmic: '03-' };

/** Primary cinematic plates. `lite` is served to low-tier devices / Save-Data. */
const PLATES = [
  { id: 'heroEye', source: 'eye', dir: 'hero', name: 'eye', liteWidth: 960 },
];

const AVIF = { quality: 52, effort: 5, chromaSubsampling: '4:2:0' };
const WEBP = { quality: 80, effort: 5, smartSubsample: true };

async function findSource(prefix) {
  const files = await fs.readdir(REF_DIR);
  const match = files.find((f) => f.startsWith(prefix) && /\.(png|jpe?g|webp|avif)$/i.test(f));
  if (!match) throw new Error(`No reference image with prefix "${prefix}" in ${REF_DIR}`);
  return path.join(REF_DIR, match);
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

async function writeVariant(pipeline, file) {
  const info = await pipeline.toFile(file);
  console.log(`  ✓ ${path.relative(ROOT, file).padEnd(52)} ${info.width}×${info.height}  ${kb(info.size)}`);
  return info;
}

async function lqip(src) {
  const buf = await sharp(src).resize(32).blur(0.6).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

async function buildPlates(meta) {
  for (const plate of PLATES) {
    const src = await findSource(SOURCES[plate.source]);
    const { width, height } = await sharp(src).metadata();
    const outDir = path.join(IMG_DIR, plate.dir);
    await fs.mkdir(outDir, { recursive: true });
    console.log(`\n${plate.id}  ←  ${path.basename(src)}  (${width}×${height})`);

    const base = path.join(outDir, plate.name);
    await writeVariant(sharp(src).avif(AVIF), `${base}.avif`);
    await writeVariant(sharp(src).webp(WEBP), `${base}.webp`);
    await writeVariant(sharp(src).resize(plate.liteWidth).avif(AVIF), `${base}-lite.avif`);
    await writeVariant(sharp(src).resize(plate.liteWidth).webp(WEBP), `${base}-lite.webp`);

    meta[plate.id] = { width, height, lqip: await lqip(src) };
  }
}

/* ── The Cosmic God: an enhanced master ──────────────────────────────────
   Detail that survives WebP/AVIF: the figure gets medium-scale definition
   (local contrast + an unsharp mask tuned for edges, not grain) with its
   shadows kept deep so the face stays mysterious; the background loses its
   single-pixel speckle and stays smooth and compressible. A soft figure mask
   (head, torso, robe, the six arms and their held objects) blends the two.
   Arm polylines mirror the anchors in src/config/media.ts (source pixels). */

const mirrorArm = (pts, axis = 835) => pts.map(([x, y]) => [axis * 2 - x, y]);
const withEnd = (pts, end) => [...pts.slice(0, -1), end];
const ARM_UL = [
  [835, 331],
  [730, 300],
  [655, 305],
  [575, 325],
  [488, 266],
  [442, 232],
  [435, 176],
];
const ARM_ML = [
  [835, 331],
  [760, 360],
  [690, 372],
  [560, 425],
  [415, 455],
  [330, 452],
  [320, 388],
];
const ARM_LL = [
  [835, 331],
  [780, 400],
  [690, 450],
  [600, 548],
  [500, 628],
  [400, 660],
  [385, 618],
];
const ARMS = [
  ARM_UL,
  withEnd(mirrorArm(ARM_UL), [1222, 180]),
  ARM_ML,
  withEnd(mirrorArm(ARM_ML), [1347, 388]),
  ARM_LL,
  withEnd(mirrorArm(ARM_LL), [1297, 612]),
];

function figureMaskSvg(width, height, s) {
  const pts = (arm) => arm.map(([x, y]) => `${x * s},${y * s}`).join(' ');
  const arms = ARMS.map(
    (arm) =>
      `<polyline points="${pts(arm)}" fill="none" stroke="#fff" stroke-width="${92 * s}" stroke-linecap="round" stroke-linejoin="round"/>`,
  ).join('');
  const orbs = ARMS.map((arm) => {
    const [x, y] = arm[arm.length - 1];
    return `<circle cx="${x * s}" cy="${y * s}" r="${88 * s}" fill="#fff"/>`;
  }).join('');
  const body =
    `<ellipse cx="${835 * s}" cy="${150 * s}" rx="${120 * s}" ry="${110 * s}" fill="#fff"/>` +
    `<path d="M ${690 * s} ${230 * s} C ${690 * s} ${330 * s}, ${700 * s} ${420 * s}, ${700 * s} ${470 * s} ` +
    `L ${560 * s} ${940 * s} L ${1110 * s} ${940 * s} L ${970 * s} ${470 * s} ` +
    `C ${970 * s} ${420 * s}, ${980 * s} ${330 * s}, ${980 * s} ${230 * s} Z" fill="#fff"/>`;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#000"/>${body}${arms}${orbs}</svg>`,
  );
}

/** The enhanced cosmic master at 2× the source (raw RGB). */
async function enhanceCosmic(src) {
  const { width: w0, height: h0 } = await sharp(src).metadata();
  const s = 2;
  const width = w0 * s;
  const height = h0 * s;
  const mask = await sharp(figureMaskSvg(width, height, s))
    .blur(28 * s)
    .greyscale()
    .raw()
    .toBuffer();
  const channels = mask.length / (width * height);
  const figure = await sharp(src)
    .resize(width, height, { kernel: 'lanczos3' })
    .clahe({ width: 96, height: 96, maxSlope: 2 })
    .sharpen({ sigma: 2.0, m1: 0.15, m2: 2.4, x1: 3, y2: 14, y3: 24 })
    .linear(1.07, -7)
    .removeAlpha()
    .raw()
    .toBuffer();
  const background = await sharp(await sharp(src).median(3).toBuffer())
    .resize(width, height, { kernel: 'lanczos3' })
    .sharpen({ sigma: 2.2, m1: 0.1, m2: 2.0, x1: 3, y2: 12, y3: 20 })
    .linear(1.04, -4)
    .removeAlpha()
    .raw()
    .toBuffer();
  const out = Buffer.alloc(width * height * 3);
  for (let i = 0, j = 0; i < width * height; i++, j += 3) {
    const m = mask[i * channels] / 255;
    out[j] = background[j] + (figure[j] - background[j]) * m;
    out[j + 1] = background[j + 1] + (figure[j + 1] - background[j + 1]) * m;
    out[j + 2] = background[j + 2] + (figure[j + 2] - background[j + 2]) * m;
  }
  return { raw: out, width, height, sourceWidth: w0, sourceHeight: h0 };
}

async function buildCosmic(meta) {
  const src = await findSource(SOURCES.cosmic);
  const outDir = path.join(IMG_DIR, 'cosmic');
  await fs.mkdir(outDir, { recursive: true });
  console.log(`\ncosmic  ←  ${path.basename(src)}  (enhanced master)`);
  const m = await enhanceCosmic(src);
  const master = () => sharp(m.raw, { raw: { width: m.width, height: m.height, channels: 3 } });
  const base = path.join(outDir, 'cosmic-entity');
  // Desktop WebGL texture: close camera moves on the chest and hands stay crisp.
  await writeVariant(master().webp({ quality: 84, effort: 5 }), `${base}@2x.webp`);
  const oneX = await master().resize(m.sourceWidth, m.sourceHeight, { kernel: 'lanczos3' }).png().toBuffer();
  await writeVariant(sharp(oneX).avif(AVIF), `${base}.avif`);
  await writeVariant(sharp(oneX).webp(WEBP), `${base}.webp`);
  await writeVariant(sharp(oneX).resize(1080).avif(AVIF), `${base}-lite.avif`);
  await writeVariant(sharp(oneX).resize(1080).webp(WEBP), `${base}-lite.webp`);
  // Soft figure mask for the living renderer: energy stays on the body and
  // particles are born at its silhouette (half of 1× — it is blurred anyway).
  const mw = Math.round(m.sourceWidth / 2);
  const mh = Math.round(m.sourceHeight / 2);
  await writeVariant(
    sharp(figureMaskSvg(mw, mh, 0.5))
      .blur(14)
      .greyscale()
      .webp({ quality: 70, effort: 5 }),
    path.join(outDir, 'cosmic-mask.webp'),
  );
  meta.cosmic = { width: m.sourceWidth, height: m.sourceHeight, lqip: await lqip(oneX) };
}

async function buildOgImage() {
  const src = await findSource(SOURCES.eye);
  const outDir = path.join(IMG_DIR, 'og');
  await fs.mkdir(outDir, { recursive: true });
  // Crop around the iris, darken, and letter the brand with a system sans.
  const overlay = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#05060A" stop-opacity="0.92"/>
          <stop offset="0.5" stop-color="#05060A" stop-opacity="0.55"/>
          <stop offset="1" stop-color="#05060A" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
      <text x="72" y="300" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="64" font-weight="300" letter-spacing="6" fill="#F4F6FF">GA AUTOMATIONS</text>
      <text x="74" y="352" font-family="Consolas, Menlo, monospace" font-size="20" letter-spacing="5" fill="#A9B4FF">WE BUILD INTELLIGENT SYSTEMS</text>
      <text x="74" y="560" font-family="Consolas, Menlo, monospace" font-size="18" letter-spacing="4" fill="#6F7AB8">GAAUTO.IN</text>
    </svg>`);
  const out = path.join(outDir, 'og-image.jpg');
  const info = await sharp(src)
    .extract({ left: 40, top: 110, width: 960, height: 504 })
    .resize(1200, 630)
    .modulate({ brightness: 0.9 })
    .composite([{ input: overlay }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(out);
  console.log(`\nog\n  ✓ ${path.relative(ROOT, out)}  ${info.width}×${info.height}  ${kb(info.size)}`);
}

async function buildGrain() {
  const size = 192;
  const px = Buffer.alloc(size * size * 2);
  // Deterministic LCG so the texture is stable between runs.
  let seed = 1337;
  const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < size * size; i++) {
    const v = rand();
    px[i * 2] = v > 0.5 ? 255 : 0; // luminance
    px[i * 2 + 1] = Math.round(Math.abs(v - 0.5) * 2 * 38); // alpha
  }
  const outDir = path.join(ROOT, 'public/assets/textures');
  await fs.mkdir(outDir, { recursive: true });
  const out = path.join(outDir, 'grain.png');
  const info = await sharp(px, { raw: { width: size, height: size, channels: 2 } })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`\ntexture\n  ✓ ${path.relative(ROOT, out)}  ${info.width}×${info.height}  ${kb(info.size)}`);
}

async function main() {
  const meta = {};
  await buildPlates(meta);
  await buildCosmic(meta);
  await buildOgImage();
  await buildGrain();
  await fs.mkdir(path.dirname(META_FILE), { recursive: true });
  await fs.writeFile(META_FILE, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`\nmeta\n  ✓ ${path.relative(ROOT, META_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
