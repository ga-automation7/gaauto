import { useRef } from 'react';
import { useStageScene } from '@/hooks/useStageScene';
import styles from './StageCaption.module.css';

interface StageCaptionProps {
  id: string;
  /** Stage position where the caption starts entering / finishes leaving. */
  from: number;
  to: number;
  kicker?: string;
  bold: string;
  serif: string;
  support?: string;
  placement?: 'bottom-left' | 'bottom-center' | 'center';
}

/**
 * Poster-style chapter caption: tracked kicker, heavy grotesk line, hairline
 * italic line, optional support copy. Entry/exit are scrubbed by scroll.
 */
export function StageCaption({
  id,
  from,
  to,
  kicker,
  bold,
  serif,
  support,
  placement = 'bottom-left',
}: StageCaptionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const boldRef = useRef<HTMLSpanElement>(null);
  const serifRef = useRef<HTMLSpanElement>(null);
  const supportRef = useRef<HTMLParagraphElement>(null);

  useStageScene(
    `caption-${id}`,
    (tl) => {
      const root = rootRef.current!;
      const span = to - from;
      const inDur = Math.min(0.42, span * 0.35);
      const outAt = to - Math.min(0.32, span * 0.28);
      tl.set(root, { autoAlpha: 0 }, 0);
      tl.set(root, { autoAlpha: 1, y: 0 }, from);
      if (kickerRef.current)
        tl.fromTo(
          kickerRef.current,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, ease: 'power2.out', duration: inDur * 0.8 },
          from,
        );
      tl.fromTo(
        boldRef.current,
        { yPercent: 115 },
        { yPercent: 0, ease: 'reveal', duration: inDur },
        from + 0.03,
      );
      tl.fromTo(
        serifRef.current,
        { yPercent: 115 },
        { yPercent: 0, ease: 'reveal', duration: inDur },
        from + 0.1,
      );
      if (supportRef.current)
        tl.fromTo(
          supportRef.current,
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, ease: 'power2.out', duration: inDur * 0.8 },
          from + 0.18,
        );
      tl.to(root, { autoAlpha: 0, y: -28, ease: 'power1.in', duration: to - outAt }, outAt);
      return { start: from - 0.05, end: to + 0.05 };
    },
    [from, to],
  );

  return (
    <div ref={rootRef} className={`${styles.caption} ${styles[placement]}`}>
      {kicker && (
        <p ref={kickerRef} className={`${styles.kicker} t-kicker`}>
          {kicker}
        </p>
      )}
      <h2 className={styles.lockup}>
        <span className={styles.mask}>
          <span ref={boldRef} className={styles.bold}>
            {bold}
          </span>
        </span>
        <span className={styles.mask}>
          <span ref={serifRef} className={styles.serif}>
            {serif}
          </span>
        </span>
      </h2>
      {support && (
        <p ref={supportRef} className={`${styles.support} t-lead`}>
          {support}
        </p>
      )}
    </div>
  );
}
