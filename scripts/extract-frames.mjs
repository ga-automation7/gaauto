#!/usr/bin/env node
/**
 * extract-frames.mjs
 * ──────────────────
 * Turns a master clip into a scroll-scrubbable FRAME SEQUENCE for the film.
 *
 *   npm run assets:frames -- media-source/city-drone.mp4
 *   npm run assets:frames -- media-source/city-drone.mp4 --force        (re-decode)
 *   npm run assets:frames -- media-source/city-drone.mp4 --encode-only  (re-encode from masters)
 *
 * Why frames and not a <video>: browsers seek a video by decoding forward from
 * the previous keyframe, so scrubbing a normally-encoded clip (one keyframe for
 * the whole shot) stutters. Individual frames can be shown instantly in either
 * direction, and the site blends two neighbouring frames by the exact scroll
 * position, so even a very slow scroll moves continuously.
 *
 * No extra software: phase 1 decodes the clip with the Chromium-based browser
 * already installed (Edge / Chrome / Brave, headless, driven over the DevTools
 * protocol); phase 2 encodes with sharp (a dev dependency).
 *
 *   1. decode → media-source/frames/<name>/0000.webp …   lossless masters (git-ignored)
 *   2. encode → public/assets/video/<name>/frames/desktop/000.webp   full frame, 1280 wide
 *               public/assets/video/<name>/frames/mobile/000.webp    portrait centre crop, full height
 *               public/assets/video/<name>/poster.webp · poster.avif · poster-mobile.webp
 *               src/data/generated/film-frames.json                  count, sizes, LQIP, per-frame light
 *               scripts/.out/<name>-sheet.jpg                         contact sheet (preview)
 *
 * Options: --name=city --fps=24 --browser="C:/…/msedge.exe"
 *          --quality=70 --mobile-quality=66 --mobile-aspect=0.8 --mobile-x=0.5
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const opt = (key, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${key}=`));
  return hit ? hit.slice(key.length + 3) : fallback;
};
const flag = (key) => args.includes(`--${key}`);
const input = args.find((a) => !a.startsWith('--'));

const NAME = opt('name', 'city');
const FPS = Number(opt('fps', 24));
const DESKTOP_W = 1280;
const QUALITY = Number(opt('quality', 70));
const MOBILE_QUALITY = Number(opt('mobile-quality', 66));
/** Width ÷ height of the portrait crop served to phones and portrait tablets. */
const MOBILE_ASPECT = Number(opt('mobile-aspect', 0.8));
/** Horizontal centre of that crop (0–1 of the frame width). */
const MOBILE_X = Number(opt('mobile-x', 0.5));

