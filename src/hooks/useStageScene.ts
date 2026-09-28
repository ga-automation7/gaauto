import { useLayoutEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import type { StageSceneConfig } from '@/lib/director';
import { useStage, type StageContextValue } from '@/components/sections/cinematic/StageContext';

export type SceneBuilder = (
  tl: gsap.core.Timeline,
  stage: StageContextValue,
) => Omit<StageSceneConfig, 'id' | 'timeline'>;

/**
 * Register a cinematic scene with the director.
 *
 * The builder receives a paused timeline whose time axis is the absolute stage
 * position (vh). Place tweens with `chapters.at(...)` / `chapters.frac(...)`.
 * Everything created inside is scoped to a gsap.context and reverted on unmount.
 */
export function useStageScene(id: string, build: SceneBuilder, deps: readonly unknown[] = []): void {
  const stage = useStage();
  const buildRef = useRef(build);
  useLayoutEffect(() => {
    buildRef.current = build;
  });

  useLayoutEffect(() => {
    let unregister: (() => void) | undefined;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      const config = buildRef.current(tl, stage);
      // Ensure the timeline spans the whole film so time() never clips early.
      tl.set({}, {}, stage.chapters.total);
      unregister = stage.director.register({ id, timeline: tl, ...config });
    });
    return () => {
      unregister?.();
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, id, ...deps]);
}
