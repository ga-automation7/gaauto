import type { ReactNode } from 'react';
import { OrbitDial } from '@/components/ui/OrbitDial';
import styles from './SectionHeading.module.css';

interface SectionHeadingProps {
  index: string;
  kicker: string;
  bold: string;
  serif: string;
  lead?: ReactNode;
  align?: 'start' | 'center';
  id?: string;
}

/** Section title in the house lockup: tracked kicker · heavy grotesk · hairline italic. */
export function SectionHeading({
  index,
  kicker,
  bold,
  serif,
  lead,
  align = 'start',
  id,
}: SectionHeadingProps) {
  return (
    <header className={`${styles.heading} ${styles[align]}`}>
      <p className={styles.kicker} data-reveal="up">
        <span className={`t-num ${styles.index}`}>
          <OrbitDial />
          {index}
        </span>
        <span className={styles.rule} data-reveal="line" />
        <span>{kicker}</span>
      </p>
      <h2 className={styles.lockup} id={id}>
        <span className={styles.mask}>
          <span className={styles.bold} data-reveal="mask">
            {bold}
          </span>
        </span>
        <span className={styles.mask}>
          <span className={styles.serif} data-reveal="mask">
            {serif}
          </span>
        </span>
      </h2>
      {lead && (
        <p className={`${styles.lead} t-lead`} data-reveal="up">
          {lead}
        </p>
      )}
    </header>
  );
}
