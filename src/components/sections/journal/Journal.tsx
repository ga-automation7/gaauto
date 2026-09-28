/**
 * 03 — THE JOURNAL: intelligence, becoming a system.
 * Five layers every system we build moves through, each a small page from a
 * design journal with its own original visual — a compact bento (Intelligence
 * tall at its centre), a swipeable row on phones. Visuals animate only while
 * on screen, and rest while the page is actively scrolling.
 */
import { useEffect, useRef } from 'react';
import { getDeviceProfile } from '@/lib/device';
import { EditorialCard } from '@/components/ui/EditorialCard';
import { useParallax } from '@/hooks/useParallax';
import { useReveal } from '@/hooks/useReveal';
import {
  AutomationVisual,
  ExecutionVisual,
  IntelligenceVisual,
  OrchestrationVisual,
  PerceptionVisual,
} from './Visuals';
import styles from './Journal.module.css';

const LAYERS = [
  {
    id: 'perception',
    meta: ['Fig. 01', 'Input layer'] as [string, string],
    bold: 'Perception',
    serif: 'sees first',
    text: 'Every system begins by noticing. A message, a form, a document, a phone call. We teach software to read the signals your business already produces, in whatever shape they arrive.',
    trace: 'Signal → structure',
    Visual: PerceptionVisual,
    shape: 'landscape' as const,
  },
  {
    id: 'intelligence',
    meta: ['Fig. 02', 'Reasoning layer'] as [string, string],
    bold: 'Intelligence',
    serif: 'understands',
    text: 'Language models that grasp intent and context, grounded in your own data rather than guesses from the open internet.',
    trace: 'Context → decision',
    Visual: IntelligenceVisual,
    shape: 'tall' as const,
  },
  {
    id: 'orchestration',
    meta: ['Fig. 03', 'Coordination layer'] as [string, string],
    bold: 'Orchestration',
    serif: 'in concert',
    text: 'Agents, tools and people pass work to one another in the right order, and nothing gets lost along the way.',
    trace: 'Many parts → one flow',
    Visual: OrchestrationVisual,
    shape: 'landscape' as const,
  },
  {
    id: 'automation',
    meta: ['Fig. 04', 'Process layer'] as [string, string],
    bold: 'Automation',
    serif: 'never pauses',
    text: 'The repeatable parts of a process run quietly in the background, every time, at any hour, in exactly the same way.',
    trace: 'Steps → routine',
    Visual: AutomationVisual,
    shape: 'landscape' as const,
  },
  {
    id: 'execution',
    meta: ['Fig. 05', 'Outcome layer'] as [string, string],
    bold: 'Execution',
    serif: 'delivers',
    text: 'Inputs become outcomes: a qualified lead, a booked appointment, an updated record. Every one logged, measurable and accountable.',
    trace: 'Input → outcome',
    Visual: ExecutionVisual,
    shape: 'landscape' as const,
  },
];

export function Journal() {
  const sectionRef = useRef<HTMLElement>(null);
  const revealRef = useReveal<HTMLDivElement>('top 82%');
  useParallax(sectionRef);

  // Visuals live only while on screen (CSS animations + SMIL pulses pause off screen).
  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          el.toggleAttribute('data-live', e.isIntersecting);
          const svg = el.querySelector('svg');
          if (svg) {
            if (e.isIntersecting) svg.unpauseAnimations();
            else svg.pauseAnimations();
          }
        }
      },
      { rootMargin: '10% 0px' },
    );
    root.querySelectorAll('[data-layer]').forEach((el) => io.observe(el));

    // While the page is moving, its own motion carries the scene: let the
    // visuals rest (no repaints mid-scroll) and wake them as it settles.
    let settle = 0;
    let resting = false;
    const svgs = [...root.querySelectorAll<SVGSVGElement>('[data-layer] svg')];
    const onScroll = () => {
      if (!resting) {
        resting = true;
        root.setAttribute('data-scrolling', '');
        svgs.forEach((s) => s.pauseAnimations());
      }
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        resting = false;
        root.removeAttribute('data-scrolling');
        svgs.forEach((s) => {
          if (s.closest('[data-live]')) s.unpauseAnimations();
        });
      }, 180);
    };
    if (!getDeviceProfile().reducedMotion) window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(settle);
    };
  }, []);

  return (
    <section ref={sectionRef} id="journal" className={styles.section} aria-labelledby="journal-title">
      <div className={styles.nebula} data-speed="0.7" aria-hidden="true" />
      <div ref={revealRef} className={`container ${styles.inner}`}>
        <header className={styles.heading}>
          <p className={styles.kicker} data-reveal="up">
            <span className="t-num">03</span>
            <span className={styles.rule} data-reveal="line" />
            <span>The system</span>
          </p>
          <h2 id="journal-title" className={styles.lockup}>
            <span className={styles.bold} data-reveal="lines">
              From signal
            </span>
            <span className={styles.serif} data-reveal="lines">
              to system
            </span>
          </h2>
          <p className={`${styles.lead} t-lead`} data-reveal="up">
            Every intelligent system we build passes through five layers. Here is how raw input becomes finished, dependable work.
          </p>
        </header>

        <div className={styles.grid}>
        {LAYERS.map(({ id, Visual, ...card }) => (
          <div key={id} className={`${styles.slot} ${styles[id]}`} data-layer>
            <EditorialCard {...card} compact visual={<Visual />} />
          </div>
        ))}
        </div>
      </div>
    </section>
  );
}
