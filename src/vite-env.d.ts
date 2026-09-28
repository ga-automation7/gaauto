/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  readonly VITE_CONTACT_EMAIL?: string;
  readonly VITE_WHATSAPP_NUMBER?: string;
  readonly VITE_CONTACT_ENDPOINT?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ANALYTICS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
