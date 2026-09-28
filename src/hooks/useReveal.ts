import { useRef } from 'react';
import { gsap, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap';

/**
 * Reveal children marked with data-reveal as the container scrolls into view.
 *   data-reveal="up"     fade + rise (32px)
 *   data-reveal="mask"   rises from behind its parent's clip (wrap in overflow:clip)
 *   data-reveal="lines"  a heading emerges line by line, each line from behind its own mask
 *   data-reveal="line"   hairline grows from the left
 *   data-reveal="image"  a cinematic visual un-masks while its content settles from 1.06 → 1
 *                        (put data-reveal-inner on the element that should scale)
 * Items reveal in document order with a gentle stagger. Plays once.
 * Reduced motion: everything is simply visible.
 */
export function useReveal<T extends HTMLElement>(start = 'top 80%') {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const items = gsap.utils.toArray<HTMLElement>('[data-reveal]', root);
      if (!items.length) return;
      if (document.documentElement.dataset.motion === 'reduced') {
        gsap.set(items, { clearProps: 'all', opacity: 1 });
        return;
      }
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'reveal', duration: 1.2 } });
      const splits: SplitText[] = [];
      let at = 0;
      for (const el of items) {
        const kind = el.dataset.reveal;
        if (kind === 'lines') {
          // Each line slides up from behind its own mask: type emerging from the page.
          // autoSplit re-splits once the web fonts arrive (or the layout changes) and
          // rebuilds the tween at the same progress, so line breaks are always right.
          const delay = at;
          splits.push(
            SplitText.create(el, {
              type: 'lines',
              mask: 'lines',
              autoSplit: true,
              onSplit: (self) =>
                gsap.from(self.lines, {
                  yPercent: 105,
                  duration: 1.3,
                  stagger: 0.09,
                  delay,
                  ease: 'reveal',
                  scrollTrigger: { trigger: root, start, once: true },
                }),
            }),
          );
          at += 0.08;
        } else if (kind === 'mask') {
          gsap.set(el, { yPercent: 110 });
          tl.to(el, { yPercent: 0 }, at);
          at += 0.07;
        } else if (kind === 'line') {
          gsap.set(el, { scaleX: 0, transformOrigin: '0 50%' });
          tl.to(el, { scaleX: 1, duration: 1.4 }, at + 0.1);
        } else if (kind === 'image') {
          const inner = el.querySelector<HTMLElement>('[data-reveal-inner]');
          gsap.set(el, { clipPath: 'inset(9% 7% 9% 7% round 22px)', autoAlpha: 0 });
          tl.to(el, { clipPath: 'inset(0% 0% 0% 0% round 22px)', autoAlpha: 1, duration: 1.8, ease: 'cinema' }, at);
          // (An inner element on scroll-linked zoom — data-zoom — keeps that instead.)
          if (inner && !inner.hasAttribute('data-zoom'))
            tl.fromTo(inner, { scale: 1.06 }, { scale: 1, duration: 2.2, ease: 'reveal' }, at);
          at += 0.12;
        } else {
          gsap.set(el, { autoAlpha: 0, y: 32 });
          // Hand the element back to CSS afterwards (hover transforms keep working).
          tl.to(el, { autoAlpha: 1, y: 0, duration: 1.1, clearProps: 'transform,opacity,visibility' }, at + 0.12);
          at += 0.06;
        }
      }
      ScrollTrigger.create({ trigger: root, start, once: true, onEnter: () => tl.play() });
      return () => splits.forEach((s) => s.revert());
    },
    { scope: ref },
  );

  return ref;
}