const MASTER_DIR = path.join(ROOT, 'media-source/frames', NAME);
const OUT_DIR = path.join(ROOT, 'public/assets/video', NAME);
const META_FILE = path.join(ROOT, 'src/data/generated/film-frames.json');
const SHEET = path.join(ROOT, 'scripts/.out', `${NAME}-sheet.jpg`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;
const pad = (i, n) => String(i).padStart(n, '0');

function fail(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

/* ── Phase 1 · decode with the local browser ─────────────────────────────── */

function findBrowser() {
  const custom = opt('browser');
  if (custom) return custom;
  const local = process.env.LOCALAPPDATA ?? '';
  const candidates = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    path.join(local, 'Google/Chrome/Application/chrome.exe'),
    'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/microsoft-edge',
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) fail('No Chromium-based browser found. Pass one with --browser="<path to chrome/edge/brave>".');
  return found;
}

/** The page that runs inside the browser: seek to every frame centre, draw it, upload it. */
const PAGE = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000">
<script type="module">
const fps = ${FPS};
const v = document.createElement('video');
v.muted = true; v.playsInline = true; v.preload = 'auto';
v.style.cssText = 'width:320px;height:180px';
v.src = '/source';
document.body.append(v);
try {
  await new Promise((res, rej) => {
    v.onloadeddata = res;
    v.onerror = () => rej(new Error('cannot decode the clip (code ' + (v.error && v.error.code) + ')'));
  });
  const count = Math.round(v.duration * fps);
  const canvas = new OffscreenCanvas(v.videoWidth, v.videoHeight);
  const ctx = canvas.getContext('2d');
  const presented = () => new Promise((res) => {
    const t = setTimeout(res, 250);
    v.requestVideoFrameCallback(() => { clearTimeout(t); res(); });
  });
  for (let i = 0; i < count; i++) {
    const frameShown = presented();
    await new Promise((res) => { v.onseeked = res; v.currentTime = Math.min(v.duration - 1e-3, (i + 0.5) / fps); });
    await frameShown;
    ctx.drawImage(v, 0, 0);
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const r = await fetch('/frame?i=' + i + '&n=' + count, { method: 'POST', body: blob });
    if (!r.ok) throw new Error('upload failed for frame ' + i);
  }
  window.__result = { count, width: v.videoWidth, height: v.videoHeight, duration: v.duration };
} catch (err) {
  window.__result = { error: String(err && err.message || err) };
}
</script>`;

async function decode(file) {
  await fsp.rm(MASTER_DIR, { recursive: true, force: true });
  await fsp.mkdir(MASTER_DIR, { recursive: true });
  const size = fs.statSync(file).size;
  let received = 0;
  let expected = 0;
  const writes = [];

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname === '/') {
      res.writeHead(200, { 'content-type': 'text/html' }).end(PAGE);
    } else if (url.pathname === '/source') {
      // Range support: the browser seeks within the file.
      const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '');
      const start = range?.[1] ? Number(range[1]) : 0;
      const end = range?.[2] ? Number(range[2]) : size - 1;
      res.writeHead(range ? 206 : 200, {
        'content-type': 'video/mp4',
        'accept-ranges': 'bytes',
        'content-length': end - start + 1,
        ...(range ? { 'content-range': `bytes ${start}-${end}/${size}` } : {}),
      });
      fs.createReadStream(file, { start, end }).pipe(res);
    } else if (url.pathname === '/frame' && req.method === 'POST') {
      const i = Number(url.searchParams.get('i'));
      expected = Number(url.searchParams.get('n'));
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        const job = sharp(Buffer.concat(chunks))
          .webp({ lossless: true, effort: 1 })
          .toFile(path.join(MASTER_DIR, `${pad(i, 4)}.webp`))
          .then(() => {
            received++;
            if (received % 24 === 0 || received === expected)
              process.stdout.write(`  decoded ${received}/${expected}\r`);
          });
        writes.push(job);
        job.then(
          () => res.writeHead(204).end(),
          (err) => res.writeHead(500).end(String(err)),
        );
      });
    } else {
      res.writeHead(404).end();
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = /** @type {import('node:net').AddressInfo} */ (server.address()).port;

  const browser = findBrowser();
  const debugPort = 9400 + Math.floor(Math.random() * 400);
  const profile = await fsp.mkdtemp(path.join(os.tmpdir(), 'ga-frames-'));
  console.log(`\n▸ Decoding ${path.relative(ROOT, file)} with ${path.basename(browser)}`);
  const proc = spawn(
    browser,
    [
      '--headless=new',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--mute-audio',
      '--autoplay-policy=no-user-gesture-required',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  try {
    let target;
    for (let i = 0; i < 80 && !target; i++) {
      try {
        const list = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
        target = list.find((t) => t.type === 'page');
      } catch {
        /* not up yet */
      }
      if (!target) await sleep(250);
    }
    if (!target) throw new Error('the browser did not start');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r, j) => {
      ws.onopen = r;
      ws.onerror = j;
    });
    let id = 0;
    const pending = new Map();
    ws.onmessage = (m) => {
      const msg = JSON.parse(String(m.data));
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    };
    const send = (method, params = {}) =>
      new Promise((r) => {
        const mid = ++id;
        pending.set(mid, r);
        ws.send(JSON.stringify({ id: mid, method, params }));
      });
    await send('Page.enable');
    await send('Page.navigate', { url: `http://127.0.0.1:${port}/` });

    let result;
    for (let waited = 0; !result; waited += 500) {
      if (waited > 10 * 60_000) throw new Error('timed out while decoding');
      await sleep(500);
      const r = await send('Runtime.evaluate', { expression: 'window.__result', returnByValue: true });
      result = r.result?.result?.value;
    }
    ws.close();
    if (result.error) throw new Error(result.error);
    await Promise.all(writes);
    process.stdout.write('\n');
    console.log(
      `  ✓ ${result.count} frames · ${result.width}×${result.height} · ${result.duration.toFixed(2)} s`,
    );
    return result;
  } finally {
    proc.kill();
    server.close();
    await sleep(300);
    await fsp.rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}

/* ── Motion between neighbouring frames ──────────────────────────────────── */

/**
 * For every pair of frames, the camera's motion as one zoom + shift
 * (x' = s·x + b, frame-normalised). The site uses it to blend two frames
 * motion-compensated — each warped halfway toward the other — so a slow scroll
 * glides between frames instead of cross-dissolving them.
 */
