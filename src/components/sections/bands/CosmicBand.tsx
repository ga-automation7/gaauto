/**
 * THE COSMIC BAND — a large cosmic visual between chapters of the page.
 * A full-bleed field of stars forming a neural network (drawn live, original,
 * no stock imagery), turning very slowly, signals travelling its filaments;
 * the field settles closer as it enters and drifts with depth as you scroll.
 * Over it, one statement at the scale of the screen.
 */
import { useRef } from 'react';
import { getDeviceProfile } from '@/lib/device';
import { NeuralStars } from '@/lib/canvas/NeuralStars';
import { ScrollTrigger, useGSAP } from '@/lib/gsap';
import { useParallax } from '@/hooks/useParallax';
import { useReveal } from '@/hooks/useReveal';
import { useVisibleCanvas } from '@/hooks/useVisibleCanvas';
import styles from './CosmicBand.module.css';

export function CosmicBand() {
  const sectionRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const drift = useRef(0);
  const copyRef = useReveal<HTMLDivElement>('top 70%');
  useParallax(sectionRef);

  useVisibleCanvas(
    hostRef,
    (canvas) => {
      const device = getDeviceProfile();
      return new NeuralStars(canvas, {
        dpr: 1, // soft points: 1× is indistinguishable and far cheaper to upload
        count: device.isMobile ? 150 : device.tier === 'high' ? 320 : 260,
        signals: device.isMobile ? 6 : 12,
      });
    },
    (field, time, dt) => field.render(time, dt, drift.current),
    styles.canvas,
  );

  // Scroll progress through the band → depth drift (-1 … 1).
  useGSAP(
    () => {
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => (drift.current = self.progress * 2 - 1),
      });
      return () => st.kill();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className={styles.band} aria-labelledby="band-title">
      <div className={styles.frame} data-zoom>
        <div ref={hostRef} className={styles.field} />
      </div>
      <div className={styles.fog} data-speed="0.8" aria-hidden="true" />
      <div ref={copyRef} className={`container ${styles.copy}`}>
        <p className={styles.kicker} data-reveal="up">
          Stars <span>→</span> signals <span>→</span> systems
        </p>
        <h2 id="band-title" className={styles.statement}>
          <span className={styles.bold} data-reveal="lines">
            Intelligence,
          </span>
          <span className={styles.serif} data-reveal="lines">
            becoming a system.
          </span>
        </h2>
        <p className={`${styles.support} t-lead`} data-reveal="up">
          Scattered signals, from messages and records to everyday decisions, connected until they behave like a single
          mind. That connection is the work we do.
        </p>
      </div>
      <p className={styles.metaLeft} aria-hidden="true">
        Neural field · live render
      </p>
      <p className={styles.metaRight} aria-hidden="true">
        GA Automations
      </p>
    </section>
  );
}
