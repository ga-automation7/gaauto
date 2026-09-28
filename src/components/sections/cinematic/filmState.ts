import { useSyncExternalStore } from 'react';
import { useStage } from './StageContext';

/**
 * How the film's transformation is rendered on this device right now:
 *  - gl     the WebGL compositor: footage, city → energy, the being forming out of it
 *  - plain  no compositor (no WebGL2, or it failed): the footage is drawn on a 2D
 *           canvas and the transformation is carried by layered atmosphere instead
 */
export type FilmMode = 'gl' | 'plain';

export interface FilmStore {
  mode: () => FilmMode;
  setMode: (mode: FilmMode) => void;
  subscribe: (fn: () => void) => () => void;
}

export function createFilmStore(initial: FilmMode): FilmStore {
  let mode = initial;
  const listeners = new Set<() => void>();
  return {
    mode: () => mode,
    setMode(next) {
      if (next === mode) return;
      mode = next;
      listeners.forEach((fn) => fn());
    },
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
