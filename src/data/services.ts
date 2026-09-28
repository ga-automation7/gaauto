/**
 * GA Automations capabilities — the single source for the cinematic HUD
 * (one per cosmic hand) and the "What we build" section.
 *
 * To add/edit a service: change this array. `visual.hand` picks which of the
 * entity's six hands carries it (0–5, see media.cosmicEntity.anchors.arms).
 * `icon` is the line glyph mirroring the object that hand holds. `stack`
 * names should match the Technology section (src/data/technology.ts).
 * Ready to be replaced by a CMS/API later — see src/services/content.ts.
 */
import type { Service } from '@/types/content';

export const services: Service[] = [
  {
    id: 'ai-automation',
    index: '01',
    title: 'AI Automation',
    lockup: ['AI', 'Automation'],
    shortDescription: 'Repetitive work, handled by intelligent systems that never clock out.',
    description:
      'Most teams lose hours every week to work that follows the same pattern: reading documents, re-typing data, chasing follow-ups, routing requests to the right person. We identify those patterns, measure where the time goes, and replace them with AI-powered automations that run quietly in the background — accurate, auditable and always on. People stay in the loop wherever judgement, approval or a personal touch matters.',
    field:
      'AI automation has moved beyond rigid, rule-based scripts. Modern language and vision models can read unstructured input — emails, PDFs, scanned forms, images — much as a person would, so processes that were once too messy to automate can now be handled end to end.',
    idealFor: 'Operations, finance and admin teams handling high volumes of repetitive, document-heavy work.',
    approach: [
      { title: 'Discover', text: 'We map the process step by step and find where manual effort, delays and errors concentrate.' },
      { title: 'Design', text: 'We decide what the system handles, where a person reviews, and how exceptions are caught.' },
      { title: 'Build & integrate', text: 'We build the automation and connect it to your inboxes, drives, sheets and business tools.' },
      { title: 'Run & refine', text: 'We monitor accuracy and throughput after launch, and tune the system as volumes grow.' },
    ],
    deliverables: [
      'A production automation, documented end to end',
      'Human review for sensitive decisions',
      'Logging, alerts and error recovery',
      'Handover and training for your team',
    ],
    icon: 'star',
    visual: { hand: 0 },
    capabilities: ['Document & email processing', 'AI data extraction', 'Smart triage & routing', 'Scheduled and event-driven jobs'],
    useCases: ['Invoices and forms processed on arrival', 'Inbound email summarised and routed', 'Reports compiled without copy-paste'],
    stack: ['OpenAI', 'Claude', 'n8n', 'Python', 'Google Workspace'],
    accent: '#5b8cff',
  },
  {
    id: 'ai-agents',
    index: '02',
    title: 'AI Agents & Chatbots',
    lockup: ['AI Agents', '& Chatbots'],
    shortDescription: 'Assistants that understand, decide and act — on your site, on WhatsApp, inside your tools.',
    description:
      'An AI agent is more than a chatbot: it understands what a person is asking, finds the right information, takes action in your systems and knows when to hand over to a human. We design agents around your business knowledge and processes, deploy them where your customers and team already are — your website, WhatsApp, internal tools — and keep them accurate with grounding, guardrails and ongoing evaluation.',
    field:
      'Conversational AI has shifted from scripted decision trees to agents built on large language models that reason, use tools and retrieve knowledge. The difference between a demo and a dependable agent is engineering: grounding answers in trusted sources, constraining what it can do, and measuring quality over time.',
    idealFor: 'Businesses answering repetitive questions, enquiries or bookings across the web and WhatsApp.',
    approach: [
      { title: 'Define the role', text: 'What the agent handles, what it must never do, and when it escalates to a person.' },
      { title: 'Ground it', text: 'We connect it to your knowledge — documents, FAQs, product data — so its answers stay accurate.' },
      { title: 'Connect it', text: 'Calendars, CRM and order systems, so it can book, qualify and update — not only reply.' },
      { title: 'Evaluate & improve', text: 'We test against real conversations and review transcripts to keep quality rising.' },
    ],
    deliverables: [
      'An agent live on your website, WhatsApp or internal tools',
      'A curated knowledge base it answers from',
      'Hand-over to your team with full context',
      'Conversation analytics and review',
    ],
    icon: 'galaxy',
    visual: { hand: 1 },
    capabilities: ['Website & WhatsApp agents', 'Knowledge-grounded answers (RAG)', 'Lead qualification & booking', 'Human hand-off & escalation'],
    useCases: ['24/7 customer support', 'AI sales assistant', 'Internal knowledge assistant'],
    stack: ['Claude', 'OpenAI', 'RAG', 'Tool calling', 'WhatsApp'],
    accent: '#8b6bff',
  },
  {
    id: 'websites',
    index: '03',
    title: 'Websites & Web Pages',
    lockup: ['Websites', '& Web Pages'],
    shortDescription: 'Custom-coded websites and web pages — fast, precise and built to convert.',
    description:
      'Your website is often the first part of your business a customer meets. We design and hand-code websites and web pages from scratch — no templates, no page builders — so every page is fast, accessible and precisely on brand. Then we wire them into the rest of your system: forms flow straight into your CRM, enquiries trigger automations, and analytics show what is working.',
    field:
      'Speed, accessibility and search visibility now decide how a page ranks and whether it converts. Custom code gives full control over all three, where template builders trade them away for convenience.',
    idealFor: 'Companies that need their website to work as a sales channel, not a brochure.',
    approach: [
      { title: 'Strategy & structure', text: 'Goals, audience and the path each page needs to lead a visitor along.' },
      { title: 'Design', text: 'A distinct visual direction and interface, designed for every screen size.' },
      { title: 'Engineering', text: 'Hand-written, performance-first code — optimised media, clean markup, fast loads.' },
      { title: 'Launch & connect', text: 'Search foundations, analytics, and forms wired to your CRM and automations.' },
    ],
    deliverables: [
      'A custom-coded, responsive website or landing page',
      'Technical SEO and performance optimisation',
      'Forms and enquiries connected to your CRM',
      'Analytics and a clear editing workflow',
    ],
    icon: 'sphere',
    visual: { hand: 2 },
    capabilities: ['Custom-coded websites', 'Landing & campaign pages', 'Responsive, fast & SEO-ready', 'Forms wired to your CRM'],
    useCases: ['Company websites', 'Product and campaign landing pages', 'Booking and enquiry pages'],
    stack: ['React', 'TypeScript', 'Next.js', 'GSAP', 'WebGL'],
    accent: '#6fd8ff',
  },
  {
    id: 'workflow',
    index: '04',
    title: 'Workflow Automation',
    lockup: ['Workflow', 'Automation'],
    shortDescription: 'Your tools, connected into one system that moves work forward on its own.',
    description:
      'Most businesses already have the right tools — the problem is the gaps between them. We map how work actually moves through your company, then connect your forms, spreadsheets, CRM, email, WhatsApp and payment systems so hand-offs happen automatically, data stays consistent and exceptions are flagged before they become problems.',
    field:
      'Integration platforms and APIs now reach almost every business application, and AI steps let a workflow make judgements that once needed a person. The craft is in the design — clear ownership, error handling and monitoring — so automations stay reliable as the business changes.',
    idealFor: 'Teams juggling several tools, spreadsheets and manual hand-offs to finish one job.',
    approach: [
      { title: 'Map the flow', text: 'We document every hand-off, system and decision point as it happens today.' },
      { title: 'Redesign', text: 'We simplify the process first, then decide what to automate and what to keep human.' },
      { title: 'Integrate', text: 'We connect your apps through workflow engines, APIs and webhooks.' },
      { title: 'Monitor', text: 'Alerts, retries and dashboards keep every workflow observable and recoverable.' },
    ],
    deliverables: [
      'Automated end-to-end workflows across your tools',
      'A process map your team can maintain',
      'Approvals and notifications at the right moments',
      'Monitoring with alerts and error recovery',
    ],
    icon: 'orbit',
    visual: { hand: 3 },
    capabilities: ['Process mapping', 'App-to-app integrations', 'Approvals & notifications', 'Monitoring & error recovery'],
    useCases: ['Order → invoice → dispatch', 'Employee onboarding', 'Automated weekly reporting'],
    stack: ['n8n', 'Make', 'Zapier', 'Webhooks', 'REST'],
    accent: '#a58bff',
  },
  {
    id: 'crm-ops',
    index: '05',
    title: 'CRM & Intelligent Operations',
    lockup: ['CRM &', 'Operations'],
    shortDescription: 'Every lead, customer and task — organised, automated and visible.',
    description:
      'A CRM is only as useful as the data in it. We set up, migrate and automate CRMs and operational systems so every lead, customer and task is captured and tracked from first contact onwards. AI enriches records, scores opportunities and surfaces what needs attention, while live dashboards give leadership one accurate view of the business.',
    field:
      'Operations are moving from static records to systems that act: pipelines that update themselves, follow-ups that trigger on behaviour, and AI that highlights risk and opportunity. The foundation is still clean, well-structured data — which is where we start.',
    idealFor: 'Growing teams losing track of leads, follow-ups or customer history across spreadsheets and inboxes.',
    approach: [
      { title: 'Audit', text: 'We review your pipeline, your data quality and how your team really works.' },
      { title: 'Structure', text: 'Stages, fields and ownership designed around your sales and service process.' },
      { title: 'Automate', text: 'Lead capture, assignment, follow-ups and reminders run without manual effort.' },
      { title: 'Illuminate', text: 'Scoring, enrichment and dashboards turn the data into decisions.' },
    ],
    deliverables: [
      'A configured CRM, with your data migrated and cleaned',
      'Automated capture, assignment and follow-up',
      'Lead scoring and record enrichment',
      'Live dashboards for sales and operations',
    ],
    icon: 'crystal',
    visual: { hand: 4 },
    capabilities: ['CRM setup & migration', 'Pipeline automation', 'Lead scoring & enrichment', 'Live operational dashboards'],
    useCases: ['Sales pipeline on autopilot', 'Customer follow-up sequences', 'One view of operations'],
    stack: ['CRMs', 'PostgreSQL', 'Supabase', 'Embeddings', 'Sheets'],
    accent: '#62e0cf',
  },
  {
    id: 'custom-ai',
    index: '06',
    title: 'Custom AI Solutions',
    lockup: ['Custom AI', 'Solutions'],
    shortDescription: "When off-the-shelf won't do — AI designed around your exact problem.",
    description:
      "Some problems don't fit an off-the-shelf tool. For those, we design AI systems around your exact data, constraints and goals — from custom language-model pipelines and document intelligence to forecasting, computer vision or an entirely AI-first product. Every engagement starts with a clear scope and a measurable definition of success.",
    field:
      'AI capabilities are advancing quickly, but real value comes from fitting them to a specific problem: the right model, the right data pipeline, sensible guardrails and a way to measure the result. Custom work makes sense where generic tools fall short on accuracy, privacy or integration.',
    idealFor: "Organisations with a specific, high-value problem that generic AI tools don't solve well.",
    approach: [
      { title: 'Scope', text: 'We define the problem, the data available and what success looks like.' },
      { title: 'Prototype', text: 'A working proof of concept on your real data, to validate the approach early.' },
      { title: 'Engineer', text: 'Production-grade pipelines, integrations, security and evaluation.' },
      { title: 'Deploy & support', text: 'Into your environment, with monitoring and a roadmap for improvement.' },
    ],
    deliverables: [
      'A scoped proof of concept on your own data',
      'A production system with evaluation built in',
      'Deployment into your infrastructure',
      'Documentation and ongoing support',
    ],
    icon: 'cube',
    visual: { hand: 5 },
    capabilities: ['Custom LLM pipelines', 'Document intelligence', 'Predictive analytics', 'AI product development'],
    useCases: ['Industry-specific assistants', 'Automated document review', 'Demand forecasting'],
    stack: ['Open-source LLMs', 'Python', 'Vector DBs', 'Embeddings', 'Evaluation'],
    accent: '#d07bff',
  },
];

export const serviceById = (id: string): Service | undefined => services.find((s) => s.id === id);
