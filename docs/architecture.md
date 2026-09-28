# Architecture

## Why Vite + React (not Next.js)

The site is a client-rendered, scroll-driven experience: nearly every pixel of the opening is produced by GSAP timelines,
canvases and WebGL at runtime, so server rendering buys little and adds hydration constraints. Vite keeps the build and
dev loop fast on modest hardware (this project was built on a 2-core machine with integrated graphics). SEO essentials
live in `index.html` (meta, Open Graph, JSON-LD, a `<noscript>` summary). The future backend is a separate service behind
`src/services/` — see [future-backend.md](future-backend.md).

## Folder structure

```
src/
  animations/        motion primitives (perceptual easing: exponential zoom, cruise)
  components/
    common/          PlateMedia (image/video plate), SectionHeading
    layout/          SmoothScroll, AmbientCosmos (page atmosphere), SoundToggle, Footer, Grain
    navigation/      Header, MenuOverlay
    sections/        one folder per page section (see README page map)
      cinematic/     the opening film: stage, scenes, stage UI
    ui/              Logo, CircleArrow, Glyph, EditorialCard, Marquee, OrbitDial
  config/            env, site, media manifest, cinematic chapters
  data/              services, use cases, technology, workflow (+ generated/: media meta, film frames)
  hooks/             useStageScene, useTicker, useReveal, useMagnetic, usePointer, useMediaQuery
  lib/               gsap registration, smooth scroll, camera, director, device profile, loading, size store,
                     math, SVG paths, debug flag
    audio/           Soundscape (the film's synthesised score)
    canvas/          AmbientField, NeuralStars, OrbitSystem, AuraOrb (2D canvases)
    video/           FrameSequence (the film's footage, scroll-scrubbed)
    webgl/           HeroRenderer, FilmCompositor, CosmicRenderer, BlackHoleRenderer
  services/          content repository, contact, analytics, http — the backend boundary
  styles/            tokens, reset, typography, global, fonts
  types/             shared types
public/assets/       references (originals), images (generated), video/city (the film's frame sequence), textures
scripts/             asset pipeline (frames, images, textures, video loops)
docs/
```

## The opening film (sections 01–03)

`CinematicStage` renders a tall scroll track with a `position: sticky` 100lvh viewport. One ScrollTrigger turns scroll
into a **stage position** measured in viewport heights and hands it to the `StageDirector`
([animations.md](animations.md)). Scenes register timelines whose time axis _is_ the stage position. Chapter lengths live
in `src/config/cinematic.ts` — re-timing the film is a config change.

Scene order in `App.tsx` is back → front: `CosmicScene`, `FilmScene`, `EyeScene`. Each later scene sits _beneath_ the
scene that hands off to it, so transitions can reveal the next world through the previous one — the film's compositor
turns transparent where the being forms, over the living render already running beneath it.

With reduced motion, `CinematicStage` renders `CinematicStatic` instead: the same story as calm, static scenes.

## Build output

- `vendor` chunk (React, GSAP, Lenis) — changes rarely, stays cached across content deploys.
- `index` chunk — the site itself.
- `BlackHoleRenderer` chunk — imported as the event horizon approaches.
- `Soundscape` chunk — imported on the first click of the Sound toggle.
- The film's frames are static files in `public/assets/video/city/`, fetched after the first screen settles.
- `public/assets/references` (the original artwork) is excluded from `dist` by a small plugin in `vite.config.ts`; only
  the optimised images ship.

## Data flow

Components read content — services, use cases, technology — through `src/services/content.ts`, never from the
data files directly. Moving it to a CMS or API later only changes that module. (`data/workflow.ts` is diagram geometry
for the Transformation section, not content, and is imported by that section alone.)

## Adding a service

1. Add an entry to `src/data/services.ts` (id, index, title, lockup, descriptions, icon, visual.hand, capabilities,
   useCases, accent).
2. `visual.hand` (0–5) picks which cosmic hand carries it. With more than six services, extend
   `media.cosmicEntity.anchors.arms` and `CAPABILITY_STEPS`.
3. The capability HUD, the reduced-motion grid, _What we build_ and the footer's interest chips all update automatically.

## Adding a section

1. Create `src/components/sections/<name>/<Name>.tsx` + `<Name>.module.css`.
2. Give the root `<section id="…">` and an `aria-labelledby` heading. Use `SectionHeading` for the house lockup and
   `useReveal()` for entrance animation.
3. Add it to `App.tsx`, add a nav item in `src/config/site.ts`, and (optionally) a counter stop in
   `navigation/Header.tsx`.
4. For scroll-scrubbed motion use `ScrollTrigger` with `scrub: true` inside `useGSAP`; for sticky stages prefer CSS
   `position: sticky` over pinning.

## Design system

Tokens are in `src/styles/tokens.css`; typographic roles in `typography.css`:

- **Lockup** — heavy Inter Tight line + hairline Cormorant italic line (the signature of every section).
- **Kicker** — ultra-wide tracked light caps.
- **Meta** — small medium-weight corner text (header "Get in touch").
- **Data** — Geist Mono, only for machine read-outs.

Palette: void/navy/midnight surfaces, electric blue + ultraviolet light, restrained cyan and magenta, human amber used
sparingly. Motion: heavy, precise, no bounce (`src/lib/gsap.ts` custom eases).