async function estimateMotion(masters) {
  const W = 192;
  const H = 108;
  const frames = [];
  for (const f of masters) {
    const { data } = await sharp(path.join(MASTER_DIR, f))
      .resize(W, H, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    frames.push(Float32Array.from(data));
  }
  const cx = (W - 1) / 2;
  const cy = (H - 1) / 2;
  // Mean |B(p) − A(W⁻¹p)| with W(p) = s·(p − c) + c + t (pixel units).
  const error = (A, B, s, tx, ty, step) => {
    let sum = 0;
    let n = 0;
    for (let y = 6; y < H - 6; y += step) {
      for (let x = 6; x < W - 6; x += step) {
        const ax = (x - cx - tx) / s + cx;
        const ay = (y - cy - ty) / s + cy;
        const x0 = Math.floor(ax);
        const y0 = Math.floor(ay);
        if (x0 < 0 || y0 < 0 || x0 >= W - 1 || y0 >= H - 1) continue;
        const fx = ax - x0;
        const fy = ay - y0;
        const i = y0 * W + x0;
        const a =
          (A[i] * (1 - fx) + A[i + 1] * fx) * (1 - fy) + (A[i + W] * (1 - fx) + A[i + W + 1] * fx) * fy;
        sum += Math.abs(B[y * W + x] - a);
        n++;
      }
    }
    return n ? sum / n : Infinity;
  };
  const raw = [];
  let before = 0;
  let after = 0;
  for (let i = 0; i < frames.length - 1; i++) {
    const A = frames[i];
    const B = frames[i + 1];
    let best = { s: 1, tx: 0, ty: 0, e: error(A, B, 1, 0, 0, 1) };
    before += best.e;
    // Coarse: zoom 0.99–1.04, shift ±3 px; then refine around the best.
    for (let s = 0.99; s <= 1.0401; s += 0.002)
      for (let tx = -3; tx <= 3; tx += 0.5)
        for (let ty = -3; ty <= 3; ty += 0.5) {
          const e = error(A, B, s, tx, ty, 3);
          if (e < best.e) best = { s, tx, ty, e };
        }
    let fine = { ...best, e: error(A, B, best.s, best.tx, best.ty, 1) };
    for (let ds = -0.002; ds <= 0.00201; ds += 0.0005)
      for (let dx = -0.5; dx <= 0.501; dx += 0.125)
        for (let dy = -0.5; dy <= 0.501; dy += 0.125) {
          const e = error(A, B, best.s + ds, best.tx + dx, best.ty + dy, 1);
          if (e < fine.e) fine = { s: best.s + ds, tx: best.tx + dx, ty: best.ty + dy, e };
        }
    after += fine.e;
    raw.push(fine);
    if ((i + 1) % 24 === 0) process.stdout.write(`  motion ${i + 1}/${frames.length - 1}\r`);
  }
  process.stdout.write('\n');
  // Smooth over time: the camera glides, the estimate should too.
  const kernel = [1, 2, 3, 2, 1];
  const smooth = (key) =>
    raw.map((_, i) => {
      let sum = 0;
      let w = 0;
      kernel.forEach((k, j) => {
        const r = raw[i + j - 2];
        if (r) {
          sum += r[key] * k;
          w += k;
        }
      });
      return sum / w;
    });
  const S = smooth('s');
  const TX = smooth('tx');
  const TY = smooth('ty');
  // As x' = s·x + b in normalised frame coordinates (the site's form).
  const motion = S.map((s, i) => {
    const bx = ((1 - s) * cx + TX[i]) / (W - 1);
    const by = ((1 - s) * cy + TY[i]) / (H - 1);
    return [Math.round(s * 1e5) / 1e5, Math.round(bx * 1e5) / 1e5, Math.round(by * 1e5) / 1e5];
  });
  const n = frames.length - 1;
  console.log(
    `  ✓ motion: frame difference ${(before / n).toFixed(2)} → ${(after / n).toFixed(2)} once compensated`,
  );
  return motion;
}

/* ── Phase 2 · encode the web sets ───────────────────────────────────────── */

async function encode() {
  const masters = (await fsp.readdir(MASTER_DIR)).filter((f) => f.endsWith('.webp')).sort();
  if (masters.length === 0)
    fail(`No decoded frames in ${path.relative(ROOT, MASTER_DIR)} — run without --encode-only.`);
  const first = await sharp(path.join(MASTER_DIR, masters[0])).metadata();
  const srcW = first.width ?? DESKTOP_W;
  const srcH = first.height ?? 720;
  const desktopW = Math.min(DESKTOP_W, srcW);
  const desktopH = Math.round((srcH * desktopW) / srcW);
  // Phones show the middle of a landscape frame: ship only that crop, at the frame's full height.
  const cropW = Math.min(srcW, Math.round((srcH * MOBILE_ASPECT) / 2) * 2);
  const cropX = Math.round(Math.min(srcW - cropW, Math.max(0, MOBILE_X * srcW - cropW / 2)));

  const dDir = path.join(OUT_DIR, 'frames/desktop');
  const mDir = path.join(OUT_DIR, 'frames/mobile');
  await fsp.rm(path.join(OUT_DIR, 'frames'), { recursive: true, force: true });
  await fsp.mkdir(dDir, { recursive: true });
  await fsp.mkdir(mDir, { recursive: true });

  console.log(`\n▸ Encoding ${masters.length} frames → ${path.relative(ROOT, OUT_DIR)}`);
  let dBytes = 0;
  let mBytes = 0;
  const light = [];
  const digits = String(masters.length - 1).length < 3 ? 3 : String(masters.length - 1).length;
  const workers = Math.max(2, Math.min(8, os.cpus().length - 1));
  let next = 0;
  await Promise.all(
    Array.from({ length: workers }, async () => {
      while (next < masters.length) {
        const i = next++;
        const src = path.join(MASTER_DIR, masters[i]);
        const d = await sharp(src)
          .resize(desktopW, desktopH)
          .webp({ quality: QUALITY, effort: 6, smartSubsample: true })
          .toFile(path.join(dDir, `${pad(i, digits)}.webp`));
        const m = await sharp(src)
          .extract({ left: cropX, top: 0, width: cropW, height: srcH })
          .webp({ quality: MOBILE_QUALITY, effort: 6, smartSubsample: true })
          .toFile(path.join(mDir, `${pad(i, digits)}.webp`));
        dBytes += d.size;
        mBytes += m.size;
        // The frame's light (mean colour, 0–1): the site grades the transition from it.
        const { channels } = await sharp(src).resize(64).stats();
        light[i] = channels.slice(0, 3).map((c) => Math.round((c.mean / 255) * 1000) / 1000);
        if ((i + 1) % 24 === 0) process.stdout.write(`  encoded ${i + 1}/${masters.length}\r`);
      }
    }),
  );
  process.stdout.write('\n');
  console.log(
    `  ✓ desktop ${desktopW}×${desktopH}   ${kb(dBytes)} total · ${kb(dBytes / masters.length)} avg`,
  );
  console.log(`  ✓ mobile  ${cropW}×${srcH}    ${kb(mBytes)} total · ${kb(mBytes / masters.length)} avg`);

  const firstFrame = path.join(MASTER_DIR, masters[0]);
  await sharp(firstFrame)
    .resize(desktopW, desktopH)
    .webp({ quality: 74, effort: 6 })
    .toFile(path.join(OUT_DIR, 'poster.webp'));
  await sharp(firstFrame)
    .resize(desktopW, desktopH)
    .avif({ quality: 55, effort: 6 })
    .toFile(path.join(OUT_DIR, 'poster.avif'));
  await sharp(firstFrame)
    .extract({ left: cropX, top: 0, width: cropW, height: srcH })
    .webp({ quality: 70, effort: 6 })
    .toFile(path.join(OUT_DIR, 'poster-mobile.webp'));
  const lqip = await sharp(firstFrame).resize(32).blur(0.6).webp({ quality: 40 }).toBuffer();

  // Contact sheet: every 8th frame, for a quick look at the whole shot.
  const step = 8;
  const thumbs = [];
  for (let i = 0; i < masters.length; i += step) {
    thumbs.push(
      await sharp(path.join(MASTER_DIR, masters[i])).resize(320, 180).jpeg({ quality: 80 }).toBuffer(),
    );
  }
  const cols = 6;
  const rows = Math.ceil(thumbs.length / cols);
  await fsp.mkdir(path.dirname(SHEET), { recursive: true });
  await sharp({ create: { width: cols * 320, height: rows * 180, channels: 3, background: '#000' } })
    .composite(thumbs.map((input, k) => ({ input, left: (k % cols) * 320, top: Math.floor(k / cols) * 180 })))
    .jpeg({ quality: 82 })
    .toFile(SHEET);

  const motion = await estimateMotion(masters);

  const meta = {
    name: NAME,
    fps: FPS,
    count: masters.length,
    digits,
    base: `/assets/video/${NAME}`,
    desktop: { width: desktopW, height: desktopH, bytes: dBytes },
    mobile: { width: cropW, height: srcH, bytes: mBytes, cropX: cropX / srcW, cropW: cropW / srcW },
    lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
    light,
    motion,
  };
  await fsp.writeFile(META_FILE, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`  ✓ ${path.relative(ROOT, META_FILE)}`);
  console.log(`  ✓ ${path.relative(ROOT, SHEET)} (preview)\n`);
}

/* ── Run ─────────────────────────────────────────────────────────────────── */

if (!flag('encode-only')) {
  if (!input) fail('Usage: npm run assets:frames -- <clip.mp4> [--force] [--encode-only] [--name=city]');
  if (!fs.existsSync(input)) fail(`Input not found: ${input}`);
  const hasMasters = fs.existsSync(MASTER_DIR) && fs.readdirSync(MASTER_DIR).some((f) => f.endsWith('.webp'));
  if (!hasMasters || flag('force')) await decode(path.resolve(input));
  else
    console.log(`\n▸ Using decoded masters in ${path.relative(ROOT, MASTER_DIR)} (--force to decode again)`);
}
await encode();
