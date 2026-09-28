import type { MouseEventHandler } from 'react';
import { useMagnetic } from '@/hooks/useMagnetic';
import styles from './CircleArrow.module.css';

type Direction = 'right' | 'down' | 'up' | 'left' | 'up-right';

const ROTATION: Record<Direction, number> = { right: 0, down: 90, left: 180, up: -90, 'up-right': -45 };

type CircleArrowProps = {
  direction?: Direction;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'light' | 'dark';
} & (
  | { /** Accessible name of the button. */ label: string; decorative?: false }
  | { /** Render as a decorative element inside another control. */ decorative: true; label?: never }
);

/** Signature control: solid white disc, dark arrow. Magnetic on fine pointers. */
export function CircleArrow({ direction = 'right', label, onClick, size = 'md', decorative, tone = 'light' }: CircleArrowProps) {
  // (label is required unless decorative — enforced by the union type above)
  const ref = useMagnetic<HTMLButtonElement>({ strength: 0.28 });
  const arrow = (
    <svg viewBox="0 0 24 24" className={styles.icon} style={{ ['--rot' as string]: `${ROTATION[direction]}deg` }} aria-hidden="true">
      <path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5" />
    </svg>
  );
  if (decorative) {
    return (
      <span className={`${styles.circle} ${styles[size]} ${styles[tone]}`} aria-hidden="true">
        {arrow}
      </span>
    );
  }
  return (
    <button ref={ref} type="button" className={`${styles.circle} ${styles[size]} ${styles[tone]}`} onClick={onClick} aria-label={label}>
      {arrow}
    </button>
  );
}
