/**
 * 04 — THE TRANSFORMATION
 * cosmic energy → digital network → business workflow → automated system.
 * Desktop: a sticky stage scrubbed by scroll. Small screens: plays once on entry.
 */
import { useMemo, useRef, useState } from 'react';
import { SectionHeading } from '@/components/common/SectionHeading';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useReveal } from '@/hooks/useReveal';
import {
  capabilityCards,
  networkCards,
  networkHub,
  phaseConnections,
  phaseSignals,
  phaseSteps,
  transformationPhases,
  workflowEdges,
  workflowEvents,
  workflowNodes,
} from '@/data/workflow';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { seededRandom } from '@/lib/math';
import styles from './Transformation.module.css';

const W = 1000;
const H = 620;
const PARTICLES = 64;

export function Transformation() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);
  const mobile = useMediaQuery('(max-width: 899px)');
  const copyRef = useReveal<HTMLDivElement>('top 75%');

  const nodes = useMemo(() => new Map(workflowNodes.map((n) => [n.id, n])), []);
  const pos = (id: string, m: boolean) => {
    const n = nodes.get(id)!;
    return m ? n.mobile : n.desktop;
  };
  const vb = mobile ? { w: 400, h: 900 } : { w: W, h: H };

  // Scattered "energy" particles and their lattice positions.
  const particles = useMemo(() => {
    const rand = seededRandom(12);
    return Array.from({ length: PARTICLES }, (_, i) => {
      const gx = i % 8;
      const gy = Math.floor(i / 8);
      return {
        sx: rand(),
        sy: rand(),
        lx: 0.08 + (gx / 7) * 0.84,
        ly: 0.1 + (gy / 7) * 0.8,
        r: 1.4 + rand() * 1.8,
      };
    });
  }, []);

  const edgePath = (a: string, b: string, m: boolean) => {
    const [x1, y1] = pos(a, m);
    const [x2, y2] = pos(b, m);
    if (m) {
      const dy = (y2 - y1) * 0.5;
      return `M${x1},${y1} C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}`;
    }
    const dx = (x2 - x1) * 0.5;
    return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ desktop: '(min-width: 900px)', small: '(max-width: 899px)' }, (ctx) => {
        const { desktop } = ctx.conditions as { desktop: boolean; small: boolean };
        const reduced = document.documentElement.dataset.motion === 'reduced';
        const stage = stageRef.current!;
        const q = gsap.utils.selector(stage);
        const dots = q('[data-particle]');
        const grid = q('[data-grid]');
        const nodeEls = q('[data-node]');
        const edges = q('[data-edge]');
        const pulses = q('[data-pulse]');
        const events = gsap.utils.toArray<HTMLElement>('[data-event]', sectionRef.current);

        // Continuous pulses along the edges (run while the system phase is live).
        const pulseTl = gsap.timeline({ paused: true, repeat: -1 });
        pulses.forEach((p, i) => {
          const path = edges[i % edges.length] as unknown as SVGPathElement;
          pulseTl.fromTo(
            p,
            { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 0 }, opacity: 0 },
            {
              motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
              opacity: 1,
              duration: 1.6,
              ease: 'none',
            },
            (i % edges.length) * 0.18,
          );
        });

        const vbw = desktop ? W : 400;
        const vbh = desktop ? H : 900;
        const tl = gsap.timeline({ defaults: { ease: 'none' } });
        // 1 · energy → 2 · lattice
        dots.forEach((d, i) => {
          const pt = particles[i]!;
          tl.fromTo(
            d,
            { attr: { cx: pt.sx * vbw, cy: pt.sy * vbh }, opacity: 0.9 },
            { attr: { cx: pt.lx * vbw, cy: pt.ly * vbh }, duration: 1, ease: 'power2.inOut' },
            0.8 + (i % 8) * 0.02,
          );
        });
        tl.fromTo(grid, { opacity: 0 }, { opacity: 1, duration: 0.8 }, 1.2);
        // 3 · workflow: nodes materialise, edges draw, particles dissolve
        tl.to(dots, { opacity: 0, duration: 0.6 }, 2.2);
        tl.to(grid, { opacity: 0.35, duration: 0.6 }, 2.2);
        tl.fromTo(
          nodeEls,
          { opacity: 0, scale: 0.85 },
          { opacity: 1, scale: 1, duration: 0.5, stagger: 0.07, ease: 'reveal' },
          2.2,
        );
        tl.fromTo(edges, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.7, stagger: 0.05 }, 2.4);
        // 4 · system: events log in
        tl.fromTo(events, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.25, stagger: 0.14 }, 3.3);
        tl.set({}, {}, 4.4);

        if (reduced) {
          tl.progress(1);
          setPhase(3);
          return;
        }

        if (desktop) {
          ScrollTrigger.create({
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            animation: tl,
            onUpdate: (self) => {
              const p = Math.min(3, Math.floor(self.progress * 4.1));
              setPhase(p);
              if (p === 3) pulseTl.play();
              else pulseTl.pause();
            },
          });
        } else {
          tl.pause(0);
          ScrollTrigger.create({
            trigger: stage,
            start: 'top 70%',
            once: true,
            onEnter: () => {
              tl.duration(8.5).play();
              gsap.delayedCall(2.2, () => setPhase(1));
              gsap.delayedCall(4.2, () => setPhase(2));
              gsap.delayedCall(6.3, () => {
                setPhase(3);
                pulseTl.play();
              });
            },
          });
        }
        return () => pulseTl.kill();
      });
      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [mobile], revertOnUpdate: true },
  );

  return (
    <section ref={sectionRef} id="systems" className={styles.section} aria-labelledby="systems-title">
      <div className={styles.sticky}>
        <div className={`container ${styles.layout}`}>
          <div ref={copyRef} className={styles.copy}>
            <SectionHeading
              id="systems-title"
              index="04"
              kicker="The transformation"
              bold="Intelligence"
              serif="at work"
              lead="Capability only matters once it is wired into the way your business runs. That wiring is the part we build."
            />
            <ol className={styles.phases}>
              {transformationPhases.map((p, i) => (
                <li key={p.id} className={styles.phase} data-active={i === phase} data-done={i < phase}>
                  <span className={`${styles.phaseIndex} t-num`}>{p.index}</span>
                  <div>
                    <p className={styles.phaseLabel}>{p.label}</p>
                    <p className={styles.phaseText}>{p.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.visual}>
            <div
              ref={stageRef}
              className={styles.stage}
              data-phase={phase}
              style={{ aspectRatio: `${vb.w} / ${vb.h}` }}
            >
              <svg className={styles.svg} viewBox={`0 0 ${vb.w} ${vb.h}`} aria-hidden="true">
                <defs>
                  <pattern id="lattice" width={vb.w / 8} height={vb.h / 8} patternUnits="userSpaceOnUse">
                    <path d={`M ${vb.w / 8} 0 L 0 0 0 ${vb.h / 8}`} className={styles.gridLine} />
                  </pattern>
                  <linearGradient id="edgeGrad" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0" stopColor="#5b8cff" stopOpacity="0.2" />
                    <stop offset="0.5" stopColor="#8b6bff" stopOpacity="0.9" />
                    <stop offset="1" stopColor="#6fd8ff" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
                <rect data-grid width={vb.w} height={vb.h} fill="url(#lattice)" opacity="0" />
                {/* 02 · every tool wired to one intelligence */}
                <g className={styles.netLines}>
                  {networkCards.map((c) => {
                    const [x1, y1] = mobile ? networkHub.mobile : networkHub.desktop;
                    const [x2, y2] = mobile ? c.mobile : c.desktop;
                    return <line key={c.id} x1={x1} y1={y1} x2={x2} y2={y2} className={styles.netLine} />;
                  })}
                </g>
                {workflowEdges.map(([a, b]) => (
                  <path key={`${a}-${b}`} data-edge d={edgePath(a, b, mobile)} className={styles.edge} />
                ))}
                {workflowEdges.map(([a, b], i) => (
                  <circle key={`p-${a}-${b}-${i}`} data-pulse r="4" className={styles.pulse} opacity="0" />
                ))}
                {particles.map((p, i) => (
                  <circle
                    key={i}
                    data-particle
                    cx={p.sx * vb.w}
                    cy={p.sy * vb.h}
                    r={p.r}
                    className={styles.particle}
                  />
                ))}
              </svg>

              {/* 01 · raw capability — powerful, not yet pointed at anything */}
              {capabilityCards.map((c, i) => {
                const [x, y] = mobile ? c.mobile : c.desktop;
                return (
                  <div
                    key={c.id}
                    className={styles.nodeAnchor}
                    style={{ left: `${(x / vb.w) * 100}%`, top: `${(y / vb.h) * 100}%` }}
                  >
                    <div className={`${styles.stageCard} ${styles.capCard}`} style={{ ['--i' as string]: i }}>
                      <span className={styles.capGlyph} aria-hidden="true" />
                      <span className={styles.nodeLabel}>{c.label}</span>
                      <span className={`${styles.nodeDetail} t-data`}>{c.detail}</span>
                    </div>
                  </div>
                );
              })}
              {/* 02 · the network */}
              {[{ id: 'hub', ...networkHub }, ...networkCards].map((c, i) => {
                const [x, y] = mobile ? c.mobile : c.desktop;
                const hub = c.id === 'hub';
                return (
                  <div
                    key={c.id}
                    className={styles.nodeAnchor}
                    style={{ left: `${(x / vb.w) * 100}%`, top: `${(y / vb.h) * 100}%` }}
                  >
                    <div
                      className={`${styles.stageCard} ${styles.netCard} ${hub ? styles.hub : ''}`}
                      style={{ ['--i' as string]: i }}
                    >
                      <span className={hub ? styles.hubDot : styles.online} aria-hidden="true" />
                      <span className={styles.nodeLabel}>{c.label}</span>
                      <span className={`${styles.nodeDetail} t-data`}>{c.detail}</span>
                    </div>
                  </div>
                );
              })}

              {workflowNodes.map((n) => {
                const [x, y] = mobile ? n.mobile : n.desktop;
                return (
                  <div
                    key={n.id}
                    className={styles.nodeAnchor}
                    style={{ left: `${(x / vb.w) * 100}%`, top: `${(y / vb.h) * 100}%` }}
                  >
                    <div data-node className={`${styles.node} ${styles[n.kind]}`}>
                      <span className={styles.nodeDot} />
                      <span className={styles.nodeLabel}>{n.label}</span>
                      <span className={`${styles.nodeDetail} t-data`}>{n.detail}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* One card per phase, in the same place: the stage says what, the card says how. */}
            <div className={styles.deck} data-phase={phase}>
              <section className={styles.card} data-for="0" aria-hidden={phase !== 0}>
                <header className={styles.cardHead}>
                  <span className="t-num">01</span>
                  <span className={styles.cardTitle}>Signals, understood</span>
                  <span className={styles.cardMeta}>Reading inputs</span>
                </header>
                <ul className={styles.signals}>
                  {phaseSignals.map((s, i) => (
                    <li key={s.source} style={{ ['--i' as string]: i }}>
                      <span className={styles.source}>{s.source}</span>
                      <span className={styles.input}>{s.input}</span>
                      <span className={styles.tags}>
                        {s.reading.map((r) => (
                          <em key={r}>{r}</em>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={styles.card} data-for="1" aria-hidden={phase !== 1}>
                <header className={styles.cardHead}>
                  <span className="t-num">02</span>
                  <span className={styles.cardTitle}>Tools, connected</span>
                  <span className={styles.cardMeta}>
                    {phaseConnections.length} / {phaseConnections.length} online
                  </span>
                </header>
                <ul className={styles.connections}>
                  {phaseConnections.map((c, i) => (
                    <li key={c.tool} style={{ ['--i' as string]: i }}>
                      <i className={styles.online} aria-hidden="true" />
                      <span className={styles.tool}>{c.tool}</span>
                      <span className={styles.role}>{c.role}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={styles.card} data-for="2" aria-hidden={phase !== 2}>
                <header className={styles.cardHead}>
                  <span className="t-num">03</span>
                  <span className={styles.cardTitle}>The flow, mapped</span>
                  <span className={styles.cardMeta}>End to end</span>
                </header>
                <ol className={styles.steps}>
                  {phaseSteps.map((s, i) => (
                    <li key={s.step} style={{ ['--i' as string]: i }}>
                      <span className={`${styles.stepNo} t-num`}>{String(i + 1).padStart(2, '0')}</span>
                      <span className={styles.stepName}>{s.step}</span>
                      <span className={styles.owner} data-owner={s.owner}>
                        {s.owner}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className={styles.card} data-for="3" aria-hidden={phase !== 3}>
                <header className={styles.cardHead}>
                  <span className="t-num">04</span>
                  <span className={styles.cardTitle}>The system, running</span>
                  <span className={`${styles.cardMeta} ${styles.live}`}>Live</span>
                </header>
                <ol className={styles.log} aria-label="Example event log">
                  {workflowEvents.map((e, i) => (
                    <li key={i} data-event className={styles.event}>
                      <span className="t-num">{e.time}</span>
                      <span className={styles.eventSource}>{e.source}</span>
                      <span className={styles.eventMsg}>{e.message}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
