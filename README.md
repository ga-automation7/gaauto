# GA Automations — gaauto.in

A cinematic, scroll-directed website for **GA Automations** — an AI and automation company that builds AI automation,
AI agents & chatbots, custom-coded websites & web pages, workflow automation, CRM & intelligent operations and custom AI
solutions.

The page opens as one continuous film — a human eye, a dive through the iris into an AI city, a descent into the city's
core that becomes the heart of a six-armed cosmic intelligence whose hands carry the six capabilities — and then becomes
progressively more practical: the systems we build, use cases, work, technology, an interactive 3D city, and contact.

> We don't just build websites. We build intelligent systems.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

| Script                    | What it does                                                           |
| ------------------------- | ---------------------------------------------------------------------- |
| `npm run dev`             | Vite dev server with HMR                                               |
| `npm run build`           | Type-check (`tsc -b`) + production build to `dist/`                    |
| `npm run preview`         | Serve the production build (http://localhost:4173)                     |
| `npm run typecheck`       | TypeScript only                                                        |
| `npm run lint`            | ESLint (flat config, typescript-eslint, react-hooks)                   |
| `npm run check`           | typecheck + lint + build                                               |
| `npm run assets:images`   | Reference art → optimised AVIF/WebP, LQIPs, OG card, crops, grain      |
| `npm run assets:anchors`  | Detect real lights in the city plate → network overlay nodes           |
| `npm run assets:textures` | Generate tileable fog / nebula textures                                |
| `npm run assets:video`    | Encode a Seedance clip for the web (needs ffmpeg) — see docs/assets.md |

Requires Node ≥ 22.12.

### Useful URL flags

| Flag                              | Effect                                                          |
| --------------------------------- | --------------------------------------------------------------- |
| `?motion=full` / `?motion=reduce` | Force full or reduced motion (otherwise follows the OS setting) |
| `?tier=low\|medium\|high`         | Force a device-performance tier                                 |
| `?debug`                          | Exposes `window.__lenis`, `__eye`, `__cosmic` for inspection    |

The footer's **Motion** toggle stores the visitor's choice. Reduced motion shows the film as calm static scenes with a
"Play the full experience" button.

---

## Stack

- **React 19 + TypeScript + Vite 8** — client-rendered experience, fast builds on modest hardware.
- **GSAP 3.15** (ScrollTrigger, DrawSVG, MotionPath, CustomEase) — every timeline is scrubbed or triggered by scroll.
- **Lenis** — smooth scrolling, driven from the GSAP ticker (one rAF loop for everything).
- **Raw WebGL2** (no 3D library) — hero particles + iris tunnel, the living cosmic entity, and the interactive 3D city.
- **CSS Modules** + design tokens. Fonts self-hosted via Fontsource: **Inter Tight** (heavy grotesk), **Cormorant**
  (hairline italic), **Geist Mono** (machine read-outs only).
- **sharp** (dev) for the asset pipeline.

## Page map

| #   | Section                                              | Where                                          |
| --- | ---------------------------------------------------- | ---------------------------------------------- |
| 01  | Perception — the eye, the iris                       | `sections/cinematic/scenes/EyeScene.tsx`       |
| 02  | The city — drone shot, the core                      | `sections/cinematic/scenes/CityPlateScene.tsx` |
| 03  | Intelligence — six hands, six capabilities, identity | `sections/cinematic/scenes/CosmicScene.tsx`    |
| 04  | The transformation                                   | `sections/transformation/`                     |
| 05  | What we build                                        | `sections/build/`                              |
| 06  | Use cases                                            | `sections/usecases/`                           |
| 07  | Work & experiments                                   | `sections/work/`                               |
| 08  | Technology                                           | `sections/technology/`                         |
| 09  | About                                                | `sections/about/`                              |
| 10  | Playground — interactive 3D city                     | `sections/playground/`                         |
| 11  | Contact — Get in touch!                              | `layout/Footer.tsx`                            |

## Documentation

- [docs/architecture.md](docs/architecture.md) — structure, data flow, adding sections and services
- [docs/animations.md](docs/animations.md) — the film, the director, cameras, WebGL, performance rules
- [docs/assets.md](docs/assets.md) — images, videos, anchors, the Seedance drone-shot brief
- [docs/future-backend.md](docs/future-backend.md) — contact endpoint, CRM, WhatsApp, agents, security

## Content honesty

Use cases are presented as **what we can build**, not client results. In _Work_, only this website is marked **Live**;
the other entries are clearly labelled **Concept**. Replace them with real projects in `src/data/projects.ts` as they
ship.

## Configuration

Copy `.env.example` to `.env.local`. Only `VITE_*` variables reach the browser — never put secrets there.
The contact address defaults to **contact@gaauto.in**.
