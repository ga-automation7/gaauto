/**
 * Fixed header in the poster's corner-metadata language:
 *   wordmark · "Get in touch / contact@…" · section counter · menu
 */
import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { site } from '@/config/site';
import { ScrollTrigger } from '@/lib/gsap';
import { scrollToTarget } from '@/lib/smoothScroll';
import { MenuOverlay } from './MenuOverlay';
import styles from './Header.module.css';

/** Counter stops, in page order. Chapter anchors live inside the cinematic stage. */
const STOPS = [
  'chapter-perception',
  'chapter-city',
  'chapter-intelligence',
  'about',
  'journal',
  'systems',
  'technology',
  'use-cases',
  'build',
  'aura',
  'space',
  'contact',
];

export function Header() {
  const [index, setIndex] = useState(0);
  const [showBrand, setShowBrand] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Wait a frame so every section has mounted and ScrollTrigger has measured.
    let triggers: ScrollTrigger[] = [];
    const id = requestAnimationFrame(() => {
      triggers = STOPS.map((stopId, i) => {
        const el = document.getElementById(stopId);
        if (!el) return null;
        return ScrollTrigger.create({
          trigger: el,
          start: 'top 55%',
          onEnter: () => setIndex(i),
          onLeaveBack: () => setIndex(Math.max(0, i - 1)),
        });
      }).filter((t): t is ScrollTrigger => !!t);
      triggers.push(
        ScrollTrigger.create({
          start: () => window.innerHeight * 0.5,
          end: 'max',
          onToggle: (self) => setShowBrand(self.isActive),
        }),
      );
    });
    return () => {
      cancelAnimationFrame(id);
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return (
    <>
      <header className={styles.header}>
        <a
          href="#main"
          className={styles.brand}
          data-visible={showBrand || menuOpen}
          aria-label="GA Automations — back to top"
          onClick={(e) => {
            e.preventDefault();
            scrollToTarget(0, { duration: 2.4 });
          }}
        >
          <Logo size="sm" wordmarkOnly />
        </a>

        <a
          className={`${styles.touch} t-meta`}
          href="#contact"
          onClick={(e) => {
            e.preventDefault();
            scrollToTarget('#contact', { duration: 2.6 });
          }}
        >
          <span>Get in touch</span>
          <span className="t-meta--dim">{site.contact.email}</span>
        </a>

        <div className={styles.right}>
          <span className={`${styles.counter} t-meta t-num`} aria-hidden="true">
            {String(index + 1).padStart(2, '0')} / {String(STOPS.length).padStart(2, '0')}
          </span>
          <button
            ref={menuButtonRef}
            type="button"
            className={styles.menuButton}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className={styles.bars} data-open={menuOpen} />
          </button>
        </div>
      </header>
      <MenuOverlay
        open={menuOpen}
        onClose={() => {
          setMenuOpen(false);
          menuButtonRef.current?.focus();
        }}
      />
    </>
  );
}
