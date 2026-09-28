/**
 * Original visual modules for the journal — drawn in code, not stock imagery.
 * Each is a small, calm SVG system in the site's light (electric blue, violet,
 * starlight). Motion is CSS (rotations, flowing dashes) plus SMIL pulses along
 * paths; everything pauses while its card is off screen (see Journal).
 */
import styles from './Visuals.module.css';

const W = 480;
const H = 360;

/** Deterministic pseudo-random numbers: identical figures on every load. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={`${id}-core`}>
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.25" stopColor="#c9d6ff" stopOpacity="0.9" />
        <stop offset="0.6" stopColor="#5b8cff" stopOpacity="0.25" />
        <stop offset="1" stopColor="#5b8cff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-halo`}>
        <stop offset="0" stopColor="#8b6bff" stopOpacity="0.35" />
        <stop offset="0.55" stopColor="#5b8cff" stopOpacity="0.08" />
        <stop offset="1" stopColor="#5b8cff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-pulse`}>
        <stop offset="0" stopColor="#b9c9ff" stopOpacity="0.9" />
        <stop offset="1" stopColor="#5b8cff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-beam`} x1="0" x2="1">
        <stop offset="0" stopColor="#5b8cff" stopOpacity="0" />
        <stop offset="0.5" stopColor="#9fb4ff" stopOpacity="0.9" />
        <stop offset="1" stopColor="#e8ecff" stopOpacity="0.2" />
      </linearGradient>
    </defs>
  );
}

/** A soft light dot travelling a path, forever (SMIL; paused off screen). */
function Pulse({
  d,
  dur,
  glow,
  begin = 0,
  r = 2.6,
}: {
  d: string;
  dur: number;
  glow: string;
  begin?: number;
  r?: number;
}) {
  return (
    <g className={styles.pulse}>
      <circle r={r * 3.2} fill={`url(#${glow}-pulse)`} opacity="0.7">
        <animateMotion path={d} dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
      </circle>
      <circle r={r} fill="#eef2ff">
        <animateMotion path={d} dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
      </circle>
    </g>
  );
}

/* ── 01 PERCEPTION — an abstract AI eye: iris of ticks, scanning arc, sweep ── */
export function PerceptionVisual() {
  const cx = W / 2;
  const cy = H / 2;
  const rand = seeded(11);
  const ticks = Array.from({ length: 84 }, (_, i) => {
    const a = (i / 84) * Math.PI * 2;
    const r0 = 62 + rand() * 8;
    const r1 = 96 + rand() * 22;
    return { a, r0, r1, o: 0.25 + rand() * 0.6 };
  });
  return (
    <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Defs id="pe" />
      <circle cx={cx} cy={cy} r="170" fill="url(#pe-halo)" />
      <circle cx={cx} cy={cy} r="150" className={styles.hair} />
      <g className={styles.spinSlow}>
        <circle cx={cx} cy={cy} r="132" className={styles.dash} strokeDasharray="2 7" />
      </g>
      <g>
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={cx + Math.cos(t.a) * t.r0}
            y1={cy + Math.sin(t.a) * t.r0}
            x2={cx + Math.cos(t.a) * t.r1}
            y2={cy + Math.sin(t.a) * t.r1}
            className={styles.tick}
            strokeOpacity={t.o}
          />
        ))}
      </g>
      <circle cx={cx} cy={cy} r="54" fill="#05060a" />
      <circle cx={cx} cy={cy} r="54" className={styles.rim} />
      <circle cx={cx} cy={cy} r="30" fill="url(#pe-core)" className={styles.breathe} />
      <g className={styles.spinFast}>
        <path d={`M ${cx} ${cy - 124} A 124 124 0 0 1 ${cx + 107.4} ${cy - 62}`} className={styles.arc} />
      </g>
      <g className={styles.sweep}>
        <line x1={cx - 150} y1={cy} x2={cx + 150} y2={cy} className={styles.scan} />
      </g>
      {[
        [cx - 160, cy - 118],
        [cx + 160, cy - 118],
        [cx - 160, cy + 118],
        [cx + 160, cy + 118],
      ].map(([x, y], i) => (
        <path
          key={i}
          d={`M ${x! + (i % 2 ? -14 : 14)} ${y} H ${x} V ${y! + (i < 2 ? 14 : -14)}`}
          className={styles.bracket}
        />
      ))}
    </svg>
  );
}

