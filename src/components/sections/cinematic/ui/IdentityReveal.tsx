import { Fragment, useRef } from 'react';
import { site } from '@/config/site';
import { useStageScene } from '@/hooks/useStageScene';
import styles from './IdentityReveal.module.css';

const WORDS = site.wordmark.split(' ');

/** The wordmark as individual letters (two identical copies stay aligned: letters and sheen). */
function Letters({ tag }: { tag?: boolean }) {
  return WORDS.map((word, w) => (
    <Fragment key={word}>
      {w > 0 && ' '}
      <span className={styles.word}>
        {[...word].map((ch, i) => (
          <span key={i} data-letter={tag || undefined} className={styles.letter}>
            {ch}
          </span>
        ))}
      </span>
    </Fragment>
  ));
}

/**
 * The end of the opening film. Every arm has returned its energy to the heart;
 * the heart releases it as light — a burst and a long anamorphic flare — and
 * the identity pops out of it: letters spring from the centre outward, sharp
 * and bright, a sheen of light crosses the wordmark and a halo keeps
 * breathing. Then the philosophy. As the stage scrolls away the being has
 * already given way to the page's own atmosphere, so the film runs straight
 * into the next section.
 */
export function IdentityReveal() {
  const rootRef = useRef<HTMLDivElement>(null);

  useStageScene('identity', (tl, { chapters: ch, device }) => {
    const Y = ch.spans.identity;
    const root = rootRef.current!;
    const q = (sel: string) => [...root.querySelectorAll<HTMLElement>(sel)];
    const one = (sel: string) => root.querySelector<HTMLElement>(sel)!;
    const letters = q('[data-letter]');
    const blur = device.isMobile ? 12 : 22;
    const at = Y.start + Y.length * 0.22;

    tl.set(root, { autoAlpha: 0 }, 0);
    tl.set(root, { autoAlpha: 1 }, at - 0.01);

    // The heart releases its light: a burst and a flare across the lens.
    tl.fromTo(
      one('[data-burst]'),
      { opacity: 0, scale: 0.15 },
      { opacity: 1, scale: 1, ease: 'expo.out', duration: 0.55 },
      at,
    );
    tl.to(one('[data-burst]'), { opacity: 0.5, scale: 1.12, ease: 'sine.inOut', duration: 0.6 }, at + 0.55);
    tl.fromTo(
      one('[data-flare]'),
      { opacity: 0, scaleX: 0.05 },
      { opacity: 1, scaleX: 1, ease: 'expo.out', duration: 0.5 },
      at + 0.02,
    );
    tl.to(one('[data-flare]'), { opacity: 0.28, scaleX: 1.35, ease: 'sine.out', duration: 0.7 }, at + 0.52);

    // The wordmark pops out of it, from the centre outward.
    tl.fromTo(
      one('[data-mark]'),
      { letterSpacing: '0.32em', scale: 0.9 },
      { letterSpacing: '-0.035em', scale: 1, ease: 'expo.out', duration: 0.75 },
      at,
    );
    tl.fromTo(
      letters,
      { yPercent: 55, scale: 0.45, opacity: 0, filter: `blur(${blur}px)` },
      {
        yPercent: 0,
        scale: 1,
        opacity: 1,
        filter: 'blur(0px)',
        ease: 'expo.out',
        duration: 0.55,
        stagger: { each: 0.03, from: 'center' },
      },
      at + 0.04,
    );
    // Landed: no filter left on the letters (a settled blur(0) still costs a layer pass per frame).
    tl.set(letters, { filter: 'none' }, at + 0.04 + 0.55 + 0.03 * letters.length);
    // A halo swells behind it and keeps breathing on its own.
    tl.fromTo(one('[data-halo]'), { opacity: 0 }, { opacity: 1, ease: 'sine.out', duration: 0.6 }, at + 0.3);
    // A sheen of light crosses the letters.
    tl.fromTo(
      one('[data-sheen]'),
      { backgroundPosition: '130% 0' },
      { backgroundPosition: '-30% 0', ease: 'sine.inOut', duration: 0.7 },
      at + 0.45,
    );

    tl.fromTo(
      one('[data-rule]'),
      { scaleX: 0 },
      { scaleX: 1, ease: 'reveal', duration: Y.length * 0.28 },
      at + Y.length * 0.2,
    );
    tl.fromTo(
      one('[data-serif]'),
      { yPercent: 110 },
      { yPercent: 0, ease: 'reveal', duration: Y.length * 0.26 },
      at + Y.length * 0.24,
    );
    tl.fromTo(
      one('[data-bold]'),
      { yPercent: 110 },
      { yPercent: 0, ease: 'reveal', duration: Y.length * 0.26 },
      at + Y.length * 0.31,
    );
    return { start: Y.start, end: ch.total + 0.01 };
  });

  return (
    <div ref={rootRef} className={styles.identity}>
      <div className={styles.lockup}>
        <span data-burst className={styles.burst} aria-hidden="true" />
        <span data-flare className={styles.flare} aria-hidden="true" />
        <span data-halo className={styles.haloWrap} aria-hidden="true">
          <span className={styles.halo} />
        </span>
        <p className={styles.brandLine}>
          <span data-mark className={styles.brand} role="img" aria-label={site.wordmark}>
            <Letters tag />
          </span>
          <span data-sheen className={styles.sheen} aria-hidden="true">
            <Letters />
          </span>
        </p>
      </div>
      <span data-rule className={styles.rule} aria-hidden="true" />
      <p className={styles.philosophy}>
        <span className={styles.mask}>
          <span data-serif className={styles.serif}>
            {site.philosophy[0]}
          </span>
        </span>
        <span className={styles.mask}>
          <span data-bold className={styles.bold}>
            {site.philosophy[1]}
          </span>
        </span>
      </p>
    </div>
  );
}
