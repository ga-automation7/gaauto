/**
 * Analytics facade. A no-op until a provider is chosen; components call
 * `track()` today and nothing else changes when a real provider is wired in.
 * Only browser-safe keys may ever be used here (see .env.example).
 */
import { env } from '@/config/env';

export type AnalyticsEvent =
  | { name: 'chapter_view'; chapter: string }
  | { name: 'capability_view'; service: string }
  | { name: 'cta_click'; location: string }
  | { name: 'inquiry_submit'; via: 'endpoint' | 'email' };

export function track(event: AnalyticsEvent): void {
  if (!env.analyticsKey) {
    if (env.isDev) console.debug('[analytics]', event);
    return;
  }
  // Provider integration goes here (e.g. a privacy-friendly, cookieless tool).
}
