# Future backend

The site is frontend-first, with clean seams where a backend plugs in. Nothing in the UI talks to a network directly.

## Seams that already exist

| Module                      | Today                                                                                              | Later                                               |
| --------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `src/services/contact.ts`   | POSTs to `VITE_CONTACT_ENDPOINT` if set, otherwise opens a pre-filled email to `contact@gaauto.in` | Point the endpoint at the GA API                    |
| `src/services/content.ts`   | Reads local data files                                                                             | Fetch from a CMS / API, keep the same return shapes |
| `src/services/analytics.ts` | No-op (`track()` logs in dev)                                                                      | Wire a privacy-friendly provider                    |
| `src/services/http.ts`      | `postJson` with timeout and base URL                                                               | Shared client for every API call                    |
| `src/config/env.ts`         | Typed `VITE_*` access                                                                              | —                                                   |

## Environment

`.env.example` documents every variable. **Only browser-safe values may use the `VITE_` prefix** — they are compiled into
the public bundle. API keys for LLMs, CRMs, WhatsApp, payments and databases live only in the backend.

## Suggested backend shape

A small API service (Node/TypeScript or Python) deployed separately (e.g. serverless functions or a container):

```
POST /inquiries          validate → store → CRM contact/deal → notify team (email / WhatsApp / Slack)
                         → optional AI triage (intent, urgency, suggested reply)
POST /webhooks/whatsapp  WhatsApp Business API webhook → AI agent → CRM log
POST /chat               website AI agent (RAG over GA content), streamed responses
GET  /content/*          services, use cases, projects (if moved to a CMS)
```

Inquiry payload sent today (`Inquiry` in `contact.ts`):

```json
{ "interests": ["Workflow Automation"], "email": "name@company.com", "source": "footer", "submittedAt": "…" }
```

Respond `2xx` on success; anything else falls back to the email path so no lead is lost.

## Later features and where they attach

- **Client portal / login** — a separate authenticated app (e.g. `portal.gaauto.in`); link from the menu.
- **AI chatbot on the site** — a lazily loaded widget that talks to `/chat`; add a `services/chat.ts`.
- **Payments** — provider-hosted checkout (Stripe / Razorpay) created server-side; never handle card data in the client.
- **Admin dashboard, lead management, automation engines** — backend-side; the site only needs the endpoints above.

## Security checklist

- No secrets in the client bundle; review `.env*` before every deploy.
- Validate and rate-limit `/inquiries`; add bot protection server-side.
- Set CSP, HSTS and `Referrer-Policy` at the host; the site loads no third-party scripts or fonts.
- Store only what the business needs; document retention.
