# GA Automations — gaauto.in

A cinematic, scroll-directed website for **GA Automations** — an AI and automation company that builds AI automation,
AI agents & chatbots, custom-coded websites & web pages, workflow automation, CRM & intelligent operations and custom AI
solutions.

The page opens as one continuous film: a human eye; a dive through the iris into a low drone flight down a city avenue
(the real footage, scrubbed by scroll) while the words arrive — _THE WORLD IS MOVING. FASTER. EVERY DAY. AI ISN'T COMING.
IT'S ALREADY HERE._; the city dissolves into energy (_what will you build with it?_), the energy forms a six-armed cosmic
intelligence and **GA AUTOMATIONS** emerges from it; the camera visits the six hands — the six capabilities — and returns
to the face for the final identity. Then the page becomes progressively more practical: the manifesto, the system, the
transformation, technology, use cases, what we build, AURA, the event horizon and contact.

> We don't just build websites. We build intelligent systems.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

| Script                    | What it does                                                                 |
| ------------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`             | Vite dev server with HMR                                                     |
| `npm run build`           | Type-check (`tsc -b`) + production build to `dist/`                          |
| `npm run preview`         | Serve the production build (http://localhost:4173)                           |
| `npm run typecheck`       | TypeScript only                                                              |
| `npm run lint`            | ESLint (flat config, typescript-eslint, react-hooks)                         |
| `npm run check`           | typecheck + lint + build                                                     |
| `npm run assets:frames`   | Master clip → scroll-scrubbed frame sequence + posters (uses your browser)   |
| `npm run assets:images`   | Reference art → optimised AVIF/WebP, LQIPs, enhanced cosmic plate + mask, OG |
| `npm run assets:textures` | Generate tileable fog / nebula textures                                      |
| `npm run assets:video`    | Encode an ambient loop for the web (needs ffmpeg) — see docs/assets.md       |

Requires Node ≥ 22.12. `assets:frames` needs a Chromium-based browser (Edge, Chrome or Brave) — nothing else.

### Useful URL flags

| Flag                              | Effect                                                                  |
| --------------------------------- | ----------------------------------------------------------------------- |
| `?motion=full` / `?motion=reduce` | Force full or reduced motion (otherwise follows the OS setting)         |
| `?tier=low\|medium\|high`         | Force a device-performance tier                                         |
| `?debug`                          | Exposes `window.__lenis`, `__eye`, `__cosmic`, `__sound` for inspection |

The footer's **Motion** toggle stores the visitor's choice. Reduced motion shows the film as calm static scenes with a
"Play the full experience" button. The **Sound** toggle (bottom-left; header centre on phones) plays the film's score —
off until the visitor turns it on.

---

## Stack

- **React 19 + TypeScript + Vite 8** — client-rendered experience, fast builds on modest hardware.
- **GSAP 3.15** (ScrollTrigger, SplitText, DrawSVG, MotionPath, CustomEase) — every timeline is scrubbed or triggered by
  scroll.
- **Lenis** — smooth scrolling, driven from the GSAP ticker (one rAF loop for everything).
- **Raw WebGL2** (no 3D library) — hero particles + iris tunnel, the film compositor (footage + transformation), the
  living cosmic entity and the ray-traced black hole.
- **Web Audio** — the score is synthesised live (no audio files).
- **CSS Modules** + design tokens. Fonts self-hosted via Fontsource: **Inter Tight** (heavy grotesk), **Cormorant**
  (hairline italic), **Geist Mono** (machine read-outs only).
- **sharp** (dev) for the asset pipeline.

## Page map

| #   | Section                                               | Where                                                         |
| --- | ----------------------------------------------------- | ------------------------------------------------------------- |
| 01  | Perception — the eye, the iris                        | `sections/cinematic/scenes/EyeScene.tsx`                      |
| 02  | The film — drone flight, the words, city → energy     | `sections/cinematic/scenes/FilmScene.tsx`, `ui/FilmTitles`    |
| 03  | The being — emergence, GA reveal, six hands, identity | `sections/cinematic/scenes/CosmicScene.tsx`, `ui/BrandReveal` |
| —   | Manifesto                                             | `sections/manifesto/`                                         |
| —   | The system (editorial bento)                          | `sections/journal/`                                           |
| 04  | The transformation — Intelligence at work             | `sections/transformation/`                                    |
| —   | Technology · Use cases · What we build                | `sections/technology/`, `usecases/`, `build/`                 |
| 08  | AURA — in development                                 | `sections/aura/`                                              |
| 09  | Event horizon — the black hole scrollymation          | `sections/space/`                                             |
| —   | Contact — Get in touch!                               | `layout/Footer.tsx`                                           |

## Documentation

- [docs/architecture.md](docs/architecture.md) — structure, data flow, adding sections and services
- [docs/animations.md](docs/animations.md) — the film, the director, cameras, WebGL, sound, performance rules
- [docs/assets.md](docs/assets.md) — the frame sequence, images, textures, replacing the film
- [docs/future-backend.md](docs/future-backend.md) — contact endpoint, CRM, WhatsApp, agents, security

## Content honesty

Use cases are presented as **what we can build**, not client results. AURA is labelled **in development** and as a
source of legal _information_, not legal advice.

## Configuration

Copy `.env.example` to `.env.local`. Only `VITE_*` variables reach the browser — never put secrets there.
The contact address defaults to **contact@gaauto.in**.

## Deploying

`npm run build` writes a static site to `dist/` — host it on any static host/CDN (Netlify, Vercel, Cloudflare Pages,
S3 + CloudFront…). Recommended headers: `Cache-Control: public, max-age=31536000, immutable` for the hashed build files
(`/assets/*.js`, `/assets/*.css`, fonts); a shorter cache such as `max-age=604800` for media under `/assets/images/**` and
`/assets/video/**` (their names don't change when you replace them); `no-cache` for `index.html`.
