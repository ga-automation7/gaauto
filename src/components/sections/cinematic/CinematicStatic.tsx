/**
 * The film for visitors who prefer reduced motion: the same story as calm,
 * static scenes — no scroll-driven zooms, no WebGL, no smooth scrolling.
 * Offers a clear way to switch to the full experience.
 */
import { CircleArrow } from '@/components/ui/CircleArrow';
import { Logo } from '@/components/ui/Logo';
import { media } from '@/config/media';
import { site } from '@/config/site';
import { setMotionPreference } from '@/lib/device';
import type { MediaAsset } from '@/types/media';
import { content } from '@/services/content';
import { CapabilityCard } from './ui/CapabilityCard';
import styles from './CinematicStatic.module.css';

const services = [...content.services()].sort((a, b) => a.visual.hand - b.visual.hand);

function Plate({ asset, priority }: { asset: MediaAsset; priority?: boolean }) {
  return (
    <picture>
      <source srcSet={asset.image.avif} type="image/avif" />
      <img
        className={styles.plate}
        src={asset.image.webp}
        alt={asset.alt}
        width={asset.width}
        height={asset.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  );
}

export function CinematicStatic() {
  return (
    <div className={styles.film}>
      <section id="chapter-perception" className={styles.scene} aria-label="Perception">
        <Plate asset={media.heroEye} priority />
        <div className={styles.shade} />
        <div className={styles.center}>
          <h1 className={styles.brand}>
            <Logo size="xl" wordmarkOnly />
          </h1>
          <p className={styles.lockup}>
            <span className={styles.bold}>Look</span>
            <span className={styles.serif}>closer</span>
          </p>
          <button type="button" className={styles.play} onClick={() => setMotionPreference('full')}>
            <CircleArrow decorative direction="right" size="sm" />
            <span>Play the full experience</span>
          </button>
          <p className={styles.note}>Motion is reduced to match your system setting.</p>
        </div>
      </section>

      <section id="chapter-city" className={styles.scene} aria-labelledby="static-city">
        <Plate asset={media.film} />
        <div className={styles.shade} />
        <div className={`container ${styles.caption}`}>
          <p className="t-kicker">The world is moving — faster, every day</p>
          <h2 id="static-city" className={styles.lockupStart}>
            <span className={styles.bold}>AI isn&rsquo;t coming.</span>
            <span className={styles.serif}>It&rsquo;s already here.</span>
          </h2>
          <p className={`${styles.support} t-lead`}>
            The question is: what will you build with it? GA Automations builds intelligent systems — AI
            automation, AI systems, intelligent web and workflow engineering — built for what&rsquo;s next.
          </p>
        </div>
      </section>

      <section id="chapter-intelligence" className={styles.scene} aria-labelledby="static-intelligence">
        <Plate asset={media.cosmicEntity} />
        <div className={styles.shade} />
        <div className={`container ${styles.captionCenter}`}>
          <p className="t-kicker">Intelligence</p>
          <h2 id="static-intelligence" className={styles.lockup}>
            <span className={styles.bold}>One intelligence</span>
            <span className={styles.serif}>six hands</span>
          </h2>
          <p className={`${styles.support} t-lead`}>
            Every system we build is one hand of the same intelligence.
          </p>
        </div>
      </section>

      <section id="chapter-capabilities" className={styles.capabilities} aria-label="Capabilities">
        <div className={`container ${styles.grid}`}>
          {services.map((s) => (
            <CapabilityCard key={s.id} service={s} total={services.length} className={styles.card} />
          ))}
        </div>
      </section>

      <section id="chapter-identity" className={styles.identity} aria-label={site.name}>
        <p className={styles.identityBrand}>{site.wordmark}</p>
        <p className={styles.identitySerif}>{site.philosophy[0]}</p>
        <p className={styles.identityBold}>{site.philosophy[1]}</p>
      </section>
    </div>
  );
}
