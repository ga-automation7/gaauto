/**
 * Tiny observable size store. Resize work is coalesced into one notification per
 * frame and never triggers React re-renders — subscribers write to the DOM/GL directly.
 */
export interface Size {
  width: number;
  height: number;
}

export interface SizeStore {
  get: () => Size;
  set: (width: number, height: number) => void;
  subscribe: (fn: (size: Size) => void) => () => void;
}

export function createSizeStore(initial: Size = { width: 1, height: 1 }): SizeStore {
  let size = initial;
  let pending = false;
  const listeners = new Set<(size: Size) => void>();
  return {
    get: () => size,
    set(width, height) {
      if (width === size.width && height === size.height) return;
      size = { width, height };
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        for (const fn of listeners) fn(size);
      });
    },
    subscribe(fn) {
      listeners.add(fn);
      fn(size);
      return () => listeners.delete(fn);
    },
  };
}
