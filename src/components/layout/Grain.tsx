import styles from './Grain.module.css';

/**
 * The lens the whole site is seen through: a subtle violet-black vignette
 * framing every screen (film and page alike — one colour tone throughout),
 * and film grain over everything, stepped a few times a second.
 */
export function Grain() {
  return (
    <>
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />
    </>
  );
}
