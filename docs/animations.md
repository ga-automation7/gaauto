# Animation system

## One clock

Everything runs on the GSAP ticker — a single `requestAnimationFrame` loop:

```
gsap.ticker ─► lenis.raf ─► 'scroll' ─► ScrollTrigger.update ─► StageDirector ─► scene timelines
            └─► canvas / WebGL renderers (useTicker, only while their scene is active)
```

`gsap.ticker.lagSmoothing(0)` keeps motion continuous after a slow frame. Lenis uses `lerp` (not duration) and native
momentum on touch devices.

## The stage director

`src/lib/director.ts`. The film's scroll track produces a **stage position** in viewport heights (vh). Scenes register
with `useStageScene(id, builder)`:

```ts
useStageScene('film', (tl, { chapters: ch }) => {
  tl.fromTo(fx, { lights: 0 }, { lights: 1, duration: ch.seq(0.69) - ch.seq(0.59) }, ch.seq(0.59));
  return { start: ch.spans.iris.end - 0.16, end: ch.seq(0.92), onActive, render };
});
```

- The timeline's time axis **is** the stage position — a tween placed at `ch.frac('capabilities', 0.5)` plays halfway
  through that chapter; `ch.seq(t)` addresses the signature sequence (city → reveal) as a fraction.
- Only scenes whose `[start, end]` contains the position are updated; each gets one final update when it leaves, so it
  settles on its boundary state. Per-frame cost stays flat however long the film is.
