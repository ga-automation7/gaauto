/**
 * The final scene: "Get in touch!" — contact@gaauto.in — a small enquiry
 * composer, and a quiet bottom bar. Submissions go through services/contact.
 */
import { useState, type FormEvent } from 'react';
import { CircleArrow } from '@/components/ui/CircleArrow';
import { navigation, site } from '@/config/site';
import { useMagnetic } from '@/hooks/useMagnetic';
import { useReveal } from '@/hooks/useReveal';
import { getMotionOverride, prefersReducedMotion, setMotionPreference } from '@/lib/device';
import { scrollToTarget } from '@/lib/smoothScroll';
import { track } from '@/services/analytics';
import { content } from '@/services/content';
import { submitInquiry, validateInquiry } from '@/services/contact';
import styles from './Footer.module.css';

const interests = content.services().map((s) => s.title);

export function Footer() {
  const ref = useReveal<HTMLElement>('top 85%');
  const mailRef = useMagnetic<HTMLAnchorElement>({ strength: 0.12, radius: 40 });
  const [picked, setPicked] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ tone: 'idle' | 'error' | 'ok'; text: string }>({ tone: 'idle', text: '' });
  const reduced = prefersReducedMotion();
  const override = getMotionOverride();

  const toggle = (item: string) => setPicked((p) => (p.includes(item) ? p.filter((x) => x !== item) : [...p, item]));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const inquiry = { interests: picked, email, source: 'footer' };
    const invalid = validateInquiry(inquiry);
    if (invalid) {
      setStatus({ tone: 'error', text: invalid });
      return;
    }
    const result = await submitInquiry(inquiry);
    if (result.ok) {
      track({ name: 'inquiry_submit', via: result.via });
      setStatus({
        tone: 'ok',
        text: result.via === 'endpoint' ? 'Received — we will reply within one working day.' : 'Opening your email app with everything filled in…',
      });
    } else setStatus({ tone: 'error', text: result.error });
  };

  return (
    <footer ref={ref} id="contact" className={styles.footer} aria-labelledby="contact-title">
      <div className={styles.glow} aria-hidden="true" />
      <div className={`container ${styles.inner}`}>
        <p className={styles.kicker} data-reveal="up">
          Let&rsquo;s build what comes next
        </p>
        <h2 id="contact-title" className={styles.lockup}>
          <span className={styles.mask}>
            <span className={styles.bold} data-reveal="mask">
              Get in
            </span>
          </span>
          <span className={styles.mask}>
            <span className={styles.serif} data-reveal="mask">
              touch!
            </span>
          </span>
        </h2>

        <a
          ref={mailRef}
          className={styles.mail}
          href={`mailto:${site.contact.email}`}
          onClick={() => track({ name: 'cta_click', location: 'footer-mail' })}
          data-reveal="up"
        >
          <span>{site.contact.email}</span>
          <CircleArrow decorative direction="up-right" size="lg" />
        </a>

        <form className={styles.composer} onSubmit={onSubmit} noValidate data-reveal="up">
          <fieldset className={styles.fieldset}>
            <legend className="t-label">I&rsquo;m interested in</legend>
            <div className={styles.chips}>
              {interests.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={styles.chip}
                  aria-pressed={picked.includes(item)}
                  onClick={() => toggle(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>
          <div className={styles.row}>
            <label className="sr-only" htmlFor="footer-email">
              Your email
            </label>
            <input
              id="footer-email"
              className={styles.input}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className={styles.submit}>
              Start a project
            </button>
          </div>
          <p className={styles.status} data-tone={status.tone} role="status" aria-live="polite">
            {status.text}
          </p>
        </form>

        <div className={styles.bottom}>
          <nav aria-label="Footer" className={styles.links}>
            {navigation
              .filter((n) => n.id !== 'contact')
              .map((n) => (
                <a
                  key={n.id}
                  href={n.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToTarget(n.href, { duration: 2 });
                  }}
                >
                  {n.label}
                </a>
              ))}
          </nav>
          <div className={styles.meta}>
            <button
              type="button"
              className={styles.motion}
              onClick={() => setMotionPreference(reduced ? 'full' : 'reduced')}
              title={override ? 'Using your choice' : 'Following your system setting'}
            >
              Motion: {reduced ? 'reduced' : 'full'}
            </button>
            <span>
              © {site.year} {site.name} · {site.domain}
            </span>
            <a
              href="#main"
              className={styles.top}
              onClick={(e) => {
                e.preventDefault();
                scrollToTarget(0, { duration: 3 });
              }}
            >
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
