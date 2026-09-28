/**
 * Sound — a quiet switch for the film's score (lib/audio/Soundscape).
 *
 * Off by default: audio only ever starts from the visitor's own click (browsers
 * require it anyway). The choice is remembered; if it was "on", the score
 * resumes on the visitor's first click or key press of the next visit. While on,
 * the score follows the film: the city's tension, the transformation's light,
 * the being's heartbeat, the arrival — then settles to a quiet bed under the page.
 */
import { useEffect, useRef, useState } from 'react';
import { buildChapterMap, type ChapterMap } from '@/config/cinematic';
import type { Soundscape, SoundScene } from '@/lib/audio/Soundscape';
import { debug } from '@/lib/debug';
import { getDeviceProfile } from '@/lib/device';
import { gsap } from '@/lib/gsap';
import { getScrollState } from '@/lib/smoothScroll';
import { useTicker } from '@/hooks/useTicker';
import styles from './SoundToggle.module.css';

const KEY = 'ga-sound';

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** Piecewise-linear through [position, value] keys. */
const curve = (keys: [number, number][], x: number) => {
  if (x <= keys[0]![0]) return keys[0]![1];
  for (let i = 1; i < keys.length; i++) {
    const [x1, y1] = keys[i]!;
    const [x0, y0] = keys[i - 1]!;
    if (x <= x1) return y0 + (y1 - y0) * ((x - x0) / Math.max(1e-6, x1 - x0));
  }
  return keys[keys.length - 1]![1];
};

/** The score's mood at a stage position (vh) — see config/cinematic.ts for the chapters. */
function sceneAt(pos: number, ch: ChapterMap, speed: number): SoundScene {
  const { intelligence: N, identity: Y } = ch.spans;
  const S = ch.seq;
  return {
    arrival: smooth(S(0.78), S(0.9), pos),
    light: curve(
      [
        [0, 0.3],
        [S(0), 0.2],
        [S(0.58), 0.3],
        [S(0.75), 1],
        [S(0.9), 0.8],
        [N.end, 0.5],
        [Y.start, 0.55],
        [Y.start + Y.length * 0.4, 1],
        [Y.end, 0.6],
        [ch.total + 1.5, 0.3],
      ],
      pos,
    ),
    heart: smooth(S(0.8), S(0.88), pos) * (1 - smooth(Y.end - 0.2, Y.end + 0.8, pos)) * 0.9 + 0.1,
    level: 1 - 0.62 * smooth(ch.total, ch.total + 1.2, pos),
    speed,
  };
}

export function SoundToggle() {
  const [on, setOn] = useState(false);
  const scape = useRef<Soundscape | null>(null);
  const chapters = useRef<ChapterMap | null>(null);
  const frame = useRef(0);

  const ensure = async (): Promise<Soundscape | null> => {
    if (scape.current) return scape.current;
    const { Soundscape: Ctor } = await import('@/lib/audio/Soundscape');
    if (!Ctor.supported()) return null;
    const s = new Ctor();
    s.clock = () => gsap.ticker.time;
    scape.current = s;
    if (debug.enabled) Object.assign(window, { __sound: s });
    return s;
  };

  const start = async () => {
    const s = await ensure();
    if (!s) return;
    await s.start();
    setOn(true);
  };

  const toggle = () => {
    if (on) {
      scape.current?.stop();
      setOn(false);
      try {
        localStorage.setItem(KEY, 'off');
      } catch {
        /* storage unavailable */
      }
      return;
    }
    void start();
    try {
      localStorage.setItem(KEY, 'on');
    } catch {
      /* storage unavailable */
    }
  };

  // Chosen "on" last time: resume on the first click / key press (a real gesture).
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch {
      /* storage unavailable */
    }
    if (stored !== 'on') return;
    const resume = (e: Event) => {
      if ((e.target as Element | null)?.closest?.('[data-sound-toggle]')) return; // the button handles itself
      void start();
      remove();
    };
    const remove = () => {
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
    };
    window.addEventListener('pointerdown', resume);
    window.addEventListener('keydown', resume);
    return remove;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pause with the tab; release everything on unmount.
  useEffect(() => {
    const vis = () => scape.current?.setHidden(document.hidden);
    document.addEventListener('visibilitychange', vis);
    return () => {
      document.removeEventListener('visibilitychange', vis);
      scape.current?.destroy();
      scape.current = null;
    };
  }, []);

  // Follow the film (a few times a second is plenty for slow parameter ramps).
  const ticker = useTicker(() => {
    const s = scape.current;
    if (!s || frame.current++ % 4) return;
    chapters.current ??= buildChapterMap(getDeviceProfile().isMobile);
    const film = document.getElementById('film');
    const { y, velocity } = getScrollState();
    const pos = film ? (y - film.offsetTop) / window.innerHeight : chapters.current.total + 2;
    s.setScene(sceneAt(pos, chapters.current, velocity));
  });
  useEffect(() => {
    if (on) ticker.start();
    else ticker.stop();
  }, [on, ticker]);

  return (
    <button
      type="button"
      data-sound-toggle
      className={styles.toggle}
      data-on={on}
      aria-pressed={on}
      aria-label={on ? 'Turn sound off' : 'Turn sound on'}
      onClick={toggle}
    >
      <span className={styles.bars} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className={styles.label}>Sound {on ? 'on' : 'off'}</span>
    </button>
  );
}
