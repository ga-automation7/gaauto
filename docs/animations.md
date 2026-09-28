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
useStageScene('city', (tl, { chapters: ch }) => {
  tl.fromTo(camera.state, { zoom: 3.1 }, { zoom: 1.1, ease: 'surface', duration: 1.3 }, ch.at('city'));
  return { start: ch.at('iris', 1.4), end: ch.frac('ascension', 0.74), onActive, render };
});
```

- The timeline's time axis **is** the stage position — a tween placed at `ch.frac('city', 0.5)` plays halfway through
  the city chapter.
- Only scenes whose `[start, end]` contains the position are updated; each gets one final update when it leaves, so it
  settles on its boundary state. Per-frame cost stays flat however long the film is.
- `onActive` toggles visibility and starts/stops the scene's render loop. `onPreload` fires a few viewports early for
  heavy media. `render` runs after the timeline each scroll frame (used for video scrubbing).

Chapters and their lengths: `src/config/cinematic.ts` (separate mobile lengths).

## Cameras

`SceneCamera` (`src/lib/camera.ts`) moves a "plate" (image, video, or WebGL-rendered artwork) laid out at cover size:
`focus (x, y)`, `zoom`, `rotate`, plus an additive `offset` for handheld/pointer parallax and a per-layout `zoomBase`.
Everything inside the plate element (SVG traces, halos, markers in %) follows automatically; canvases and shaders use the
same maths via `camera.project()` / `camera.focus` so overlays stay locked to the artwork at any size.

**Perceptual zoom:** camera dives use `expoZoom(from, to)` so every slice of scroll multiplies the zoom by the same
factor — constant perceived speed, no lurch.

## Scenes

| Scene       | Technique                                                                                                                                                                                                                                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Eye (01)    | CSS-transformed plate · WebGL2 `HeroRenderer`: instanced capsule particles (dust + iris glints) whose streak length follows speed, and a tunnel shader that samples the iris texture in polar coordinates (amber → machine blue) · iris-locked split lockup                                                                                                        |
| City (02)   | Drone-shot camera over the plate · three parallax haze layers · `NeuralField` canvas wakes the real lights (nodes detected from the artwork) · dive into the core ring with a bloom. With a scrubbed drone video the footage carries the motion, the light layer is off and the camera only makes the final dive (to `video.focus`)                                |
| Cosmic (03) | WebGL2 `CosmicRenderer` cinemagraph: breathing torso, cosmic wind on robe/hair, energy pulses through veins, twinkling stars, drifting nebula and motes, god-rays, breathing aura, burning eyes; bicubic sampling when magnified · SVG arm traces (DrawSVG) · hand halos · per-hand camera flights with docked capability cards and leader lines · identity reveal |

## Other sections

- **Transformation** — sticky stage, one scrubbed timeline (particles → lattice → workflow → system), MotionPath
  pulses, event log. Plays once on small screens.
- **Use cases** — horizontal track driven by vertical scroll (desktop), native swipe with snap (touch).
- **Work** — clip-path reveal + inner parallax, scrubbed.
- **About** — word-by-word highlight, scrubbed.
- **Playground** — `CityRenderer` with an orbit camera (drag / arrow keys, inertia, idle orbit); renders only while
  visible. The renderer is its own chunk, imported as the section approaches, then pre-warmed.

## Reduced motion

The preference is resolved once (OS setting, overridden by `?motion=` or the footer toggle stored in `localStorage`) and
exposed as `html[data-motion]`. Reduced: no Lenis, no WebGL, the film becomes `CinematicStatic`, reveals render
immediately, CSS animations are neutralised.

## Performance rules

- Only `transform` and `opacity` animate on large layers; no animated filters or blurs; `backdrop-filter` is not used over
  moving content.
- Full-screen layers that a timeline fades or scales every frame (blooms, flashes, shades, vignettes, the heart) carry
  `will-change: opacity` / `transform`, so the compositor animates them without re-painting a screen-sized gradient.
- Scene hand-offs happen under full bloom and overlap as briefly as possible: two scenes at full cost at once is the
  most expensive moment of the film.
- A canvas with nothing to draw is left alone (clearing it again still re-uploads the layer).
- No layout reads in frame loops — sizes are measured on resize only (`size` store / ResizeObserver).
- Render loops run only while their scene/section is active or visible.
- Canvases are capped by device tier (`src/lib/device.ts`): DPR, particle counts, render scale, city density.
- Shaders are pre-warmed (one off-screen frame) so compilation never lands on a scroll frame.
- WebGL canvases are created fresh per mount (a remount never inherits a lost context).
- GPU-heavy textures (2× cosmic plate) are desktop-only.

Measured on the development machine (Intel i3-7100, HD Graphics 630), production build, scrolling the whole film
(eye → city → cosmic → six hands → identity) continuously in ~19 s: ≈ 59.6–59.8 fps average, 99th-percentile frame
16.9 ms, at most a few single missed frames per pass. Interactive 3D city ≈ 58–60 fps.

## Debugging

`?debug` exposes `window.__lenis`, `window.__eye` (fx state, camera) and `window.__cosmic` (camera) so positions can be
inspected or set by hand, e.g. `__lenis.scrollTo(innerHeight * 5.4, { immediate: true })`.