/* ── 02 INTELLIGENCE — stars forming a neural network, signals travelling ── */
const NEURAL = (() => {
  const rand = seeded(7);
  const nodes = Array.from({ length: 30 }, () => {
    // Denser toward the centre: a mind, not a grid.
    const a = rand() * Math.PI * 2;
    const d = Math.pow(rand(), 0.7);
    return { x: W / 2 + Math.cos(a) * d * 205, y: H / 2 + Math.sin(a) * d * 150, r: 1.2 + rand() * 2.6 };
  });
  const edges: [number, number][] = [];
  nodes.forEach((n, i) => {
    const near = nodes
      .map((m, j) => ({ j, d: Math.hypot(m.x - n.x, m.y - n.y) }))
      .filter((o) => o.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 3);
    near.forEach(({ j }) => {
      if (!edges.some(([a, b]) => (a === i && b === j) || (a === j && b === i))) edges.push([i, j]);
    });
  });
  return { nodes, edges };
})();

export function IntelligenceVisual() {
  const { nodes, edges } = NEURAL;
  const path = ([a, b]: [number, number]) => `M ${nodes[a]!.x} ${nodes[a]!.y} L ${nodes[b]!.x} ${nodes[b]!.y}`;
  return (
    <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Defs id="in" />
      <ellipse cx={W / 2} cy={H / 2} rx="230" ry="170" fill="url(#in-halo)" />
      {edges.map((e, i) => (
        <path key={i} d={path(e)} className={styles.edge} />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          {n.r > 3 && <circle cx={n.x} cy={n.y} r={n.r * 5} fill="url(#in-core)" opacity="0.45" />}
          <circle
            cx={n.x}
            cy={n.y}
            r={n.r}
            className={n.r > 3 ? `${styles.star} ${styles.twinkle}` : styles.star}
            style={{ animationDelay: `${(i % 7) * 0.6}s` }}
          />
        </g>
      ))}
      <circle cx={W / 2} cy={H / 2} r="16" fill="url(#in-core)" className={styles.breathe} />
      {[0, 5, 11, 17, 23, 29].map((k, i) => {
        const e = edges[k % edges.length]!;
        return <Pulse key={k} d={path(e)} glow="in" dur={2.2 + (i % 3) * 0.6} begin={i * 0.45} />;
      })}
    </svg>
  );
}

/* ── 03 ORCHESTRATION — systems in orbit, handing work to each other ── */
export function OrchestrationVisual() {
  const hub = { x: W / 2, y: H / 2 + 4 };
  const clusters = [
    { x: 104, y: 96, speed: styles.orbitA },
    { x: 380, y: 92, speed: styles.orbitB },
    { x: 118, y: 272, speed: styles.orbitB },
    { x: 366, y: 268, speed: styles.orbitA },
  ];
  const link = (a: { x: number; y: number }, b: { x: number; y: number }, bend: number) => {
    const mx = (a.x + b.x) / 2 + bend;
    const my = (a.y + b.y) / 2 - bend * 0.6;
    return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
  };
  const spokes = clusters.map((c, i) => link(c, hub, i % 2 ? -26 : 26));
  const ring = clusters.map((c, i) => link(c, clusters[(i + 1) % 4]!, 34));
  return (
    <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Defs id="or" />
      <circle cx={hub.x} cy={hub.y} r="150" fill="url(#or-halo)" />
      {ring.map((d, i) => (
        <path key={`r${i}`} d={d} className={`${styles.link} ${styles.flowSlow}`} />
      ))}
      {spokes.map((d, i) => (
        <path key={`s${i}`} d={d} className={`${styles.link} ${styles.flow}`} />
      ))}
      <g className={styles.spinSlow}>
        <circle cx={hub.x} cy={hub.y} r="34" className={styles.dash} strokeDasharray="10 6" />
      </g>
      <circle cx={hub.x} cy={hub.y} r="20" className={styles.rim} />
      <circle cx={hub.x} cy={hub.y} r="12" fill="url(#or-core)" className={styles.breathe} />
      {clusters.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r="26" className={styles.hair} />
          <circle cx={c.x} cy={c.y} r="5" className={styles.star} />
          <g className={c.speed} style={{ transformOrigin: `${c.x}px ${c.y}px` }}>
            {[0, 120, 240].map((deg) => (
              <circle
                key={deg}
                cx={c.x + Math.cos((deg * Math.PI) / 180) * 26}
                cy={c.y + Math.sin((deg * Math.PI) / 180) * 26}
                r="2.2"
                className={styles.satellite}
              />
            ))}
          </g>
        </g>
      ))}
      {spokes.map((d, i) => (
        <Pulse key={`p${i}`} d={d} glow="or" dur={2.6} begin={i * 0.65} r={2.2} />
      ))}
    </svg>
  );
}

