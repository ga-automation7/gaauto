import styles from './OrbitDial.module.css';

const TICKS = Array.from({ length: 72 }, (_, i) => i * 5);

/**
 * A celestial instrument drawn in hairlines — graduated ring, dashed orbit, a
 * body travelling on it — turning very slowly around a section's index number,
 * like a reading on an astrolabe. Pure decoration (SVG + one CSS rotation).
 */
export function OrbitDial({ className }: { className?: string }) {
  return (
    <span className={`${styles.dial} ${className ?? ''}`} aria-hidden="true">
      <svg viewBox="0 0 200 200" className={styles.ring}>
        {TICKS.map((a) => (
          <line
            key={a}
            x1="100"
            y1={a % 30 === 0 ? 4 : 8}
            x2="100"
            y2="13"
            transform={`rotate(${a} 100 100)`}
            className={a % 30 === 0 ? styles.major : styles.minor}
          />
        ))}
        <circle cx="100" cy="100" r="86" className={styles.circle} />
      </svg>
      <svg viewBox="0 0 200 200" className={styles.orbit}>
        <circle cx="100" cy="100" r="64" className={styles.dashed} />
        <circle cx="100" cy="36" r="3.2" className={styles.body} />
        <circle cx="100" cy="36" r="8" className={styles.bodyHalo} />
      </svg>
      <svg viewBox="0 0 200 200" className={styles.cross}>
        <path d="M100 58v14M100 128v14M58 100h14M128 100h14" />
      </svg>
    </span>
  );
}
