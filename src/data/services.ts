/**
 * GA Automations capabilities — the single source for the cinematic HUD
 * (one per cosmic hand) and the "What we build" section.
 *
 * To add/edit a service: change this array. `visual.hand` picks which of the
 * entity's six hands carries it (0–5, see media.cosmicEntity.anchors.arms).
 * `icon` is the line glyph mirroring the object that hand holds. `stack`
 * names should match the Technology section (src/data/technology.ts).
 * Ready to be replaced by a CMS/API later — see src/services/content.ts.
 *
 * House style for all visible copy: no dashes of any kind, British spelling.
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
      'Every team has work that follows the same pattern week after week. Someone reads a document, copies the details into another system, chases a reply, forwards a request to the right person. None of it needs a human mind, yet it quietly consumes the hours that should go to customers and growth. We find those patterns, measure what they really cost, and replace them with automations powered by AI that run in the background, accurately and around the clock. Every action is logged, so you can always see what the system did and why. Wherever a decision calls for judgement, approval or a personal touch, a person stays firmly in the loop.',
    field:
      'Automation used to mean rigid scripts that broke the moment anything looked unfamiliar. Modern language and vision models read much the way people do. They make sense of emails, PDFs, scanned forms and photographs, which means processes once considered too messy to automate can now be handled from start to finish, with people reviewing only the exceptions.',
    idealFor: 'Operations, finance and admin teams buried in repetitive work that revolves around documents.',
    approach: [
      { title: 'Discover', text: 'We walk through the process step by step and find where time, delays and errors really pile up.' },
      { title: 'Design', text: 'We decide what the system owns, where a person reviews, and how every exception gets caught.' },
      { title: 'Build & integrate', text: 'We build the automation and connect it to your inboxes, drives, spreadsheets and business tools.' },
      { title: 'Run & refine', text: 'After launch we watch accuracy and throughput closely, and tune the system as your volumes grow.' },
    ],
    deliverables: [
      'A working automation, documented from start to finish',
      'Human review built in for sensitive decisions',
      'Logging, alerts and graceful recovery from errors',
      'Handover and training for your team',
    ],
    icon: 'star',
    visual: { hand: 0 },
    capabilities: ['Document and email processing', 'Data extraction with AI', 'Smart triage and routing', 'Scheduled and triggered jobs'],
    useCases: [
      'Invoices and forms processed the moment they arrive',
      'Incoming email summarised and routed',
      'Reports compiled without copy and paste',
    ],
    stack: ['OpenAI', 'Claude', 'n8n', 'Python', 'Google Workspace'],
    accent: '#5b8cff',
  },
  {
    id: 'ai-agents',
    index: '02',
    title: 'AI Agents & Chatbots',
    lockup: ['AI Agents', '& Chatbots'],
    shortDescription: 'Assistants that understand, decide and act, on your site, on WhatsApp and inside your tools.',
    description:
      'A good AI agent is far more than a chatbot reading from a script. It understands what someone is actually asking, finds the right information, takes action inside your systems and recognises the moment a person should take over. We design each agent around your knowledge and the way your business works, then place it where your customers and your team already spend their time: your website, WhatsApp and your internal tools. Grounding, guardrails and regular evaluation keep its answers accurate long after launch day.',
    field:
      'Conversational AI has moved on from rigid decision trees to agents built on large language models that can reason, use tools and look things up. The gap between an impressive demo and an agent you can trust with your customers is engineering. Answers have to rest on sources you trust, actions have to stay within clear limits, and quality has to be measured over time.',
    idealFor: 'Businesses fielding the same questions, enquiries and bookings every day across the web and WhatsApp.',
    approach: [
      { title: 'Define the role', text: 'What the agent handles, what it must never do, and exactly when it hands over to a person.' },
      { title: 'Ground it', text: 'We connect it to your documents, FAQs and product data, so every answer rests on your own facts.' },
      { title: 'Connect it', text: 'Calendars, CRM and order systems let it book, qualify and update records, not merely reply.' },
      { title: 'Evaluate & improve', text: 'We test it against real conversations and review transcripts, so quality keeps climbing.' },
    ],
    deliverables: [
      'An agent live on your website, WhatsApp or internal tools',
      'A curated knowledge base it answers from',
      'Handover to your team with the full conversation',
      'Conversation analytics and regular reviews',
    ],
    icon: 'galaxy',
    visual: { hand: 1 },
    capabilities: [
      'Website and WhatsApp agents',
      'Answers grounded in your knowledge (RAG)',
      'Lead qualification and booking',
      'Human handover and escalation',
    ],
    useCases: ['Customer support around the clock', 'An AI sales assistant', 'An internal knowledge assistant'],
    stack: ['Claude', 'OpenAI', 'RAG', 'Tool calling', 'WhatsApp'],
    accent: '#8b6bff',
  },
  {
    id: 'websites',
    index: '03',
    title: 'Websites & Web Pages',
    lockup: ['Websites', '& Web Pages'],
    shortDescription: 'Websites and web pages coded by hand. Fast, precise and built to convert.',
    description:
      'For many customers your website is the first real conversation they have with your business. We design and code every site from scratch, without templates or page builders, so each page loads quickly, reads beautifully, works for everyone and looks unmistakably like you. Then we connect it to the rest of your operation. Forms flow straight into your CRM, enquiries set automations in motion, and clear analytics show which pages are earning their place.',
    field:
      'Speed, accessibility and search visibility now decide whether a page is found at all, and whether it converts once it is. Code written by hand gives complete control over all three, the very things template builders quietly trade away for convenience.',
    idealFor: 'Companies that need their website to work as a sales channel rather than a brochure.',
    approach: [
      { title: 'Strategy & structure', text: 'Goals, audience and the path each page should lead a visitor along.' },
      { title: 'Design', text: 'A distinct visual direction, and an interface considered for every screen size.' },
      { title: 'Engineering', text: 'Clean code written by hand for performance, with optimised media and fast loads.' },
      { title: 'Launch & connect', text: 'Search foundations, analytics, and forms wired into your CRM and automations.' },
    ],
    deliverables: [
      'A responsive website or landing page, coded by hand',
      'Technical SEO and performance tuning',
      'Forms and enquiries connected to your CRM',
      'Analytics, and a simple way to update content',
    ],
    icon: 'sphere',
    visual: { hand: 2 },
    capabilities: ['Websites coded from scratch', 'Landing and campaign pages', 'Responsive, fast and ready for search', 'Forms wired to your CRM'],
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
      'Most businesses already own the right tools. What slows them down is the space between those tools, where information is copied by hand and tasks sit waiting for someone to notice them. We map how work genuinely moves through your company, then connect your forms, spreadsheets, CRM, email, WhatsApp and payment systems, so handovers happen automatically, data stays consistent everywhere, and anything unusual is flagged long before it becomes a problem.',
    field:
      'Integration platforms and open APIs now reach almost every business application, and AI steps allow a workflow to make judgements that once needed a person. The craft lies in the design: clear ownership, careful error handling and proper monitoring, so automations stay dependable as the business changes around them.',
    idealFor: 'Teams juggling several tools, spreadsheets and manual handovers just to finish one job.',
    approach: [
      { title: 'Map the flow', text: 'We document every handover, system and decision point exactly as it works today.' },
      { title: 'Redesign', text: 'We simplify the process first, then decide what to automate and what stays human.' },
      { title: 'Integrate', text: 'We connect your apps through workflow engines, APIs and webhooks.' },
      { title: 'Monitor', text: 'Alerts, automatic retries and dashboards keep every workflow visible and recoverable.' },
    ],
    deliverables: [
      'Automated workflows spanning all your tools',
      'A process map your team can maintain',
      'Approvals and notifications at the right moments',
      'Monitoring, with alerts and recovery from errors',
    ],
    icon: 'orbit',
    visual: { hand: 3 },
    capabilities: ['Process mapping', 'Integrations between your apps', 'Approvals and notifications', 'Monitoring and error recovery'],
    useCases: ['Order to invoice to dispatch', 'New employee onboarding', 'Weekly reporting, fully automated'],
    stack: ['n8n', 'Make', 'Zapier', 'Webhooks', 'REST'],
    accent: '#a58bff',
  },
  {
    id: 'crm-ops',
    index: '05',
    title: 'CRM & Intelligent Operations',
    lockup: ['CRM &', 'Operations'],
    shortDescription: 'Every lead, customer and task, organised, automated and in plain view.',
    description:
      'A CRM is only as valuable as the information inside it. We set up, migrate and automate CRMs and operational systems so every lead, customer and task is captured the moment it appears and tracked from first contact onwards. AI enriches records, scores opportunities and surfaces what deserves attention today, while live dashboards give leadership one accurate picture of the business instead of five spreadsheets that disagree.',
    field:
      'Operations are shifting from static records to systems that act. Pipelines update themselves, reminders trigger on what customers actually do, and AI highlights risk and opportunity before anyone thinks to look. Underneath it all sits clean, well structured data, which is exactly where we begin.',
    idealFor: 'Growing teams losing track of leads, reminders or customer history across spreadsheets and inboxes.',
    approach: [
      { title: 'Audit', text: 'We review your pipeline, the quality of your data and how your team really works.' },
      { title: 'Structure', text: 'Stages, fields and ownership designed around your sales and service process.' },
      { title: 'Automate', text: 'Lead capture, assignment and reminders run without anyone lifting a finger.' },
      { title: 'Illuminate', text: 'Scoring, enrichment and dashboards turn raw data into clear decisions.' },
    ],
    deliverables: [
      'A configured CRM, with your data migrated and cleaned',
      'Automated capture, assignment and reminders',
      'Lead scoring and record enrichment',
      'Live dashboards for sales and operations',
    ],
    icon: 'crystal',
    visual: { hand: 4 },
    capabilities: ['CRM setup and migration', 'Pipeline automation', 'Lead scoring and enrichment', 'Live operational dashboards'],
    useCases: ['A sales pipeline that runs itself', 'Nurture sequences that keep customers close', 'One clear view of operations'],
    stack: ['CRMs', 'PostgreSQL', 'Supabase', 'Embeddings', 'Sheets'],
    accent: '#62e0cf',
  },
  {
    id: 'custom-ai',
    index: '06',
    title: 'Custom AI Solutions',
    lockup: ['Custom AI', 'Solutions'],
    shortDescription: 'When generic tools fall short, AI designed around your exact problem.',
    description:
      'Some problems simply do not fit a packaged tool. For those we design AI systems around your data, your constraints and your goals. That might be a custom pipeline built on language models, document intelligence, forecasting, computer vision, or an entire product with AI at its heart. Every engagement begins with a clear scope and an honest, measurable definition of success, so you always know what the system is meant to achieve and whether it does.',
    field:
      'AI is advancing quickly, but real value comes from fitting it precisely to a problem: the right model, the right data pipeline, sensible guardrails and a reliable way to measure results. Custom work earns its place wherever generic tools fall short on accuracy, privacy or integration.',
    idealFor: 'Organisations with a specific, valuable problem that generic AI tools do not solve well.',
    approach: [
      { title: 'Scope', text: 'We define the problem, the data available and what success looks like.' },
      { title: 'Prototype', text: 'A working proof of concept on your real data, to prove the approach early.' },
      { title: 'Engineer', text: 'Robust pipelines, integrations, security and evaluation, built for production.' },
      { title: 'Deploy & support', text: 'Delivered into your environment, with monitoring and a roadmap for what comes next.' },
    ],
    deliverables: [
      'A scoped proof of concept on your own data',
      'A production system with evaluation built in',
      'Deployment into your own infrastructure',
      'Documentation and ongoing support',
    ],
    icon: 'cube',
    visual: { hand: 5 },
    capabilities: ['Custom language model pipelines', 'Document intelligence', 'Predictive analytics', 'AI product development'],
    useCases: ['Assistants built for your industry', 'Automated document review', 'Demand forecasting'],
    stack: ['Open source LLMs', 'Python', 'Vector DBs', 'Embeddings', 'Evaluation'],
    accent: '#d07bff',
  },
];

export const serviceById = (id: string): Service | undefined => services.find((s) => s.id === id);
