/**
 * 05 — WHAT WE BUILD
 * The six capabilities as an interactive index. One row is open at a time;
 * the cinematic hand cards deep-link here (#service-<id>) and open their row.
 */
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { CircleArrow } from '@/components/ui/CircleArrow';
import { Glyph } from '@/components/ui/Glyph';
import { SectionHeading } from '@/components/common/SectionHeading';
import { useReveal } from '@/hooks/useReveal';
import { content } from '@/services/content';
import { scrollToTarget } from '@/lib/smoothScroll';
import styles from './WhatWeBuild.module.css';

const services = content.services();

export function WhatWeBuild() {
  const [open, setOpen] = useState(services[0]?.id ?? '');
  const ref = useReveal<HTMLElement>();
  const listRef = useRef<HTMLOListElement>(null);

  // Deep links from the cinematic cards: #service-<id> opens that row.
  useEffect(() => {
    const openFromHash = () => {
      const id = window.location.hash.replace('#service-', '');
      if (services.some((s) => s.id === id)) setOpen(id);
    };
    openFromHash();
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#service-"]');
      if (a) setOpen(a.getAttribute('href')!.replace('#service-', ''));
    };
    window.addEventListener('hashchange', openFromHash);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('hashchange', openFromHash);
      document.removeEventListener('click', onClick);
    };
  }, []);

  // Cursor spotlight (CSS variables, no re-render).
  const onMove = (e: PointerEvent<HTMLOListElement>) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-row]');
    if (!row) return;
    const r = row.getBoundingClientRect();
    row.style.setProperty('--mx', `${e.clientX - r.left}px`);
    row.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <section ref={ref} id="build" className={styles.section} aria-labelledby="build-title">
      <div className="container">
        <div className={styles.head}>
          <SectionHeading
            id="build-title"
            index="07"
            kicker="What we build"
            bold="Six ways"
            serif="to work smarter"
            lead="Each capability stands on its own — and they are strongest wired together into one system."
          />
        </div>

        <ol ref={listRef} className={styles.list} onPointerMove={onMove}>
          {services.map((s) => {
            const isOpen = open === s.id;
            return (
              <li
                key={s.id}
                id={`service-${s.id}`}
                data-row
                data-open={isOpen}
                data-glyph-host
                className={styles.row}
                style={{ ['--accent' as string]: s.accent }}
              >
                <span className={styles.rule} data-reveal="line" />
                <button
                  type="button"
                  className={styles.trigger}
                  aria-expanded={isOpen}
                  aria-controls={`service-panel-${s.id}`}
                  onClick={() => setOpen(isOpen ? '' : s.id)}
                  data-reveal="up"
                >
                  <span className={`${styles.index} t-num`}>{s.index}</span>
                  <span className={styles.title}>
                    <span className={styles.titleBold}>{s.lockup[0]}</span>{' '}
                    <span className={styles.titleSerif}>{s.lockup[1]}</span>
                  </span>
                  <span className={styles.short}>{s.shortDescription}</span>
                  <span className={styles.glyph} data-active={isOpen}>
                    <Glyph name={s.icon} />
                  </span>
                  <span className={styles.toggle} aria-hidden="true" />
                </button>
                <div id={`service-panel-${s.id}`} className={styles.panel} role="region" aria-label={s.title}>
                  <div className={styles.panelInner}>
                    <div className={styles.overview}>
                      <p className={styles.description}>{s.description}</p>
                      <p className={styles.ideal}>
                        <span className="t-label">Ideal for</span>
                        {s.idealFor}
                      </p>
                      <aside className={styles.field}>
                        <p className={styles.fieldLabel}>About the field</p>
                        <p className={styles.fieldText}>{s.field}</p>
                      </aside>
                    </div>

                    <div className={styles.details}>
                      <div>
                        <p className="t-label">How we deliver</p>
                        <ol className={styles.steps}>
                          {s.approach.map((step, i) => (
                            <li key={step.title}>
                              <span className={`${styles.stepIndex} t-num`}>{String(i + 1).padStart(2, '0')}</span>
                              <span className={styles.stepTitle}>{step.title}</span>
                              <span className={styles.stepText}>{step.text}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className={styles.pair}>
                        <div>
                          <p className="t-label">What you get</p>
                          <ul className={styles.items}>
                            {s.deliverables.map((d) => (
                              <li key={d}>{d}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="t-label">Where it fits</p>
                          <ul className={styles.items}>
                            {s.useCases.map((u) => (
                              <li key={u}>{u}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className={styles.pair}>
                        <div>
                          <p className="t-label">Capabilities</p>
                          <ul className={styles.chips}>
                            {s.capabilities.map((c) => (
                              <li key={c}>{c}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="t-label">Under the hood</p>
                          <ul className={`${styles.chips} ${styles.mono}`}>
                            {s.stack.map((t) => (
                              <li key={t}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    <a
                      className={styles.cta}
                      href="#contact"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToTarget('#contact', { duration: 2.2 });
                      }}
                    >
                      <CircleArrow decorative size="sm" />
                      <span>Talk about {s.title.toLowerCase()}</span>
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
          <li className={styles.endRule} data-reveal="line" aria-hidden="true" />
        </ol>
      </div>
    </section>
  );
}
