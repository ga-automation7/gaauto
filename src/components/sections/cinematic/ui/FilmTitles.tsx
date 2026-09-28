/**
 * The words over the flight — one thought at a time, scrubbed by scroll.
 *
 *   THE WORLD / IS MOVING.  →  FASTER.  →  EVERY DAY.  →  AI ISN'T / COMING.
 *   →  IT'S / ALREADY / HERE.  →  THE QUESTION IS — WHAT WILL YOU / BUILD WITH IT?
 *
 * Editorial campaign type: huge, tight, white, one lavender accent at a time.
 * Each line rises out of a mask and comes into focus (blur → sharp) with a
 * slight vertical drift while it holds; it leaves upward, softening again.
 * Positions are fractions of the signature sequence (config/cinematic.ts).
 */
import { useRef } from 'react';
import { useStageScene } from '@/hooks/useStageScene';
import styles from './FilmTitles.module.css';

interface Line {
  text: string;
  accent?: boolean;
}

interface Beat {
  id: string;
  /** Fractions of the sequence. */
  from: number;
  to: number;
  place: 'left' | 'center' | 'right';
  size: 'xl' | 'mega' | 'l';
  kicker?: string;
  lines: Line[];
  /** How the words arrive. */
  motion?: 'rise' | 'rush';
}

const BEATS: Beat[] = [
  {
    id: 'world',
    from: 0.15,
    to: 0.3,
    place: 'left',
    size: 'xl',
    lines: [{ text: 'THE WORLD' }, { text: 'IS MOVING.', accent: true }],
  },
  {
    id: 'faster',
    from: 0.3,
    to: 0.38,
    place: 'center',
    size: 'mega',
    motion: 'rush',
    lines: [{ text: 'FASTER.' }],
  },
  {
    id: 'every',
    from: 0.38,
    to: 0.45,
    place: 'right',
    size: 'xl',
    lines: [{ text: 'EVERY' }, { text: 'DAY.', accent: true }],
  },
  {
    id: 'coming',
    from: 0.45,
    to: 0.525,
    place: 'left',
    size: 'xl',
    lines: [{ text: "AI ISN'T" }, { text: 'COMING.' }],
  },
  {
    id: 'here',
    from: 0.525,
    to: 0.6,
    place: 'right',
    size: 'xl',
    lines: [{ text: "IT'S" }, { text: 'ALREADY' }, { text: 'HERE.', accent: true }],
  },
  {
    id: 'question',
    from: 0.605,
    to: 0.745,
    place: 'center',
    size: 'l',
    kicker: 'The question is',
    lines: [{ text: 'WHAT WILL YOU' }, { text: 'BUILD WITH IT?', accent: true }],
  },
];

export function FilmTitles() {
  const rootRef = useRef<HTMLDivElement>(null);

  useStageScene('film-titles', (tl, { chapters: ch, device }) => {
    const root = rootRef.current!;
    const blur = device.isMobile ? 8 : 14;
    const first = ch.seq(BEATS[0]!.from);
    const last = ch.seq(BEATS[BEATS.length - 1]!.to);

    for (const beat of BEATS) {
      const el = root.querySelector<HTMLElement>(`[data-beat="${beat.id}"]`)!;
      const words = [...el.querySelectorAll<HTMLElement>('[data-line]')];
      const kicker = el.querySelector<HTMLElement>('[data-kicker]');
      const scrim = el.querySelector<HTMLElement>('[data-scrim]');
      const from = ch.seq(beat.from);
      const to = ch.seq(beat.to);
      const L = to - from;
      const enter = L * 0.26;
      const exit = L * 0.2;

      tl.set(el, { autoAlpha: 0 }, 0);
      tl.set(el, { autoAlpha: 1 }, from - 0.001);
      tl.set(el, { autoAlpha: 0 }, to + 0.001);
      // The whole group drifts gently upward while it holds.
      tl.fromTo(el, { y: 26 }, { y: -26, ease: 'none', duration: L }, from);
      if (scrim) {
        tl.fromTo(scrim, { opacity: 0 }, { opacity: 1, ease: 'sine.out', duration: enter }, from);
        tl.to(scrim, { opacity: 0, ease: 'sine.in', duration: exit }, to - exit);
      }
      if (kicker) {
        tl.fromTo(
          kicker,
          { autoAlpha: 0, y: 14, letterSpacing: '0.9em' },
          { autoAlpha: 1, y: 0, letterSpacing: '0.5em', ease: 'power2.out', duration: enter * 0.9 },
          from,
        );
        tl.to(kicker, { autoAlpha: 0, y: -10, ease: 'power1.in', duration: exit }, to - exit);
      }

      words.forEach((w, i) => {
        const at = from + (kicker ? enter * 0.35 : 0) + i * L * 0.07;
        if (beat.motion === 'rush') {
          // FASTER. arrives at speed: stretched, blurred, sliding in — then locks sharp.
          tl.fromTo(
            w,
            { xPercent: 22, scaleX: 1.5, filter: `blur(${blur * 1.6}px)`, opacity: 0 },
            {
              xPercent: 0,
              scaleX: 1,
              filter: 'blur(0px)',
              opacity: 1,
              ease: 'expo.out',
              duration: enter * 1.1,
            },
            at,
          );
          tl.to(
            w,
            {
              xPercent: -26,
              scaleX: 1.45,
              filter: `blur(${blur * 1.4}px)`,
              opacity: 0,
              ease: 'power2.in',
              duration: exit,
            },
            to - exit,
          );
        } else {
          tl.fromTo(
            w,
            { yPercent: 104, filter: `blur(${blur}px)`, opacity: 0 },
            { yPercent: 0, filter: 'blur(0px)', opacity: 1, ease: 'expo.out', duration: enter },
            at,
          );
          tl.to(
            w,
            { yPercent: -34, filter: `blur(${blur * 0.7}px)`, opacity: 0, ease: 'power2.in', duration: exit },
            to - exit + i * 0.02,
          );
        }
      });
    }
    return { start: first - 0.05, end: last + 0.05 };
  });

  return (
    <div ref={rootRef} className={styles.titles}>
      {BEATS.map((beat) => (
        <div
          key={beat.id}
          data-beat={beat.id}
          className={`${styles.beat} ${styles[beat.place]} ${styles[beat.size]}`}
        >
          <span className={styles.scrim} data-scrim aria-hidden="true" />
          {beat.kicker && (
            <p className={styles.kicker} data-kicker>
              {beat.kicker}
            </p>
          )}
          <p className={styles.words}>
            {beat.lines.map((line) => (
              <span key={line.text} className={styles.mask}>
                <span data-line className={`${styles.line} ${line.accent ? styles.accent : ''}`}>
                  {line.text}
                </span>
              </span>
            ))}
          </p>
        </div>
      ))}
    </div>
  );
}
