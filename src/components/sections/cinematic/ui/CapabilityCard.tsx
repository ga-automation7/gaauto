import { CircleArrow } from '@/components/ui/CircleArrow';
import { Glyph } from '@/components/ui/Glyph';
import { scrollToTarget } from '@/lib/smoothScroll';
import type { Service } from '@/types/content';
import styles from './CapabilityCard.module.css';

/**
 * A capability as a small poster in the site's lockup language, lit by the
 * object its hand holds. Shared by the cinematic HUD and the static film.
 */
export function CapabilityCard({ service, total, className }: { service: Service; total: number; className?: string }) {
  return (
    <div
      className={`${styles.card} ${className ?? ''}`}
      data-glyph-host
      data-active="true"
      style={{ ['--accent' as string]: service.accent }}
    >
      <span className={styles.aura} aria-hidden="true" />
      <div className={styles.head}>
        <p className={styles.kicker}>Capability {service.index}</p>
        <span className={styles.glyph}>
          <Glyph name={service.icon} live />
        </span>
      </div>
      <h3 className={styles.title}>
        <span className={styles.titleBold}>{service.lockup[0]}</span>
        <span className={styles.titleSerif}>{service.lockup[1]}</span>
      </h3>
      <p className={styles.desc}>{service.shortDescription}</p>
      <ol className={styles.caps}>
        {service.capabilities.slice(0, 3).map((c, i) => (
          <li key={c}>
            <span>{c}</span>
            <span className={`${styles.capIndex} t-num`}>{String(i + 1).padStart(2, '0')}</span>
          </li>
        ))}
      </ol>
      <div className={styles.foot}>
        <a
          className={styles.explore}
          href={`#service-${service.id}`}
          onClick={(e) => {
            e.preventDefault();
            scrollToTarget(`#service-${service.id}`, { offset: -120, duration: 2 });
          }}
        >
          <CircleArrow decorative size="sm" />
          <span>Explore</span>
        </a>
        <span className={`${styles.count} t-num`}>
          {service.index}
          <span> / {String(total).padStart(2, '0')}</span>
        </span>
      </div>
    </div>
  );
}
