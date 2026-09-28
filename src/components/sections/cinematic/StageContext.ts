import { createContext, useContext } from 'react';
import type { SceneCamera } from '@/lib/camera';
import type { ChapterMap } from '@/config/cinematic';
import type { DeviceProfile } from '@/lib/device';
import type { StageDirector } from '@/lib/director';
import type { SizeStore } from '@/lib/sizeStore';
import type { FilmStore } from './filmState';

/** Cross-scene handles (cameras etc.) so effects can follow one scene into the next. */
export interface StageShared {
  cameras: Partial<Record<'eye' | 'cosmic', SceneCamera>>;
}

export interface StageContextValue {
  director: StageDirector;
  chapters: ChapterMap;
  device: DeviceProfile;
  /** Size of the sticky stage viewport (CSS px). */
  size: SizeStore;
  shared: StageShared;
  /** The film's mode (still / video / baked) and heading, shared by film, light bridge and entity. */
  film: FilmStore;
}

export const StageContext = createContext<StageContextValue | null>(null);

export function useStage(): StageContextValue {
  const ctx = useContext(StageContext);
  if (!ctx) throw new Error('useStage must be used inside <CinematicStage>');
  return ctx;
}