- `onActive` toggles visibility and starts/stops the scene's render loop. `onPreload` fires a few viewports early for
  heavy media. `render` runs after the timeline each scroll frame (the film uses it to move the footage's playhead).

Chapters and their lengths: `src/config/cinematic.ts` (separate mobile lengths). The signature sequence is split
exactly as briefed: 0–15 % city · 15–30 % THE WORLD IS MOVING · 30–45 % FASTER / EVERY DAY · 45–60 % AI ISN'T COMING /
IT'S ALREADY HERE · 60–75 % city → energy (THE QUESTION IS / WHAT WILL YOU BUILD WITH IT?) · 75–90 % the being emerges ·
90–100 % GA AUTOMATIONS.

## Cameras

`SceneCamera` (`src/lib/camera.ts`) moves a "plate" (image or WebGL-rendered artwork) laid out at cover size:
`focus (x, y)`, `zoom`, `rotate`, plus an additive `offset` for handheld/pointer parallax. The plate always covers the
frame (edges clamped) — the cosmic scene is never letterboxed. Everything inside the plate element (SVG traces, halos,
markers in %) follows automatically; canvases and shaders use the same maths via `camera.project()` / `camera.focus`.

The cosmic camera **tracks the face** whenever it is in view (emergence, GA reveal, finale): the face is centred and its
eyes held near the upper third, targets pre-clamped to the plate so the camera never stalls against an edge, with a slow
organic float on top. In the capabilities chapter it flies to each hand (object on one third, panel on the other; on
phones the hand sits above the docked panel).

**Perceptual zoom:** camera dives use `expoZoom(from, to)` so every slice of scroll multiplies the zoom by the same
factor — constant perceived speed, no lurch.

## The film (02)

- **Footage** — a frame sequence (`src/lib/video/FrameSequence.ts`): downloaded coarse → fine after the first screen has
  settled (every 64th frame, then 32nd … all), frames ahead of the playhead first; only a window around the playhead is
  decoded (`createImageBitmap`, off the main thread) and released behind it. The picture never blanks — the nearest
  decoded frame stands in.
- **Motion-compensated blending** — `FilmCompositor` (`src/lib/webgl/FilmCompositor.ts`) draws two neighbouring frames,
  each warped part-way toward the other along the camera motion measured offline (zoom + shift per frame pair), so a slow
  scroll glides between frames instead of cross-dissolving.
- **The transformation** (same pass, scrubbed): lights brighten and blur into abstraction → violet-blue fog creeps in
  from the edges → motes stream past → lights stretch into trails → the architecture melts into its own light and then
  into dark cosmic energy (crisp electric arcs, endless forward motion) → the energy gathers into the being's silhouette
  (its mask mapped through the cosmic camera) → the being forms from the heart outward and the compositor turns
  transparent over the living render. No cut, no flash, no white frame.
- **Words** — `ui/FilmTitles.tsx`: masked, blur-to-sharp line reveals with a slight drift; FASTER. rushes in stretched.
  `ui/BrandReveal.tsx`: GA AUTOMATIONS condenses letter by letter out of the energy.
- **Fallback** — without WebGL2 the frames are drawn on a 2D canvas and layered atmosphere carries the transformation.

## Other scenes

| Scene       | Technique                                                                                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Eye (01)    | CSS-transformed plate · WebGL2 `HeroRenderer`: instanced capsule particles whose streak length follows speed, and a tunnel shader that samples the iris texture in polar coordinates (amber → machine blue) · iris-locked split lockup     |
| Cosmic (03) | WebGL2 `CosmicRenderer` cinemagraph: breathing torso, heartbeat pulsing through veins, cosmic wind on robe/hair, twinkling stars, nebula, god-rays, breathing aura, burning eyes; bicubic sampling when magnified · SVG arm traces · halos |
| Identity    | The heart releases its light (burst + anamorphic flare) and GA AUTOMATIONS pops out letter by letter, a sheen crosses it, a halo keeps breathing; the being dissolves into the page's own atmosphere                                       |

## Sound

`src/lib/audio/Soundscape.ts` — an original score synthesised with Web Audio (drone, a D minor 9 pad that opens into
D major 9 as the being appears, shimmer, scroll-reactive air, a heartbeat in phase with the being's). Loaded as its own
chunk on the first click of the **Sound** toggle (`components/layout/SoundToggle.tsx`); never plays by itself; follows
the film's position; suspends with the tab.

## Other sections

- **Transformation** — sticky stage (desktop), one scrubbed timeline: capability cards → network → workflow → system,
  with MotionPath pulses and the event log. Plays once on small screens.
- **Use cases** — horizontal track driven by vertical scroll (desktop), native swipe with snap (touch).
- **Event horizon** — ray-traced black hole (`BlackHoleRenderer`, its own chunk, async shader compile); scroll is the
  camera falling toward the horizon.
- **Atmosphere** — one fixed layer (`AmbientCosmos`: violet fog + motes + the rare shooting star) behind every section
  after the film; marquee bands and orbit dials add rhythm.

## Reduced motion

The preference is resolved once (OS setting, overridden by `?motion=` or the footer toggle stored in `localStorage`) and
exposed as `html[data-motion]`. Reduced: no Lenis, no WebGL, the film becomes `CinematicStatic`, reveals render
immediately, CSS animations are neutralised.

## Performance rules

- Only `transform` and `opacity` animate on large layers; blur filters animate only on type, briefly, while scrubbed.
- Full-screen layers a timeline fades every frame carry `will-change`.
- The entity is not rendered while the film's energy fully covers it (`shared.filmCovers`).
- No layout reads in frame loops — sizes are measured on resize only (`size` store / ResizeObserver).
- Render loops run only while their scene/section is active or visible; the marquee only while on screen.
- Canvases are capped by device tier (`src/lib/device.ts`): DPR, particle counts, render scale, streak taps; the film
  canvas never exceeds ~1.9 MP (the footage is 720p).
- Frame sequence: Save-Data downloads every 4th frame, low-tier devices every 2nd.
- WebGL canvases are created fresh per mount (a remount never inherits a lost context).

Measured (production build, headless Chromium on the development machine), scrolling the whole film continuously:
≈ 56 fps average; the heaviest moments (the being forming beneath the energy, the finale) ≈ 47–50 fps.

## Debugging

`?debug` exposes `window.__lenis`, `window.__eye`, `window.__cosmic` (camera) and `window.__sound`, e.g.
`__lenis.scrollTo(innerHeight * 12, { immediate: true })`.
