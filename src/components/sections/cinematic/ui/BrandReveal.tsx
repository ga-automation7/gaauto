/**
 * GA AUTOMATIONS — the answer to "what will you build with it?", emerging from
 * the energy as the being settles.
 *
 * The wordmark condenses out of light: letters rise from the centre outward,
 * soft and wide, and lock together sharp; a glow breathes behind them. Then,
 * one by one: the promise, the line, the four disciplines. Everything clears
 * again as the camera pulls back to show the six hands.
 */
import { useRef } from 'react';
import { site } from '@/config/site';
import { useStageScene } from '@/hooks/useStageScene';
import styles from './BrandReveal.module.css';

const WORDS = site.wordmark.split(' ');
const DISCIPLINES = ['AI Automation', 'AI Systems', 'Intelligent Web', 'Workflow Engineering'];

export function BrandReveal() {
  const rootRef = useRef<HTMLDivElement>(null);

  useStageScene('brand-reveal', (tl, { chapters: ch, device }) => {
    const root = rootRef.current!;
    const R = ch.spans.reveal;
    const N = ch.spans.intelligence;
    const q = (sel: string) => [...root.querySelectorAll<HTMLElement>(sel)];
    const letters = q('[data-letter]');
    const mark = root.querySelector<HTMLElement>('[data-mark]')!;
    const glow = root.querySelector<HTMLElement>('[data-glow]')!;
    const blur = device.isMobile ? 10 : 18;
    const start = R.start - 0.18;
    const leave = N.start + N.length * 0.28;

    tl.set(root, { autoAlpha: 0 }, 0);
    tl.set(root, { autoAlpha: 1 }, start - 0.001);
    tl.set(root, { autoAlpha: 0 }, leave + 0.36);

    // The light it condenses out of.
    tl.fromTo(
      glow,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, ease: 'power2.out', duration: 0.5 },
      start,
    );
    tl.to(glow, { opacity: 0.9, scale: 1.04, ease: 'sine.inOut', duration: 0.6 }, start + 0.5);

    // Letters rise out of the energy from the centre outward and lock together.
    tl.fromTo(
      mark,
      { letterSpacing: '0.24em', scale: 0.94 },
      { letterSpacing: '-0.035em', scale: 1, ease: 'expo.out', duration: 0.7 },
      start,
    );
    tl.fromTo(
      letters,
      { yPercent: 70, opacity: 0, filter: `blur(${blur}px)` },
      {
        yPercent: 0,
        opacity: 1,
        filter: 'blur(0px)',
        ease: 'expo.out',
        duration: 0.5,
        stagger: { each: 0.028, from: 'center' },
      },
      start,
    );
    tl.set(letters, { filter: 'none' }, start + 0.5 + 0.028 * letters.length);

    // The promise, the line, the disciplines.
    tl.fromTo(
      q('[data-tag]'),
      { yPercent: 110, opacity: 0 },
      { yPercent: 0, opacity: 1, ease: 'expo.out', duration: 0.4, stagger: 0.1 },
      R.start + 0.3,
    );
    tl.fromTo(
      q('[data-sub]'),
      { y: 16, opacity: 0, filter: 'blur(6px)' },
      { y: 0, opacity: 1, filter: 'blur(0px)', ease: 'power3.out', duration: 0.38 },
      R.start + 0.52,
    );
    tl.fromTo(
      q('[data-discipline]'),
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, ease: 'power3.out', duration: 0.3, stagger: 0.07 },
      R.start + 0.7,
    );

    // Clears upward as the camera pulls back to the six hands.
    tl.to(
      root.querySelector('[data-block]'),
      { y: -40, opacity: 0, filter: 'blur(8px)', ease: 'power2.in', duration: 0.36 },
      leave,
    );
    tl.to(glow, { opacity: 0, duration: 0.36 }, leave);

    return { start: start - 0.05, end: leave + 0.42 };
  });

  return (
    <div ref={rootRef} className={styles.reveal}>
      <div data-block className={styles.block}>
        <span data-glow className={styles.glow} aria-hidden="true" />
        <p data-mark className={styles.mark} aria-label={site.wordmark}>
          {WORDS.map((word, w) => (
            <span key={word} className={styles.word} aria-hidden="true">
              {[...word].map((ch, i) => (
                <span key={i} data-letter className={`${styles.letter} ${w === 0 ? styles.initials : ''}`}>
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </p>
        <p className={styles.tagline}>
          <span className={styles.mask}>
            <span data-tag className={styles.tag}>
              Intelligent systems.
            </span>
          </span>
          <span className={styles.mask}>
            <span data-tag className={`${styles.tag} ${styles.tagAccent}`}>
              Built for what&rsquo;s next.
            </span>
          </span>
        </p>
        <p data-sub className={styles.sub}>
          Intelligence, wired into your business.
        </p>
        <ul className={styles.disciplines} aria-label="What we do">
          {DISCIPLINES.map((d) => (
            <li key={d} data-discipline>
              {d}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
