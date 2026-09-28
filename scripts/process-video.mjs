#!/usr/bin/env node
/**
 * process-video.mjs
 * ─────────────────
 * Turns generated master clips (e.g. Seedance / Kling) into web assets.
 *
 *   npm run assets:video -- <scene> <name> <clip.mp4> [next.mp4 …] [--scrub] [--fps=24]
 *
 *   The film (flight, then the city → Cosmic God transition generated from the
 *   flight's last frame):
 *     npm run assets:video -- film film media-source/flight.mp4 media-source/morph.mp4 --scrub
 *
 * Several clips are joined into ONE file. Each clip after the first is expected
 * to start on the previous clip's last frame (that is how the transition is
 * generated), so its first frame is dropped: the join frame appears once and
 * the motion runs straight through it.
 *
 * Writes to public/assets/video/<scene>/:
 *   <name>-1080p.mp4   desktop (H.264, faststart)
 *   <name>-720p.mp4    mobile
 *   <name>-poster.webp first frame
 * With --scrub every frame is a keyframe (all-intra), so the site can show any
 * frame instantly while scroll drives playback. Files are larger — the trade
 * for perfectly smooth scrubbing.
 *
 * Requires ffmpeg + ffprobe on PATH (Windows: `winget install Gyan.FFmpeg`).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const [scene, name, ...inputs] = args.filter((a) => !a.startsWith('--'));
const scrub = flags.has('--scrub');
const fpsFlag = args.find((a) => a.startsWith('--fps='));
const fps = fpsFlag ? Number(fpsFlag.split('=')[1]) : 24;

function fail(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

if (!scene || !name || inputs.length === 0) {
  fail('Usage: npm run assets:video -- <scene> <name> <clip.mp4> [next.mp4 …] [--scrub] [--fps=24]');
}
for (const input of inputs) if (!fs.existsSync(input)) fail(`Input not found: ${input}`);

for (const tool of ['ffmpeg', 'ffprobe']) {
  const probe = spawnSync(tool, ['-version'], { encoding: 'utf8' });
  if (probe.error || probe.status !== 0) {
    fail(
      `${tool} was not found on PATH.\n` +
        '  Install ffmpeg (Windows: winget install Gyan.FFmpeg · macOS: brew install ffmpeg), open a new terminal, and run this again.',
    );
  }
}

/** Duration of a clip in seconds. */
function duration(file) {
  const r = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
    {
      encoding: 'utf8',
    },
  );
  return Number(r.stdout.trim()) || 0;
}

const outDir = path.join(ROOT, 'public/assets/video', scene);
fs.mkdirSync(outDir, { recursive: true });

const gop = scrub ? ['-g', '1', '-keyint_min', '1', '-sc_threshold', '0'] : ['-g', String(fps * 2)];
const variants = [
  { suffix: '1080p', height: 1080, crf: scrub ? '21' : '22' },
  { suffix: '720p', height: 720, crf: scrub ? '24' : '25' },
];

/** One filter graph: normalise every clip, drop each join frame, concatenate. */
function graph(height) {
  const parts = inputs.map((_, i) => {
    const trim = i === 0 ? '' : ',trim=start_frame=1,setpts=PTS-STARTPTS';
    return `[${i}:v]fps=${fps},scale=-2:${height}:flags=lanczos,setsar=1,format=yuv420p${trim}[v${i}]`;
  });
  const joined = inputs.map((_, i) => `[v${i}]`).join('');
  return `${parts.join(';')};${joined}concat=n=${inputs.length}:v=1:a=0[out]`;
}

for (const v of variants) {
  const out = path.join(outDir, `${name}-${v.suffix}.mp4`);
  console.log(`→ ${path.relative(ROOT, out)}`);
  const r = spawnSync(
    'ffmpeg',
    [
      '-y',
      ...inputs.flatMap((input) => ['-i', input]),
      '-filter_complex',
      graph(v.height),
      '-map',
      '[out]',
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      v.crf,
      '-profile:v',
      'high',
      ...gop,
      '-movflags',
      '+faststart',
      '-an',
      out,
    ],
    { stdio: 'inherit' },
  );
  if (r.status !== 0) fail(`ffmpeg failed for ${v.suffix}`);
}

const poster = path.join(outDir, `${name}-poster.webp`);
spawnSync('ffmpeg', ['-y', '-i', inputs[0], '-vframes', '1', '-vf', 'scale=-2:1080', '-q:v', '80', poster], {
  stdio: 'inherit',
});

const lengths = inputs.map(duration);
const flight = lengths[0] ?? 0;
const morph = lengths.slice(1).reduce((sum, d) => sum + Math.max(0, d - 1 / fps), 0);

console.log(`
✓ Done. For the film, set media.film.footage in src/config/media.ts:

  footage: {
    desktop: '/assets/video/${scene}/${name}-1080p.mp4',
    mobile: '/assets/video/${scene}/${name}-720p.mp4',
    fps: ${fps},
    flight: ${flight.toFixed(2)},
    morph: ${morph.toFixed(2)}, // 0 if the transition is not in the footage
    heading: { x: 0.5, y: 0.4 }, // where the flight is heading as it ends (normalised)
  },
`);
