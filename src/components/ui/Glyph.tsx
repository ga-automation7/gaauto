import type { GlyphName } from '@/types/content';
import styles from './Glyph.module.css';

/**
 * Line glyphs for the six capabilities. Each mirrors the object held by the
 * corresponding cosmic hand, so the business UI stays tied to the film.
 * Pure SVG, currentColor, 1-weight strokes; parts rotate gently on hover/active.
 */
const GLYPHS: Record<GlyphName, React.ReactNode> = {
  star: (
    <>
      <circle cx="24" cy="24" r="3.2" className={styles.fill} />
      <circle cx="24" cy="24" r="7" />
      <g className={styles.spin}>
        <ellipse cx="24" cy="24" rx="19" ry="7" transform="rotate(-18 24 24)" />
        <circle cx="41.2" cy="18.6" r="1.6" className={styles.fill} />
      </g>
      <g className={styles.spinReverse}>
        <ellipse cx="24" cy="24" rx="15" ry="5" transform="rotate(32 24 24)" />
      </g>
    </>
  ),
  galaxy: (
    <>
      <g className={styles.spin}>
        <path d="M24 24c0-3 2.6-5 5.4-4.2 4.4 1.3 5.3 7.5 1.6 11.2-5 5-13.7 3.6-17-2.6-4-7.6 1-17 9.6-18.6" />
        <path d="M24 24c0 3-2.6 5-5.4 4.2-4.4-1.3-5.3-7.5-1.6-11.2 5-5 13.7-3.6 17 2.6 4 7.6-1 17-9.6 18.6" />
      </g>
      <circle cx="24" cy="24" r="2.4" className={styles.fill} />
      <circle cx="9" cy="12" r="0.9" className={styles.fill} />
      <circle cx="40" cy="37" r="0.9" className={styles.fill} />
    </>
  ),
  sphere: (
    <>
      <circle cx="24" cy="24" r="17" />
      <ellipse cx="24" cy="24" rx="17" ry="6" />
      <g className={styles.spin}>
        <ellipse cx="24" cy="24" rx="6.5" ry="17" />
        <ellipse cx="24" cy="24" rx="13" ry="17" />
      </g>
      <circle cx="24" cy="7" r="1.3" className={styles.fill} />
      <circle cx="7" cy="24" r="1.3" className={styles.fill} />
      <circle cx="41" cy="24" r="1.3" className={styles.fill} />
      <circle cx="24" cy="41" r="1.3" className={styles.fill} />
    </>
  ),
  orbit: (
    <>
      <circle cx="24" cy="24" r="8" />
      <circle cx="24" cy="24" r="2" className={styles.fill} />
      <g className={styles.spin}>
        <ellipse cx="24" cy="24" rx="20" ry="5.5" transform="rotate(-16 24 24)" />
        <circle cx="5" cy="29.4" r="1.5" className={styles.fill} />
      </g>
      <g className={styles.spinReverse}>
        <ellipse cx="24" cy="24" rx="16" ry="10" transform="rotate(28 24 24)" />
      </g>
    </>
  ),
  crystal: (
    <>
      <g className={styles.float}>
        <path d="M24 4.5 40 24 24 43.5 8 24Z" />
        <path d="M8 24h32M24 4.5 20 27.5 24 43.5M20 27.5 8 24M20 27.5 40 24" />
      </g>
      <circle cx="24" cy="24" r="1.6" className={styles.fill} />
    </>
  ),
  cube: (
    <>
      <rect x="8" y="8" width="32" height="32" rx="1" />
      <g className={styles.pulse}>
        <rect x="16" y="16" width="16" height="16" rx="0.6" />
      </g>
      <path d="M8 8l8 8M40 8l-8 8M8 40l8-8M40 40l-8-8" />
      <circle cx="24" cy="24" r="1.5" className={styles.fill} />
    </>
  ),
};

interface GlyphProps {
  name: GlyphName;
  className?: string;
  /** Animate continuously (otherwise only on parent hover / [data-active]). */
  live?: boolean;
  title?: string;
}

export function Glyph({ name, className, live, title }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={`${styles.glyph} ${live ? styles.live : ''} ${className ?? ''}`}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {GLYPHS[name]}
    </svg>
  );
}
