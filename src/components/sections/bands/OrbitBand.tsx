/**
 * SIX DISCIPLINES — a full-width cinematic transition into the capabilities.
 * One luminous core and six orbits in perspective, each node carrying a
 * capability's colour, unfolding from the core as the band arrives and turning
 * slowly while it is on screen. Original, drawn live, no imagery.
 */
import { useRef } from 'react';
import { OrbitSystem } from '@/lib/canvas/OrbitSystem';
import { getDeviceProfile } from '@/lib/device';
import { ScrollTrigger, useGSAP } from '@/lib/gsap';
import { content } from '@/services/content';
import { useParallax } from '@/hooks/useParallax';
import { useReveal } from '@/hooks/useReveal';
import { useVisibleCanvas } from '@/hooks/useVisibleCanvas';
import styles from './OrbitBand.module.css';

const services = content.services();

export function OrbitBand() {
  const sectionRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const open = useRef(getDeviceProfile().reducedMotion ? 1 : 0);
  const copyRef = useReveal<HTMLDivElement>('top 62%');
  useParallax(sectionRef);

  useVisibleCanvas(
    hostRef,
    (canvas) =>
      new OrbitSystem(canvas, {
        dpr: Math.min(getDeviceProfile().dpr, 1.25),
        nodes: services.map((s) => ({ color: s.accent })),
      }),
    (system, time) => system.render(time, open.current),
    styles.canvas,
  );

  // The system unfolds from its core as the band scrolls into view.
  useGSAP(
    () => {
      if (getDeviceProfile().reducedMotion) return;
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 85%',
        end: 'top 15%',
        scrub: true,
        onUpdate: (self) => (open.current = self.progress),
      });
      return () => st.kill();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className={styles.band} aria-labelledby="orbit-title">
      <div ref={hostRef} className={styles.field} data-speed="0.85" aria-hidden="true" />
      <div ref={copyRef} className={`container ${styles.copy}`}>
        <p className={styles.kicker} data-reveal="up">
          Six disciplines <span>·</span> one core
        </p>
        <h2 id="orbit-title" className={styles.statement}>
          <span className={styles.bold} data-reveal="lines">
            Everything orbits
          </span>
          <span className={styles.serif} data-reveal="lines">
            one intelligence.
          </span>
        </h2>
        <p className={`${styles.support} t-lead`} data-reveal="up">
          Six capabilities, each complete on its own, and at their strongest when they turn around the same core.
        </p>
      </div>
    </section>
  );
}
