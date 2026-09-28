# Assets

## The reference plates

`public/assets/references/` holds the original artwork. The asset pipeline reads it; the build
excludes it (see `vite.config.ts`), so visitors only ever get the optimised versions:

| Prefix | Plate         | Aspect   | Notes                                                                  |
| ------ | ------------- | -------- | ---------------------------------------------------------------------- |
| `01-`  | Eye           | 1360×768 | Iris centre (708, 356), iris r 192, pupil r 60                         |
| `02-`  | City          | 1672×941 | Core ring (848, 340) — the pupil's twin                                |
| `03-`  | Cosmic entity | 1672×940 | Heart (835, 331), eyes (820.5, 182.5)/(851.5, 182.3), six held objects |

Files are matched by numeric prefix, so odd names (the current `*.png.png`) still work.

## Pipeline

```bash
npm run assets:images    # → public/assets/images/** (AVIF + WebP, lite variants, cosmic @2x, work crops, OG card)
npm run assets:anchors   # → src/data/generated/city-network.json   (add -- --debug for a preview PNG)
npm run assets:textures  # → public/assets/textures/{fog,nebula}.webp
```

`src/data/generated/media-meta.json` holds sizes and tiny blurred placeholders (LQIP) shown before a plate decodes.

## The media manifest

`src/config/media.ts` is the only place file names appear. Components ask for `media.heroEye`, `media.cityAI`,
`media.cosmicEntity`, and transition slots `media.cityReveal`, `media.cosmicReveal`.

Each plate declares its **anchors** (composition points) in the plate's own pixels. If you replace a plate with a
different composition, update its anchors and check with `?debug`.

Loading priority: the eye is `critical` (preloaded in `index.html`); city and cosmic plates are `idle` (after first
paint); videos load when the stage approaches their scene.

## Replacing the hero eye / city / cosmic still

Drop the new file into `public/assets/references/` with the same prefix, run `npm run assets:images` (and
`assets:anchors` for the city), update anchors if the composition changed.

## Adding a video

1. Put the raw master somewhere outside `public/` (e.g. `media-source/`, git-ignored).
2. Encode:
   ```bash
   npm run assets:video -- media-source/city-drone.mp4 city city-drone --scrub
   ```
   `--scrub` encodes every frame as a keyframe so scroll can seek instantly (larger file, perfectly smooth). Omit it for
   ambient loops.
3. Add the printed `video: { … }` block to the plate in `src/config/media.ts`:
   - `playback: 'scrub'` — driven by scroll through the scene. For the city, the footage then carries the drone motion;
     the camera only makes the final dive into `focus` (where the core ring sits in the clip's last frame, default the
     frame centre), and the light layer — mapped to the still's towers — switches off.
   - `playback: 'loop'` — plays muted on top of the still while the scene is active.

Mobile gets the `mobile` source; the still always remains as poster and fallback. Videos are skipped for reduced motion
and Save-Data, and the scene falls back to its camera move over the still.

## Seedance brief — the city drone shot

The film's second chapter is designed to take a generated drone shot. Suggested generation (Seedance 2.5,
image-to-video with `02-city` or your gothic-city reference as the first frame, or text-to-video):

**Prompt**

> Hyperrealistic cinematic drone shot at night, a single continuous take. The shot opens tight on a glowing circular
> portal ring of blue-violet light at the heart of a vast futuristic megacity, then pulls back and rises to reveal the
> city, glides slowly forward over it in a gentle banking turn, and finally pushes in toward the glowing ring again,
> ending with the ring centred in frame. Gothic needle spires, round mega-towers carrying
> illuminated saucer platforms, thousands of warm amber windows with violet neon strips, sleek flying vehicles with blue
> thruster glow moving through the skyline, low fog drifting between the towers, a mirror-still canal reflecting the
> lights, faint cyan-violet aurora and a giant moon in a hazy night sky. Photoreal, IMAX-quality detail, 24 mm lens,
> smooth stabilised gimbal motion, volumetric haze, filmic contrast. Colour: deep navy and indigo shadows, electric blue
> and ultraviolet highlights, warm amber practicals.

**Negative** — text, logos, watermarks, people in close-up, daylight, cartoon or CGI look, warping buildings, jump cuts,
shaky camera.

**Output** — 8–10 s, 24 fps, 16:9 1920×1080 (plus a 9:16 variant for mobile if possible). Then encode with `--scrub`
as above and set `media.cityAI.video`. The opening frame should match the city still (the scene starts where the iris
opens onto the ring); if the last frame doesn't end with the ring centred, set `focus` to where it is.

The same approach works for a living eye (`heroEye`, loop), a cosmic-entity loop (`cosmicEntity`, loop) and short
per-capability loops (`serviceClips` in `media.ts`).

## Textures

`fog.webp` is a procedural, seamlessly tiling texture used as a CSS mask over coloured gradients (blue city haze, violet
cosmic fog banks) and drifted with compositor-only transforms. `nebula.webp` comes from the same generator and is kept
for a future nebula layer (not loaded today). `grain.png` is the film-grain tile.
