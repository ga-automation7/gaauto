# Assets

## The reference plates

`public/assets/references/` holds the original artwork. The asset pipeline reads it; the build excludes it (see
`vite.config.ts`), so visitors only ever get the optimised versions:

| Prefix | Plate         | Aspect   | Notes                                                                  |
| ------ | ------------- | -------- | ---------------------------------------------------------------------- |
| `01-`  | Eye           | 1360×768 | Iris centre (708, 356), iris r 192, pupil r 60                         |
| `02-`  | City (still)  | 1672×941 | Kept for reference only — the film now uses the drone footage          |
| `03-`  | Cosmic entity | 1672×940 | Heart (835, 331), eyes (820.5, 182.5)/(851.5, 182.3), six held objects |

Files are matched by numeric prefix, so odd names (the current `*.png.png`) still work.

```bash
npm run assets:images    # → public/assets/images/** (AVIF + WebP, lite variants, enhanced cosmic @2x + figure mask, OG card)
npm run assets:textures  # → public/assets/textures/{fog,nebula}.webp
```

`src/data/generated/media-meta.json` holds sizes and tiny blurred placeholders (LQIP) shown before a plate decodes.

## The film's footage — a frame sequence

The city is the supplied drone clip (`media-source/city-drone.mp4`, git-ignored — keep your master there). It ships as
individual WebP frames rather than a `<video>`: a normally-encoded clip has one keyframe, so scrubbing it by scroll
stutters, while frames can be shown instantly in either direction and blended by the exact scroll position.

```bash
npm run assets:frames -- media-source/city-drone.mp4            # decode + encode
npm run assets:frames -- media-source/city-drone.mp4 --force    # decode again (new clip)
npm run assets:frames -- --encode-only --quality=72             # re-encode from the decoded masters
```

Phase 1 decodes the clip with your installed Chromium browser (headless Edge/Chrome/Brave — nothing to install) into
lossless masters in `media-source/frames/`; phase 2 encodes with sharp:

| Output                                                              | What                                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `public/assets/video/city/frames/desktop/*.webp`                    | 192 frames, 1280×720 (≈ 74 KB each)                                                                                              |
| `public/assets/video/city/frames/mobile/*.webp`                     | the same frames as a centred portrait crop, 576×720 (≈ 35 KB each)                                                               |
| `public/assets/video/city/poster.{webp,avif}`, `poster-mobile.webp` | first frame — shown until the sequence draws; the reduced-motion plate                                                           |
| `src/data/generated/film-frames.json`                               | count, fps, crop, LQIP, per-frame light and the **measured camera motion** between frames (used for motion-compensated blending) |
| `scripts/.out/city-sheet.jpg`                                       | contact sheet for a quick look                                                                                                   |

Loading: frames are fetched after the first screen has settled, coarse → fine, the ones ahead of the playhead first.
Phones download the mobile set; Save-Data downloads every 4th frame, low-tier devices every 2nd.

**Replacing the clip:** put the new master in `media-source/`, run `npm run assets:frames -- media-source/<clip>.mp4
--force`, and you're done — the film's length on screen is set in `src/config/cinematic.ts` (`SEQUENCE`), not by the
clip's duration. If the new clip's light is very different, re-check the transformation (it grades from the footage).

## The media manifest

`src/config/media.ts` is the only place file names appear. Components ask for `media.heroEye`, `media.film`
(poster + frame sequence) and `media.cosmicEntity`. Each plate declares its **anchors** (composition points) in the
plate's own pixels; if you replace a plate with a different composition, update its anchors and check with `?debug`.

Loading priority: the eye is `critical` (preloaded in `index.html`); the rest is `idle` (after first paint) or loaded
as the stage approaches.

## Ambient loops (optional)

`npm run assets:video -- <scene> <name> <clip.mp4>` (needs ffmpeg) encodes an ambient loop for a plate's `video` slot
(`heroEye`, `cosmicEntity`) or a per-capability loop (`serviceClips` in `media.ts`). Loops play muted over the still and
are skipped for reduced motion and Save-Data.

## Textures

`fog.webp` is a procedural, seamlessly tiling texture used as a CSS mask over coloured gradients (violet cosmic fog
banks) and drifted with compositor-only transforms. `nebula.webp` comes from the same generator. `grain.png` is the
film-grain tile.
