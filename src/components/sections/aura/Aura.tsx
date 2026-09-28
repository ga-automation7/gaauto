/**
 * 08 — DEVELOPMENTS: AURA
 * The one project on show: AURA, a public-interest AI legal assistant for
 * India, in development. AURA's character is its orb — living light in glass —
 * set in a celestial field with the name itself as architecture behind it.
 * An illustrative conversation plays once when it comes into view; the orb
 * brightens and quickens while AURA "speaks", and when you hover it.
 */
import { useEffect, useRef, useState } from 'react';
import { CircleArrow } from '@/components/ui/CircleArrow';
import { AuraOrb } from '@/lib/canvas/AuraOrb';
import { NeuralStars } from '@/lib/canvas/NeuralStars';
import { getDeviceProfile } from '@/lib/device';
import { gsap } from '@/lib/gsap';
import { env } from '@/config/env';
import { useParallax } from '@/hooks/useParallax';
import { useReveal } from '@/hooks/useReveal';
import { useVisibleCanvas } from '@/hooks/useVisibleCanvas';
import styles from './Aura.module.css';

const PLANNED = [
  'Explain Indian law in plain language',
  'Answer in English, Hindi and regional languages',
  'Help draft notices, complaints and RTI applications',
  'Know its limits — and point you to a lawyer when you need one',
];

const QUESTION = 'My landlord hasn’t returned my security deposit after I moved out. What can I do?';
const ANSWER =
  'You can start with a written notice asking for the deposit back by a specific date. Keep your rent agreement, payment receipts and move-out records ready — they matter if you need to take it further. I can help you draft the notice now.';

const FOLLOW = `mailto:${env.contactEmail}?subject=${encodeURIComponent('AURA — keep me posted')}`;

export function Aura() {
  const sectionRef = useRef<HTMLElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLSpanElement>(null);
  const energy = useRef(0.3);
  const hovering = useRef(false);
  // Reduced motion: the conversation is simply there, complete.
  const [phase, setPhase] = useState<'idle' | 'asking' | 'thinking' | 'speaking' | 'done'>(() =>
    getDeviceProfile().reducedMotion ? 'done' : 'idle',
  );
  const copyRef = useReveal<HTMLDivElement>('top 75%');
  useParallax(sectionRef);

  // The celestial field behind everything (no network lines here: open sky).
  useVisibleCanvas(
    skyRef,
    (canvas) => {
      const device = getDeviceProfile();
      return new NeuralStars(canvas, {
        dpr: 1,
        count: device.isMobile ? 110 : 220,
        links: false,
        signals: 0,
        focus: { x: 0.36, y: 0.5 },
      });
    },
    (sky, time, dt) => sky.render(time, dt, 0),
    styles.canvas,
  );

  // AURA's orb.
  useVisibleCanvas(
    orbRef,
    (canvas) => new AuraOrb(canvas, { dpr: Math.min(getDeviceProfile().dpr, 2) }),
    (orb, _time, dt) => orb.render(dt, Math.max(energy.current, hovering.current ? 0.72 : 0)),
    styles.canvas,
  );

  // The illustrative conversation: plays once, when it comes into view.
  useEffect(() => {
    const chat = chatRef.current;
    const answer = answerRef.current;
    if (!chat || !answer) return;
    if (getDeviceProfile().reducedMotion) {
      answer.textContent = ANSWER;
      return;
    }
    let tl: gsap.core.Timeline | null = null;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting || tl) return;
        const typed = { n: 0 };
        tl = gsap
          .timeline()
          .call(() => setPhase('asking'))
          .call(() => {
            setPhase('thinking');
            energy.current = 0.6;
          }, [], 1.1)
          .call(() => {
            setPhase('speaking');
            energy.current = 0.95;
          }, [], 2.3)
          .to(
            typed,
            {
              n: ANSWER.length,
              duration: ANSWER.length / 55,
              ease: 'none',
              onUpdate: () => {
                answer.textContent = ANSWER.slice(0, Math.round(typed.n));
              },
            },
            2.3,
          )
          .call(() => {
            setPhase('done');
            energy.current = 0.3;
          });
        io.disconnect();
      },
      { threshold: 0.55 },
    );
    io.observe(chat);
    return () => {
      io.disconnect();
      tl?.kill();
      energy.current = 0.3;
    };
  }, []);

  return (
    <section ref={sectionRef} id="aura" className={styles.section} aria-labelledby="aura-title">
      <div ref={skyRef} className={styles.sky} aria-hidden="true" />
      <div className={styles.nebula} data-speed="0.8" aria-hidden="true" />
      <p className={styles.word} data-speed="0.7" aria-hidden="true">
        AURA
      </p>

      <div className={`container ${styles.layout}`}>
        <div
          className={styles.stage}
          onPointerEnter={() => (hovering.current = true)}
          onPointerLeave={() => (hovering.current = false)}
        >
          <div ref={orbRef} className={styles.orb} role="img" aria-label="AURA's orb — a sphere of moving blue light" />
          <p className={styles.orbMeta} aria-hidden="true">
            <span>AURA</span>
            <span data-phase={phase}>
              {phase === 'thinking' ? 'Thinking' : phase === 'speaking' ? 'Speaking' : 'Listening'}
            </span>
          </p>
        </div>

        <div ref={copyRef} className={styles.copy}>
          <p className={styles.kicker} data-reveal="up">
            <span className="t-num">08</span>
            <span className={styles.rule} data-reveal="line" />
            <span>Developments</span>
          </p>
          <div className={styles.tags} data-reveal="up">
            <span className={styles.tag}>Public-interest project</span>
            <span className={`${styles.tag} ${styles.live}`}>
              <i aria-hidden="true" /> In development
            </span>
          </div>
          <h2 id="aura-title" className={styles.lockup}>
            <span className={styles.bold} data-reveal="lines">
              AURA
            </span>
            <span className={styles.serif} data-reveal="lines">
              the law, in plain words
            </span>
          </h2>
          <p className={`${styles.lead} t-lead`} data-reveal="up">
            An AI legal assistant for India. AURA is being built to help anyone understand their rights, make sense of
            legal documents and take the right next step — in the language they are most comfortable with.
          </p>

          <div className={styles.planned} data-reveal="up">
            <p className="t-label">What AURA is being built to do</p>
            <ol>
              {PLANNED.map((p, i) => (
                <li key={p}>
                  <span className="t-num">{String(i + 1).padStart(2, '0')}</span>
                  {p}
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.actions} data-reveal="up">
            <a className={styles.cta} href={FOLLOW}>
              <CircleArrow decorative size="sm" />
              <span>Follow AURA’s progress</span>
            </a>
            <p className={styles.note}>AURA will provide legal information, not legal advice.</p>
          </div>
        </div>

        <div ref={chatRef} className={styles.chat} data-phase={phase} data-speed="1.06">
          <p className={styles.chatMeta}>
            <span>AURA · preview</span>
            <span>EN · हिं</span>
          </p>
          <div className={styles.msgUser}>{QUESTION}</div>
          <div className={styles.msgAura}>
            <span className={styles.dot} aria-hidden="true" />
            <p>
              <span className="sr-only">{ANSWER}</span>
              <span ref={answerRef} aria-hidden="true" />
              {phase === 'thinking' && <span className={styles.typing} aria-hidden="true" />}
            </p>
          </div>
          <p className={styles.chatNote}>Illustrative preview — AURA is in development.</p>
        </div>
      </div>
    </section>
  );
}
