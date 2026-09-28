import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';

export type TickFn = (timeSec: number, deltaSec: number) => void;

export interface TickerControl {
  start: () => void;
  stop: () => void;
}

/**
 * Run a callback on the shared GSAP ticker (the site's single rAF loop).
 * Returns start/stop controls so scenes only render while they are active.
 */
export function useTicker(fn: TickFn): TickerControl {
  const fnRef = useRef(fn);
  useLayoutEffect(() => {
    fnRef.current = fn;
  });

  const [control] = useState<TickerControl>(() => {
    let running = false;
    const tick = (time: number, deltaMs: number) => fnRef.current(time, Math.min(deltaMs, 100) / 1000);
    return {
      start() {
        if (running) return;
        running = true;
        gsap.ticker.add(tick);
      },
      stop() {
        if (!running) return;
        running = false;
        gsap.ticker.remove(tick);
      },
    };
  });

  useEffect(() => () => control.stop(), [control]);
  return control;
}
