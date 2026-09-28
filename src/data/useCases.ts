/**
 * "What we can build" — representative systems, described by how they work.
 * These are capabilities, not client case studies: no results are claimed.
 */
import type { UseCase } from '@/types/content';

export const useCases: UseCase[] = [
  {
    id: 'lead-automation',
    category: 'Sales',
    title: 'Lead automation',
    summary:
      'Every enquiry captured, qualified and routed within seconds, whichever channel it arrives on. Nothing waits in an inbox overnight.',
    flow: ['A form, ad or message arrives', 'AI reads the intent', 'A CRM record is created', 'The right person is told'],
    stack: ['Website forms', 'CRM', 'AI scoring'],
    services: ['ai-automation', 'crm-ops'],
  },
  {
    id: 'support',
    category: 'Support',
    title: 'Customer support agent',
    summary:
      'Answers drawn from your own knowledge base at any hour, with a clean handover to your team whenever a person is needed.',
    flow: ['A customer asks', 'The agent checks your documents', 'It answers or acts', 'It escalates when needed'],
    stack: ['LLM', 'Knowledge base (RAG)', 'Helpdesk'],
    services: ['ai-agents'],
  },
  {
    id: 'whatsapp',
    category: 'Sales',
    title: 'WhatsApp automation',
    summary:
      'Instant replies, catalogues, quotes and reminders on the one channel your customers already open every day.',
    flow: ['A message arrives', 'The intent is understood', 'Reply, quote or booking', 'Logged in your CRM'],
    stack: ['WhatsApp Business API', 'AI agent', 'CRM'],
    services: ['ai-agents', 'workflow'],
  },
  {
    id: 'sales-assistant',
    category: 'Sales',
    title: 'AI sales assistant',
    summary:
      'It drafts proposals, prepares call notes and chases replies, so your team spends its time actually selling.',
    flow: ['A deal changes stage', 'The next step is drafted', 'A rep approves in one click', 'Sent and tracked'],
    stack: ['CRM', 'LLM', 'Email'],
    services: ['ai-agents', 'crm-ops'],
  },
  {
    id: 'appointments',
    category: 'Operations',
    title: 'Appointment systems',
    summary:
      'Bookings, confirmations, reminders and rescheduling, all handled without anyone having to open a calendar.',
    flow: ['A customer picks a slot', 'Calendar and payment in sync', 'Reminders on WhatsApp', 'Missed visits rebooked'],
    stack: ['Calendar', 'Payments', 'WhatsApp'],
    services: ['workflow', 'websites'],
  },
  {
    id: 'internal-workflows',
    category: 'Operations',
    title: 'Internal workflow automation',
    summary:
      'Approvals, onboarding and handovers between teams that simply happen, with a clear record of every step along the way.',
    flow: ['A request is submitted', 'Routed for approval', 'Systems updated', 'Everyone informed'],
    stack: ['Forms', 'Sheets or a database', 'Slack or email'],
    services: ['workflow'],
  },
  {
    id: 'crm-automation',
    category: 'Data',
    title: 'CRM automation',
    summary:
      'Clean, enriched records and pipelines that update themselves, so your CRM finally reflects what is really happening.',
    flow: ['Something happens', 'The record is enriched', 'The stage moves', 'A task is created'],
    stack: ['CRM', 'Enrichment', 'AI'],
    services: ['crm-ops'],
  },
  {
    id: 'websites',
    category: 'Web',
    title: 'Websites that convert',
    summary:
      'Websites and landing pages coded by hand, fast and precise, with every enquiry flowing straight into your systems.',
    flow: ['A visitor lands', 'Clear, fast pages', 'The enquiry is captured', 'Routed automatically'],
    stack: ['Custom code', 'Forms', 'CRM'],
    services: ['websites'],
  },
  {
    id: 'data-processing',
    category: 'Data',
    title: 'Document & data processing',
    summary:
      'Invoices, forms and PDFs read, checked and entered automatically. Your people only ever review the exceptions.',
    flow: ['A document arrives', 'AI extracts the fields', 'Validated and matched', 'Posted to your system'],
    stack: ['Document AI', 'Validation rules', 'Accounting or ERP'],
    services: ['ai-automation', 'custom-ai'],
  },
  {
    id: 'reporting',
    category: 'Data',
    title: 'Automated reporting',
    summary:
      'The numbers you check every week, compiled, explained in plain language and delivered before you think to ask.',
    flow: ['Data collected', 'Metrics calculated', 'AI writes the summary', 'Delivered on schedule'],
    stack: ['Database', 'Dashboards', 'Written summaries'],
    services: ['crm-ops', 'custom-ai'],
  },
];
