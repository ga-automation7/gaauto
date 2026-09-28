/**
 * 02 — MANIFESTO
 * Straight out of the film, the page speaks: the philosophy set at the scale
 * of the viewport (typography as the visual), emerging line by line. Then the
 * statement lights up word by word as you read, the equation of what we
 * combine, and the three principles — set asymmetrically, never a grid of three.
 */
import { useRef } from 'react';
import { useParallax } from '@/hooks/useParallax';
import { useReveal } from '@/hooks/useReveal';
import { gsap, useGSAP } from '@/lib/gsap';
import styles from './Manifesto.module.css';

const STATEMENT =
  'GA Automations is a young, ambitious technology company. We combine AI, automation, custom-coded websites, software and integrations into intelligent systems — so the repetitive work disappears, and your team spends its time on what only people can do.';

const PARTS = ['AI', 'Automation', 'Websites', 'Software', 'Integrations'];

const PRINCIPLES = [
  {
    title: 'Systems, not pages',
    text: 'We design how work flows through your business, then build the pieces that make it run.',
  },
  {
    title: 'Automation with judgement',
    text: 'People stay in the loop where it matters. Everything else just happens.',
  },
  {
    title: 'Built to be yours',
    text: 'Clear code, documented workflows and tools you own — no black boxes.',
  },
];

export function Manifesto() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const revealRef = useReveal<HTMLDivElement>('top 78%');
  const restRef = useReveal<HTMLDivElement>();
  useParallax(sectionRef);

  // The statement lights up word by word, scrubbed by reading pace.
  useGSAP(
    () => {
      if (document.documentElement.dataset.motion === 'reduced') return;
      const words = gsap.utils.toArray<HTMLElement>('[data-word]', textRef.current);
      gsap.fromTo(
        words,
        { opacity: 0.14 },
        {
          opacity: 1,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: { trigger: textRef.current, start: 'top 82%', end: 'bottom 48%', scrub: true },
        },
      );
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="about" className={styles.section} aria-labelledby="manifesto-title">
      <div className={styles.glow} data-speed="0.75" aria-hidden="true" />
      <div className={`container ${styles.inner}`}>
        <div ref={revealRef}>
          <p className={styles.kicker} data-reveal="up">
            <span className="t-num">02</span>
            <span className={styles.rule} data-reveal="line" />
            <span>Manifesto</span>
          </p>
          <h2 id="manifesto-title" className={styles.title}>
            <span className={styles.lead} data-reveal="lines">
              What we believe
            </span>
            <span className={styles.giant} data-reveal="lines">
              Repetitive work is a <em className={styles.serif}>design flaw.</em>
            </span>
          </h2>
        </div>

        <div ref={restRef} className={styles.body}>
          <p ref={textRef} className={styles.statement}>
            {STATEMENT.split(' ').map((w, i) => (
              <span key={i} data-word className={/intelligent|systems/.test(w) ? styles.accentWord : undefined}>
                {w}{' '}
              </span>
            ))}
          </p>

          <div
            className={styles.equation}
            aria-label="AI plus automation plus websites plus software plus integrations equals intelligent systems"
          >
            {PARTS.map((p, i) => (
              <span key={p} className={styles.term} data-reveal="up">
                <span className={`${styles.termIndex} t-num`}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.termText}>{p}</span>
              </span>
            ))}
            <span className={styles.result} data-reveal="up">
              <span className={styles.resultBold}>Intelligent</span>{' '}
              <span className={styles.resultSerif}>systems</span>
            </span>
          </div>

          <ol className={styles.principles}>
            {PRINCIPLES.map((p, i) => (
              <li key={p.title} className={styles.principle} data-reveal="up">
                <span className={`${styles.pIndex} t-num`}>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className={styles.pTitle}>{p.title}</h3>
                  <p className={styles.pText}>{p.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
