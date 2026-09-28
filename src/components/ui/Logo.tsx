import styles from './Logo.module.css';

/**
 * GA Automations identity.
 *  Mark: an iris — ring + pupil — with six ticks for the six capabilities.
 *  Wordmark: heavy grotesk caps, tightly tracked.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`${styles.mark} ${className ?? ''}`} aria-hidden="true">
      <circle cx="32" cy="32" r="16" className={styles.ring} />
      <circle cx="32" cy="32" r="6" className={styles.pupil} />
      <g className={styles.ticks}>
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <line key={a} x1="32" y1="5" x2="32" y2="10" transform={`rotate(${a} 32 32)`} />
        ))}
      </g>
    </svg>
  );
}

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'xl';
  /** Hide the mark (wordmark only). */
  wordmarkOnly?: boolean;
}

export function Logo({ className, size = 'sm', wordmarkOnly }: LogoProps) {
  return (
    <span className={`${styles.logo} ${styles[size]} ${className ?? ''}`}>
      {!wordmarkOnly && <LogoMark />}
      <span className={styles.wordmark}>
        <span className={styles.ga}>GA</span> <span className={styles.rest}>Automations</span>
      </span>
    </span>
  );
}
