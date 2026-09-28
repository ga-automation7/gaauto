import { env } from './env';
import type { NavItem } from '@/types/content';

export const site = {
  name: 'GA Automations',
  wordmark: 'GA AUTOMATIONS',
  domain: 'gaauto.in',
  url: env.siteUrl,
  tagline: 'We build intelligent systems.',
  philosophy: ["We don't just build websites.", 'We build intelligent systems.'],
  description:
    'GA Automations builds AI automation, AI agents, custom-coded websites and business workflow systems that replace repetitive manual work with intelligent digital systems.',
  contact: {
    email: env.contactEmail,
    whatsapp: env.whatsappNumber ? `https://wa.me/${env.whatsappNumber}` : null,
  },
  year: new Date().getFullYear(),
} as const;

/**
 * Primary navigation. Hash targets are real element ids; chapters inside the
 * cinematic stage get invisible anchors at their scroll offsets (see CinematicStage).
 */
export const navigation: NavItem[] = [
  { id: 'capabilities', label: 'Capabilities', href: '#chapter-capabilities' },
  { id: 'about', label: 'Manifesto', href: '#about' },
  { id: 'journal', label: 'The system', href: '#journal' },
  { id: 'systems', label: 'In action', href: '#systems' },
  { id: 'technology', label: 'Technology', href: '#technology' },
  { id: 'use-cases', label: 'Use cases', href: '#use-cases' },
  { id: 'build', label: 'What we build', href: '#build' },
  { id: 'aura', label: 'AURA', href: '#aura' },
  { id: 'space', label: 'Event horizon', href: '#space' },
  { id: 'contact', label: 'Contact', href: '#contact' },
];
