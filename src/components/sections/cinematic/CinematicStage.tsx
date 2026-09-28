/**
 * CinematicStage — sections 01–03 as ONE continuous film.
 *
 *   <section style="height: (film length + 1) viewports">   ← scroll track
 *     chapter anchors (#chapter-perception, #chapter-city, …)
 *     <div sticky 100lvh>                                    ← the screen
 *        scenes (eye, film, cosmic) + stage UI
 *
 * A single ScrollTrigger converts scroll into a stage position (in viewport
 * heights) and hands it to the StageDirector, which drives only the scenes in
 * range. `position: sticky` (not pinning) keeps the stage on the compositor and
 * plays well with Lenis.
 */
import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { buildChapterMap } from '@/config/cinematic';
import { getDeviceProfile } from '@/lib/device';
import { StageDirector } from '@/lib/director';
import { ScrollTrigger } from '@/lib/gsap';
import { createSizeStore } from '@/lib/sizeStore';
import { CinematicStatic } from './CinematicStatic';
import { createFilmStore } from './filmState';
import { StageContext, type StageContextValue } from './StageContext';
import styles from './CinematicStage.module.css';

export function CinematicStage({ children }: { children: ReactNode }) {
  // Reduced motion: the same story as calm static scenes (no zooms, no WebGL).
  return getDeviceProfile().reducedMotion ? <CinematicStatic /> : <CinematicFilm>{children}</CinematicFilm>;
}

function CinematicFilm({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);

  const value = useMemo<StageContextValue>(() => {
    const device = getDeviceProfile();
    const chapters = buildChapterMap(device.isMobile);
    const director = new StageDirector();
    director.total = chapters.total;
    return {
      device,
      chapters,
      director,
      size: createSizeStore(),
      shared: { cameras: {}, filmCovers: false },
      film: createFilmStore(device.webgl2 ? 'gl' : 'plain'),
    };
  }, []);

  // Stage viewport size → size store (scenes/cameras/canvases subscribe).
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => value.size.set(el.clientWidth, el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [value]);

  // Scroll → stage position.
  useLayoutEffect(() => {
    const track = trackRef.current;
    const probe = probeRef.current;
    if (!track || !probe) return;
    const { chapters, director } = value;
    // One stage unit = one small-viewport height (stable while mobile toolbars move).
    const unit = () => probe.offsetHeight || window.innerHeight;
    const st = ScrollTrigger.create({
      trigger: track,
      start: 'top top',
      end: () => `+=${chapters.total * unit()}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => director.update(self.progress * chapters.total),
      onRefresh: (self) => {
        director.update(self.progress * chapters.total);
        director.refresh();
      },
    });
    director.update(st.progress * chapters.total);
    return () => st.kill();
  }, [value]);

  const { chapters } = value;

  return (
    <StageContext.Provider value={value}>
      <section
        ref={trackRef}
        id="film"
        className={styles.track}
        style={{ ['--film-length' as string]: chapters.total }}
        aria-label="GA Automations — an opening film: from a human eye, a drone flight through a city of light that dissolves into energy and becomes a six-armed intelligence representing our six capabilities."
      >
        <div ref={probeRef} className={styles.probe} aria-hidden="true" />
        {chapters.list.map((c) => (
          <div
            key={c.id}
            id={`chapter-${c.id}`}
            className={styles.anchor}
            style={{ ['--at' as string]: c.start + (c.id === 'perception' ? 0 : 0.02) }}
            aria-hidden="true"
          />
        ))}
        <div ref={viewportRef} className={styles.viewport}>
          {children}
        </div>
      </section>
    </StageContext.Provider>
  );
}
