/**
 * Development aid, enabled with the `?debug` URL flag: exposes live handles in
 * the console — `window.__lenis` (scroll), `window.__eye` and
 * `window.__cosmic` (scene cameras / effect state) — for inspecting framing.
 */
const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

export const debug = {
  enabled: params?.has('debug') ?? false,
};