/* ── 04 AUTOMATION — lanes of work flowing, merging, fanning out again ── */
export function AutomationVisual() {
  const lanes = Array.from({ length: 7 }, (_, i) => {
    const y0 = 40 + i * 46;
    const y1 = 180 + (i - 3) * 9;
    const y2 = 40 + ((i * 3) % 7) * 46;
    return `M -10 ${y0} C 120 ${y0}, 150 ${y1}, 240 ${y1} S 360 ${y2}, 490 ${y2}`;
  });
  return (
    <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Defs id="au" />
      <ellipse cx="240" cy="180" rx="210" ry="120" fill="url(#au-halo)" />
      {lanes.map((d, i) => (
        <g key={i}>
          <path d={d} className={styles.lane} />
          <path
            d={d}
            className={`${styles.laneFlow} ${i % 2 ? styles.flowSlow : styles.flow}`}
            style={{ animationDelay: `${i * -0.7}s` }}
          />
        </g>
      ))}
      <rect x="226" y="140" width="28" height="80" rx="14" className={styles.rim} />
      <circle cx="240" cy="180" r="10" fill="url(#au-core)" className={styles.breathe} />
      {lanes.map((d, i) => (i % 2 === 0 ? <Pulse key={`p${i}`} d={d} glow="au" dur={3.4 + i * 0.25} begin={i * 0.5} r={2} /> : null))}
    </svg>
  );
}

/* ── 05 EXECUTION — a computational core turning inputs into outcomes ── */
export function ExecutionVisual() {
  const core = { x: 252, y: 180 };
  const inputs = Array.from({ length: 6 }, (_, i) => {
    const y = 30 + i * 60;
    return `M -10 ${y} C 90 ${y}, 150 ${core.y + (y - core.y) * 0.25}, ${core.x - 62} ${core.y}`;
  });
  const outputs = [-44, 0, 44].map((dy) => `M ${core.x + 62} ${core.y + dy * 0.2} L 500 ${core.y + dy * 1.6}`);
  return (
    <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Defs id="ex" />
      <circle cx={core.x} cy={core.y} r="150" fill="url(#ex-halo)" />
      {inputs.map((d, i) => (
        <path key={i} d={d} className={styles.edge} />
      ))}
      {outputs.map((d, i) => (
        <g key={`o${i}`}>
          <path d={d} stroke="url(#ex-beam)" className={styles.beam} />
          <path d={d} className={`${styles.beamFlow} ${styles.flowFast}`} style={{ animationDelay: `${i * -0.4}s` }} />
        </g>
      ))}
      <g className={styles.spinSlow}>
        <circle cx={core.x} cy={core.y} r="58" className={styles.dash} strokeDasharray="3 9" />
      </g>
      <g className={styles.spinReverse}>
        <circle cx={core.x} cy={core.y} r="44" className={styles.dash} strokeDasharray="22 10" />
      </g>
      <circle cx={core.x} cy={core.y} r="30" className={styles.rim} />
      <circle cx={core.x} cy={core.y} r="26" fill="url(#ex-core)" className={styles.breathe} />
      {inputs.map((d, i) => (
        <Pulse key={`p${i}`} d={d} glow="ex" dur={2.4} begin={i * 0.4} r={1.8} />
      ))}
    </svg>
  );
}
