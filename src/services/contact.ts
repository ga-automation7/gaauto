/**
 * Contact / inquiry service — the site's first backend boundary.
 *
 * Today: if VITE_CONTACT_ENDPOINT is set, inquiries are POSTed there as JSON;
 * otherwise the visitor's email client opens with the message pre-filled.
 * Later: point the endpoint at the GA Automations API (CRM, WhatsApp alerts,
 * AI triage) without touching any UI — see docs/future-backend.md.
 */
import { env } from '@/config/env';
import { postJson } from './http';

export interface Inquiry {
  interests: string[];
  email: string;
  message?: string;
  /** Where on the site the inquiry started (for attribution). */
  source: string;
}

export type InquiryResult = { ok: true; via: 'endpoint' | 'email' } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateInquiry(inquiry: Inquiry): string | null {
  if (!EMAIL_RE.test(inquiry.email.trim())) return 'Please enter a valid email address.';
  if (!inquiry.interests.length && !inquiry.message?.trim()) return 'Tell us a little about what you want to build.';
  return null;
}

export function buildMailto(inquiry: Inquiry): string {
  const subject = inquiry.interests.length
    ? `Project enquiry — ${inquiry.interests.join(', ')}`
    : 'Project enquiry — GA Automations';
  const body = [
    inquiry.message?.trim() || 'Hi GA Automations, I would like to talk about a project.',
    '',
    inquiry.interests.length ? `Interested in: ${inquiry.interests.join(', ')}` : '',
    `Reply to: ${inquiry.email.trim()}`,
  ]
    .filter(Boolean)
    .join('\n');
  return `mailto:${env.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function submitInquiry(inquiry: Inquiry): Promise<InquiryResult> {
  const invalid = validateInquiry(inquiry);
  if (invalid) return { ok: false, error: invalid };

  if (env.contactEndpoint) {
    try {
      await postJson(env.contactEndpoint, { ...inquiry, email: inquiry.email.trim(), submittedAt: new Date().toISOString() });
      return { ok: true, via: 'endpoint' };
    } catch {
      // Fall through to email so a lead is never lost to a network error.
    }
  }
  window.location.href = buildMailto(inquiry);
  return { ok: true, via: 'email' };
}
