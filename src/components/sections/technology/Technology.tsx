/**
 * 08 — THE TECHNOLOGY
 * A living network: the GA core, seven capability hubs, their tools as
 * satellites. Pick a hub (or let it cycle) to light its connections.
 * The SVG is a visualisation of the state; the buttons are the interface.
 */
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { SectionHeading } from '@/components/common/SectionHeading';
import { useReveal } from '@/hooks/useReveal';
import { content } from '@/services/content';
import styles from './Technology.module.css';

const categories = content.technology();
const SIZE = 800;
const C = SIZE / 2;
const RING = 250;

export function Technology() {
  const [active, setActive] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const ref = useReveal<HTMLElement>();
  const vizRef = useRef<HTMLDivElement>(null);

  const layout = useMemo(
    () =>
      categories.map((cat, i) => {
        const a = (i / categories.length) * Math.PI * 2 - Math.PI / 2;
        const x = C + Math.cos(a) * RING;
        const y = C + Math.sin(a) * RING;
        const tools = cat.tools.map((t, k) => {
          const spread = 0.62;
          const ta = a + (k - (cat.tools.length - 1) / 2) * (spread / Math.max(1, cat.tools.length - 1)) * 1.6;
          const r = RING + 96 + (k % 2) * 26;
          return { label: t, x: C + Math.cos(ta) * r, y: C + Math.sin(ta) * r };
        });
        return { ...cat, x, y, angle: a, tools };
      }),
    [],
  );

  // Gentle auto-cycle until the visitor takes over.
  useEffect(() => {
    if (interacted || document.documentElement.dataset.motion === 'reduced') return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % categories.length), 4200);
    return () => window.clearInterval(id);
  }, [interacted]);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = vizRef.current;
    if (!el || e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };

  const pick = (i: number) => {
    setInteracted(true);
    setActive(i);
  };
  const cat = layout[active]!;

  return (
    <section ref={ref} id="technology" className={styles.section} aria-labelledby="technology-title">
      <div className={`container ${styles.layout}`}>
        <div className={styles.copy}>
          <SectionHeading
            id="technology-title"
            index="05"
            kicker="The technology"
            bold="One system"
            serif="many parts"
            lead="We choose the right tool for each job, then connect everything so it behaves like one intelligent system."
          />
          <div className={styles.tabs} role="tablist" aria-label="Technology areas" data-reveal="up">
            {layout.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                className={styles.tab}
                style={{ ['--accent' as string]: c.accent }}
                onClick={() => pick(i)}
                onMouseEnter={() => pick(i)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className={styles.detail} role="tabpanel" aria-live="polite" style={{ ['--accent' as string]: cat.accent }}>
            <p key={`d-${cat.id}`} className={styles.detailText}>
              {cat.description}
            </p>
            <ul key={`t-${cat.id}`} className={styles.toolList}>
              {cat.tools.map((t) => (
                <li key={t.label}>{t.label}</li>
              ))}
            </ul>
          </div>
        </div>

        <div ref={vizRef} className={styles.viz} onPointerMove={onMove} aria-hidden="true">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.svg}>
            <defs>
              <radialGradient id="coreGlow">
                <stop offset="0" stopColor="#fff" />
                <stop offset="0.3" stopColor="#b9a8ff" stopOpacity="0.8" />
                <stop offset="1" stopColor="#5b8cff" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx={C} cy={C} r={RING} className={styles.orbit} />
            <circle cx={C} cy={C} r={RING + 110} className={styles.orbitFaint} />

            <g className={styles.layerTools}>
              {layout.map((c, i) =>
                c.tools.map((t) => (
                  <g key={`${c.id}-${t.label}`} className={styles.tool} data-on={i === active}>
                    <line x1={c.x} y1={c.y} x2={t.x} y2={t.y} className={styles.toolEdge} />
                    <circle cx={t.x} cy={t.y} r="3.2" className={styles.toolDot} style={{ fill: c.accent }} />
                    <text
                      x={t.x + (t.x > C ? 10 : -10)}
                      y={t.y + 4}
                      textAnchor={t.x > C ? 'start' : 'end'}
                      className={styles.toolLabel}
                    >
                      {t.label}
                    </text>
                  </g>
                )),
              )}
            </g>

            <g className={styles.layerHubs}>
              {layout.map((c, i) => {
                const d = `M${C},${C} L${c.x},${c.y}`;
                return (
                  <g key={c.id} className={styles.hub} data-on={i === active} style={{ ['--accent' as string]: c.accent }}>
                    <path d={d} className={styles.spoke} />
                    <circle r="3" className={styles.pulse}>
                      <animateMotion dur={`${2.4 + i * 0.3}s`} repeatCount="indefinite" path={d} />
                    </circle>
                    <circle cx={c.x} cy={c.y} r={i === active ? 30 : 22} className={styles.hubRing} />
                    <circle cx={c.x} cy={c.y} r="6" className={styles.hubDot} />
                    <text x={c.x} y={c.y - (i === active ? 42 : 34)} textAnchor="middle" className={styles.hubLabel}>
                      {c.label}
                    </text>
                  </g>
                );
              })}
            </g>

            <circle cx={C} cy={C} r="90" fill="url(#coreGlow)" opacity="0.35" />
            <circle cx={C} cy={C} r="46" className={styles.core} />
            <text x={C} y={C + 8} textAnchor="middle" className={styles.coreLabel}>
              GA
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}
