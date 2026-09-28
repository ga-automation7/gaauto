/**
 * An editorial band of giant words drifting across the page — outlined and solid
 * in turn, stars between them. It drifts on its own and surges with scroll speed
 * (in the direction you scroll), then eases back. Decorative: hidden from
 * assistive tech; one transform per frame, and only while on screen.
 */
import { useEffect, useRef } from 'react';
import { getDeviceProfile } from '@/lib/device';
import { getScrollState } from '@/lib/smoothScroll';
import { useTicker } from '@/hooks/useTicker';
import styles from './Marquee.module.css';

interface MarqueeProps {
  items: string[];
  /** Drift to the right instead of the left. */
  reverse?: boolean;
  className?: string;
}

export function Marquee({ items, reverse = false, className }: MarqueeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offset = useRef(0);
  const speed = useRef(0);
  const span = useRef(1);
  const still = getDeviceProfile().reducedMotion;

  const ticker = useTicker((_, dt) => {
    const track = trackRef.current;
    if (!track) return;
    const dir = reverse ? 1 : -1;
    // Drift + a surge with scroll velocity (eased so it never jerks).
    const target = 38 + Math.min(900, Math.abs(getScrollState().velocity) * 22);
    speed.current += (target - speed.current) * Math.min(1, dt * 3);
    offset.current = (offset.current + dir * speed.current * dt) % span.current;
    if (offset.current > 0) offset.current -= span.current;
    track.style.transform = `translate3d(${offset.current.toFixed(1)}px, 0, 0)`;
  });

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track || still) return;
    const measure = () => (span.current = Math.max(1, track.scrollWidth / 2));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    const io = new IntersectionObserver(([e]) => (e?.isIntersecting ? ticker.start() : ticker.stop()));
    io.observe(root);
    return () => {
      ro.disconnect();
      io.disconnect();
      ticker.stop();
    };
  }, [ticker, still]);

  const run = (copy: number) =>
    items.map((item, i) => (
      <span key={`${copy}-${i}`} className={styles.item}>
        <span className={i % 2 ? styles.solid : styles.outline}>{item}</span>
        <span className={styles.star}>✦</span>
      </span>
    ));

  return (
    <div ref={rootRef} className={`${styles.marquee} ${className ?? ''}`} aria-hidden="true">
      <div ref={trackRef} className={styles.track}>
        {run(0)}
        {run(1)}
      </div>
    </div>
  );
}
