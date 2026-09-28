export type GlyphName = 'star' | 'galaxy' | 'sphere' | 'orbit' | 'crystal' | 'cube';

export interface Service {
  id: string;
  /** Display index, e.g. "01". */
  index: string;
  title: string;
  /** The title split for the editorial lockup: [heavy grotesk, hairline italic]. */
  lockup: [string, string];
  /** One line — used in the cinematic HUD. */
  shortDescription: string;
  /** The full overview — used in "What we build". */
  description: string;
  /** Context on the discipline itself: where the field stands today. */
  field: string;
  /** One line: who it fits best. */
  idealFor: string;
  /** How we deliver it, step by step. */
  approach: { title: string; text: string }[];
  /** What the client receives. */
  deliverables: string[];
  /** Typical building blocks (names mirror the Technology section). */
  stack: string[];
  /** Visual symbol; mirrors the object held by the corresponding cosmic hand. */
  icon: GlyphName;
  /** Which of the entity's six hands carries this capability (0–5, see media.cosmic.anchors.hands). */
  visual: { hand: number };
  capabilities: string[];
  useCases: string[];
  /** Accent colour (hex). */
  accent: string;
}

export type UseCaseCategory = 'Sales' | 'Support' | 'Operations' | 'Data' | 'Web';

export interface UseCase {
  id: string;
  category: UseCaseCategory;
  title: string;
  summary: string;
  /** Trigger → steps → outcome. Rendered as a flow line. */
  flow: string[];
  stack: string[];
  /** Related service ids. */
  services: string[];
}

export interface TechCategory {
  id: string;
  label: string;
  description: string;
  tools: string[];
  accent: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
}
