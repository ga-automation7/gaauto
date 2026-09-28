/**
 * Loading policy helpers.
 *
 *  critical → requested immediately (and preloaded from index.html)
 *  idle     → requested after the window `load` event, when the main thread is idle
 *  near     → requested only when the stage approaches the scene
 */
import type { FilmFootage, MediaAsset, VideoSources } from '@/types/media';
import { getDeviceProfile } from './device';

let idlePromise: Promise<void> | null = null;

export function whenIdle(): Promise<void> {
  if (idlePromise) return idlePromise;
  idlePromise = new Promise<void>((resolve) => {
    const afterLoad = () => {
      const ric = (window as Window & { requestIdleCallback?: typeof requestIdleCallback })
        .requestIdleCallback;
      if (ric) ric(() => resolve(), { timeout: 2500 });
      else window.setTimeout(resolve, 600);
    };
    if (document.readyState === 'complete') afterLoad();
    else window.addEventListener('load', afterLoad, { once: true });
  });
  return idlePromise;
}

/** Decode an image off the critical path so the first painted frame never stalls. */
export async function decodeImage(img: HTMLImageElement): Promise<void> {
  try {
    await img.decode();
  } catch {
    /* decode() rejects for broken or already-displayed images; the load event still covers us */
  }
}

/** The asset's video, if this device will play it — never with reduced motion or Save-Data. */
export function playableVideo(asset: MediaAsset): VideoSources | undefined {
  const device = getDeviceProfile();
  return asset.video && !device.reducedMotion && !device.saveData ? asset.video : undefined;
}

/**
 * The film footage this device should download and scrub, or null: never with
 * reduced motion or Save-Data, and not on low-tier devices (the still is flown
 * instead — scrubbing video needs a capable decoder).
 */
export function footageSource(footage: FilmFootage | undefined): string | null {
  const device = getDeviceProfile();
  if (!footage || device.reducedMotion || device.saveData || device.tier === 'low') return null;
  return device.isMobile ? (footage.mobile ?? footage.desktop) : footage.desktop;
}
