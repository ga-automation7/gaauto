import { useEffect } from 'react';

/**
 * Global pointer position, normalized to [-1, 1] from the viewport centre.
 * Stored in a module-level object (no React state) — read it in render loops.
 */
export const pointer = { x: 0, y: 0, clientX: -9999, clientY: -9999, active: false };

let subscribers = 0;
const onMove = (e: PointerEvent) => {
  if (e.pointerType === 'touch') return;
  pointer.clientX = e.clientX;
  pointer.clientY = e.clientY;
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  pointer.active = true;
};
const onLeave = () => {
  pointer.active = false;
};

export function usePointerTracking(): typeof pointer {
  useEffect(() => {
    if (subscribers++ === 0) {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
    }
    return () => {
      if (--subscribers === 0) {
        window.removeEventListener('pointermove', onMove);
        document.documentElement.removeEventListener('pointerleave', onLeave);
      }
    };
  }, []);
  return pointer;
}
