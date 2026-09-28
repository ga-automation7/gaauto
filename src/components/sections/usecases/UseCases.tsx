/**
 * 06 — WHAT WE CAN BUILD
 * Representative systems on a horizontal track. Desktop: the section holds
 * while vertical scroll moves the track. Touch: native swipe with snap points.
 * Framed as capabilities — no client results are claimed.
 */
import { useRef, useState } from 'react';
import { SectionHeading } from '@/components/common/SectionHeading';
import { useReveal } from '@/hooks/useReveal';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { content } from '@/services/content';
import styles from './UseCases.module.css';

const cases = content.useCases();
const CATEGORY_ACCENT: Record<string, string> = {
  Sales: '#5b8cff',
  Support: '#8b6bff',
  Operations: '#a58bff',
  Data: '#62e0cf',
  Web: '#6fd8ff',
};

export function UseCases() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const headRef = useReveal<HTMLDivElement>();
  const [current, setCurrent] = useState(1);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 900px) and (pointer: fine)', () => {
        if (document.documentElement.dataset.motion === 'reduced') return;
        const section = sectionRef.current!;
        const track = trackRef.current!;
        const viewport = viewportRef.current!;
        const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
        const setHeight = () => {
          section.style.height = `${window.innerHeight + distance()}px`;
        };
        setHeight();
        const tween = gsap.to(track, { x: () => -distance(), ease: 'none' });
        const st = ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: () => `+=${distance()}`,
          scrub: true,
          animation: tween,
          invalidateOnRefresh: true,
          onRefreshInit: setHeight,
          onUpdate: (self) => setCurrent(Math.min(cases.length, 1 + Math.round(self.progress * (cases.length - 1)))),
        });
        return () => {
          st.kill();
          tween.kill();
          section.style.height = '';
        };
      });
      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="use-cases" className={styles.section} aria-labelledby="use-cases-title">
      <div className={styles.sticky}>
        <div ref={headRef} className={`container ${styles.head}`}>
          <SectionHeading
            id="use-cases-title"
            index="06"
            kicker="Use cases"
            bold="What we"
            serif="can build"
            lead="Real systems for real work. Each one runs perfectly well on its own, and each grows more capable once it is connected to the rest."
          />
          <p className={`${styles.counter} t-num`} aria-hidden="true">
            <span>{String(current).padStart(2, '0')}</span> / {String(cases.length).padStart(2, '0')}
          </p>
        </div>

        <div ref={viewportRef} className={styles.viewport}>
          <div ref={trackRef} className={styles.track}>
            {cases.map((c, i) => (
              <article
                key={c.id}
                className={styles.card}
                style={{ ['--accent' as string]: CATEGORY_ACCENT[c.category] ?? '#8b9dff' }}
                aria-labelledby={`uc-${c.id}`}
              >
                <div className={styles.cardTop}>
                  <span className={styles.category}>{c.category}</span>
                  <span className="t-num">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 id={`uc-${c.id}`} className={styles.cardTitle}>
                  {c.title}
                </h3>
                <p className={styles.summary}>{c.summary}</p>
                <ol className={styles.flow} aria-label="How it works">
                  {c.flow.map((step, s) => (
                    <li key={step}>
                      <span className={`${styles.step} t-num`}>{s + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <ul className={styles.stack} aria-label="Typical stack">
                  {c.stack.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
