import { useEffect, useRef, type RefObject } from 'react';
import { getDeviceProfile } from '@/lib/device';
import { useTicker } from './useTicker';

export interface CanvasRenderer {
  resize(cssW: number, cssH: number): void;
}

/**
 * Host a canvas renderer inside `hostRef` and run it only while it is on
 * screen: a fresh canvas per mount, sized with the host (ResizeObserver),
 * started/stopped by visibility (IntersectionObserver) and tab visibility.
 * Reduced motion: one still frame, no loop.
 */
export function useVisibleCanvas<R extends CanvasRenderer>(
  hostRef: RefObject<HTMLElement | null>,
  create: (canvas: HTMLCanvasElement) => R,
  frame: (renderer: R, time: number, dt: number) => void,
  className?: string,
): RefObject<R | null> {
  const rendererRef = useRef<R | null>(null);
  const createRef = useRef(create);
  const frameRef = useRef(frame);
  useEffect(() => {
    createRef.current = create;
    frameRef.current = frame;
  });

  const ticker = useTicker((time, dt) => {
    const r = rendererRef.current;
    if (r) frameRef.current(r, time, dt);
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = document.createElement('canvas');
    if (className) canvas.className = className;
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    let renderer: R;
    try {
      renderer = createRef.current(canvas);
    } catch {
      canvas.remove();
      return;
    }
    rendererRef.current = renderer;
    const still = getDeviceProfile().reducedMotion;
    const resize = () => {
      renderer.resize(host.clientWidth, host.clientHeight);
      if (still) frameRef.current(renderer, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let visible = false;
    const apply = () => {
      if (visible && !still && !document.hidden) ticker.start();
      else ticker.stop();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        visible = !!e?.isIntersecting;
        apply();
      },
      { rootMargin: '8% 0px' },
    );
    io.observe(host);
    document.addEventListener('visibilitychange', apply);
    return () => {
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', apply);
      ticker.stop();
      rendererRef.current = null;
      canvas.remove();
    };
  }, [hostRef, className, ticker]);

  return rendererRef;
}
