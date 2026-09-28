import { useRef } from 'react';
import { site } from '@/config/site';
import { useStageScene } from '@/hooks/useStageScene';
import styles from './IdentityReveal.module.css';

/**
 * The end of the opening film: every arm has returned its energy to the heart,
 * and the identity resolves — brand, then philosophy.
 */
export function IdentityReveal() {
  const rootRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLSpanElement>(null);
  const serifRef = useRef<HTMLSpanElement>(null);
  const boldRef = useRef<HTMLSpanElement>(null);
  const ruleRef = useRef<HTMLSpanElement>(null);

  useStageScene('identity', (tl, { chapters: ch }) => {
    const Y = ch.spans.identity;
    const root = rootRef.current!;
    const at = Y.start + Y.length * 0.28;
    tl.set(root, { autoAlpha: 0 }, 0);
    tl.set(root, { autoAlpha: 1 }, at - 0.01);
    tl.fromTo(
      brandRef.current,
      { yPercent: 105, letterSpacing: '0.14em' },
      { yPercent: 0, letterSpacing: '-0.035em', ease: 'reveal', duration: Y.length * 0.34 },
      at,
    );
    tl.fromTo(ruleRef.current, { scaleX: 0 }, { scaleX: 1, ease: 'reveal', duration: Y.length * 0.3 }, at + Y.length * 0.12);
    tl.fromTo(serifRef.current, { yPercent: 110 }, { yPercent: 0, ease: 'reveal', duration: Y.length * 0.28 }, at + Y.length * 0.16);
    tl.fromTo(boldRef.current, { yPercent: 110 }, { yPercent: 0, ease: 'reveal', duration: Y.length * 0.28 }, at + Y.length * 0.24);
    return { start: Y.start, end: ch.total + 0.01 };
  });

  return (
    <div ref={rootRef} className={styles.identity}>
      <p className={styles.brandLine}>
        <span ref={brandRef} className={styles.brand}>
          {site.wordmark}
        </span>
      </p>
      <span ref={ruleRef} className={styles.rule} aria-hidden="true" />
      <p className={styles.philosophy}>
        <span className={styles.mask}>
          <span ref={serifRef} className={styles.serif}>
            {site.philosophy[0]}
          </span>
        </span>
        <span className={styles.mask}>
          <span ref={boldRef} className={styles.bold}>
            {site.philosophy[1]}
          </span>
        </span>
      </p>
    </div>
  );
}
