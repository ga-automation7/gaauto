/**
 * Capability HUD — the business layer over the cosmic entity.
 *
 * One panel per capability docks on the side of its hand, joined to the hand
 * by a leader line that tracks the camera every frame. A 01–06 rail lets the
 * visitor jump straight to any capability. The entity stays the structure; the
 * UI only annotates it.
 */
import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import type { Service } from '@/types/content';
import { scrollToTarget } from '@/lib/smoothScroll';
import { CapabilityCard } from './CapabilityCard';
import styles from './CapabilityHUD.module.css';

export interface CapabilityHUDHandle {
  /** Re-measure panel anchors (resize / content change). */
  layout: () => void;
  /** Per-frame: screen position of the active hand. */
  frame: (hand: { x: number; y: number }) => void;
}

interface CapabilityHUDProps {
  services: Service[];
  active: number;
  /** Stage position of the first step and the length of each step (vh). */
  range: { start: number; step: number };
}

type Side = 'left' | 'right';
/** The panel docks opposite its hand, so the zoomed hand is never covered. */
const sideOf = (s: Service | undefined): Side => ((s?.visual.hand ?? 0) % 2 === 0 ? 'right' : 'left');

export const CapabilityHUD = forwardRef<CapabilityHUDHandle, CapabilityHUDProps>(function CapabilityHUD(
  { services, active, range },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const leaderRef = useRef<SVGPathElement>(null);
  const handRingRef = useRef<SVGCircleElement>(null);
  const slotRefs = useRef<Record<Side, HTMLElement | null>>({ left: null, right: null });
  const anchor = useRef({ x: 0, y: 0, valid: false });
  const service = services[active];
  const side = sideOf(service);

  const measure = () => {
    const slot = slotRefs.current[side];
    const root = rootRef.current;
    if (!slot || !root || active < 0) {
      anchor.current.valid = false;
      return;
    }
    const r = slot.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    anchor.current = {
      x: (mobile ? r.left + r.width / 2 : side === 'left' ? r.right - 30 : r.left + 30) - rootRect.left,
      y: r.top - rootRect.top,
      valid: true,
    };
  };

  useLayoutEffect(() => {
    measure();
    // Panels settle with a short transition — re-anchor once they have landed.
    const id = window.setTimeout(measure, 850);
    return () => window.clearTimeout(id);
  });

  useImperativeHandle(ref, () => ({
    layout: measure,
    frame(hand) {
      const path = leaderRef.current;
      const ring = handRingRef.current;
      if (!path || !ring || !anchor.current.valid) return;
      const { x, y } = anchor.current;
      const riseY = y - 28;
      path.setAttribute('d', `M${x.toFixed(1)},${y.toFixed(1)} V${riseY.toFixed(1)} L${hand.x.toFixed(1)},${hand.y.toFixed(1)}`);
      ring.setAttribute('cx', hand.x.toFixed(1));
      ring.setAttribute('cy', hand.y.toFixed(1));
    },
  }));

  const jumpTo = (i: number) => {
    const startAnchor = document.getElementById('chapter-capabilities');
    const endAnchor = document.getElementById('chapter-identity');
    if (!startAnchor || !endAnchor) return;
    const unit = (endAnchor.offsetTop - startAnchor.offsetTop) / (range.step * services.length);
    const top = startAnchor.offsetTop + (i + 0.45) * range.step * unit;
    scrollToTarget(top, { duration: 1.4 });
  };

  return (
    <div ref={rootRef} className={styles.hud} data-visible={active >= 0} aria-hidden={active < 0}>
      <svg className={styles.leader} aria-hidden="true">
        <path
          key={`leader-${active}`}
          ref={leaderRef}
          className={styles.leaderPath}
          pathLength={1}
          style={{ ['--accent' as string]: service?.accent }}
        />
        <circle key={`ring-${active}`} ref={handRingRef} r="7" className={styles.handRing} />
      </svg>

      {(['left', 'right'] as const).map((slotSide) => {
        const shown = side === slotSide && service;
        return (
          <article
            key={slotSide}
            ref={(el) => {
              slotRefs.current[slotSide] = el;
            }}
            className={styles.panel}
            data-side={slotSide}
            data-shown={!!shown}
            style={{ ['--accent' as string]: service?.accent }}
            aria-live={shown ? 'polite' : undefined}
          >
            {shown && <CapabilityCard key={service.id} service={service} total={services.length} />}
          </article>
        );
      })}

      <nav className={styles.rail} aria-label="Capabilities">
        {services.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={styles.railItem}
            data-active={i === active}
            onClick={() => jumpTo(i)}
            aria-label={`${s.index} ${s.title}`}
            aria-current={i === active ? 'step' : undefined}
          >
            <span className={`${styles.railIndex} t-num`}>{s.index}</span>
            <span className={styles.railLabel}>{s.title}</span>
          </button>
        ))}
      </nav>
    </div>
  );
});
