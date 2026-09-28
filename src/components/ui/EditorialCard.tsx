/**
 * EditorialCard — a page from a design journal, not a feature box.
 * Dark translucent surface, 1px border, a very soft blue/violet glow, a large
 * layered media area with tiny technical metadata, and the house lockup.
 *
 * Hover (fine pointers only): lifts a few pixels, the visual settles closer,
 * the border and metadata brighten, and a soft light follows the cursor.
 */
import { useRef, type ReactNode } from 'react';
import styles from './EditorialCard.module.css';

interface EditorialCardProps {
  /** Tiny technical metadata over the visual, e.g. ['Fig. 01', 'Input layer']. */
  meta: [string, string];
  bold: string;
  serif: string;
  text: string;
  /** Small trace line under the text, e.g. 'Signal → structure'. */
  trace?: string;
  visual: ReactNode;
  /** Visual proportion. */
  shape?: 'tall' | 'square' | 'landscape' | 'wide';
  /** Smaller type and padding for dense compositions (a tall card's visual fills its cell). */
  compact?: boolean;
  className?: string;
}

export function EditorialCard({
  meta,
  bold,
  serif,
  text,
  trace,
  visual,
  shape = 'landscape',
  compact = false,
  className,
}: EditorialCardProps) {
  const ref = useRef<HTMLElement>(null);
  const frame = useRef(0);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const el = ref.current;
    if (!el || frame.current) return;
    const { clientX, clientY } = e;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${(clientX - r.left).toFixed(0)}px`);
      el.style.setProperty('--my', `${(clientY - r.top).toFixed(0)}px`);
    });
  };

  return (
    <article
      ref={ref}
      className={`${styles.card} ${styles[shape]} ${compact ? styles.compact : ''} ${className ?? ''}`}
      onPointerMove={onMove}
      data-reveal="up"
    >
      <div className={styles.media}>
        <div className={styles.depth} aria-hidden="true" />
        <div className={styles.visual}>{visual}</div>
        <div className={styles.light} aria-hidden="true" />
        <p className={styles.meta}>
          <span>{meta[0]}</span>
          <span>{meta[1]}</span>
        </p>
      </div>
      <div className={styles.body}>
        <h3 className={styles.lockup}>
          <span className={styles.bold}>{bold}</span>
          <span className={styles.serif}>{serif}</span>
        </h3>
        <p className={styles.text}>{text}</p>
        {trace && <p className={styles.trace}>{trace}</p>}
      </div>
    </article>
  );
}
