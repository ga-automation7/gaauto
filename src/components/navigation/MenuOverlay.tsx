import { useEffect, useRef } from 'react';
import { navigation, site } from '@/config/site';
import { lockScroll, scrollToTarget, unlockScroll } from '@/lib/smoothScroll';
import styles from './MenuOverlay.module.css';

/** Full-screen index. Items read as heavy grotesk and turn to hairline italic on hover. */
export function MenuOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    lockScroll();
    const first = panelRef.current?.querySelector<HTMLElement>('a, button');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = [...panelRef.current.querySelectorAll<HTMLElement>('a, button')];
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl?.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      unlockScroll();
    };
  }, [open, onClose]);

  const go = (href: string) => {
    onClose();
    // Let the overlay start closing, then travel.
    window.setTimeout(() => scrollToTarget(href, { duration: 2.2 }), 120);
  };

  return (
    <div
      id="site-menu"
      ref={panelRef}
      className={styles.overlay}
      data-open={open}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      aria-hidden={!open}
      inert={!open}
    >
      <nav className={styles.nav} aria-label="Primary">
        <ol>
          {navigation.map((item, i) => (
            <li key={item.id} style={{ ['--i' as string]: i }}>
              <a
                href={item.href}
                className={styles.link}
                onClick={(e) => {
                  e.preventDefault();
                  go(item.href);
                }}
              >
                <span className={`${styles.index} t-num`}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.label} data-text={item.label}>
                  {item.label}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className={styles.aside}>
        <p className="t-label">Get in touch</p>
        <a className={styles.mail} href={`mailto:${site.contact.email}`}>
          {site.contact.email}
        </a>
        <p className={styles.tagline}>{site.tagline}</p>
      </div>
    </div>
  );
}
