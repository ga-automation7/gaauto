import { useSyncExternalStore } from 'react';
import { media } from '@/config/media';
import { useStage } from './StageContext';

/**
 * How the film is shown on this device right now:
 *  - still  the city still with a slow forward push; the site composites the transition
 *  - video  the footage, scrubbed by scroll; the site composites the transition
 *  - baked  the footage carries the transition as well; the site only hands over to the entity
 */
export type FilmMode = 'still' | 'video' | 'baked';

export interface FilmStore {
  mode: () => FilmMode;
  /** The footage is (or is no longer) ready to scrub. */
  setFootage: (ready: boolean) => void;
  /** Where the flight is heading on screen (CSS px) — the transition's light builds here. */
  heading: { x: number; y: number };
  subscribe: (fn: () => void) => () => void;
}

export function createFilmStore(): FilmStore {
  let mode: FilmMode = 'still';
  const listeners = new Set<() => void>();
  return {
    mode: () => mode,
    setFootage(ready) {
      const baked = (media.film.footage?.morph ?? 0) > 0;
      const next: FilmMode = !ready ? 'still' : baked ? 'baked' : 'video';
      if (next === mode) return;
      mode = next;
      listeners.forEach((fn) => fn());
    },
    heading: { x: 0, y: 0 },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

/** The film's current mode; scenes rebuild their choreography when it changes. */
export function useFilmMode(): FilmMode {
  const { film } = useStage();
  return useSyncExternalStore(film.subscribe, film.mode, film.mode);
}
