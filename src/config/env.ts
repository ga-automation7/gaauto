/**
 * Typed access to public (browser-safe) environment variables.
 * Only VITE_* variables are available here. Never store secrets in them —
 * anything in this file ships to every visitor. See .env.example.
 */
const read = (value: string | undefined, fallback = ''): string => (value ?? '').trim() || fallback;

export const env = {
  siteUrl: read(import.meta.env.VITE_SITE_URL, 'https://gaauto.in'),
  contactEmail: read(import.meta.env.VITE_CONTACT_EMAIL, 'contact@gaauto.in'),
  whatsappNumber: read(import.meta.env.VITE_WHATSAPP_NUMBER),
  contactEndpoint: read(import.meta.env.VITE_CONTACT_ENDPOINT),
  apiBaseUrl: read(import.meta.env.VITE_API_BASE_URL),
  analyticsKey: read(import.meta.env.VITE_ANALYTICS_KEY),
  isDev: import.meta.env.DEV,
} as const;
