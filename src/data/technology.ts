/**
 * The technology we build with, grouped by what it does. Tools are examples of
 * what we work with — edit freely as the stack evolves.
 */
import type { TechCategory } from '@/types/content';

export const techCategories: TechCategory[] = [
  {
    id: 'ai',
    label: 'AI',
    description:
      'Language and vision models chosen for the task at hand, then grounded in your own data so they stay accurate and on topic.',
    tools: ['OpenAI', 'Claude', 'Gemini', 'Open source LLMs', 'Embeddings'],
    accent: '#8b6bff',
  },
  {
    id: 'agents',
    label: 'Agents',
    description:
      'Assistants that plan, use tools and take action, always within clear guardrails and with a person in the loop where it matters.',
    tools: ['Tool calling', 'RAG', 'Memory', 'Evaluation'],
    accent: '#a58bff',
  },
  {
    id: 'automation',
    label: 'Automation',
    description:
      'Workflow engines and custom jobs that move work between systems reliably, with every step monitored and recoverable.',
    tools: ['n8n', 'Make', 'Zapier', 'Custom workers', 'Schedulers'],
    accent: '#5b8cff',
  },
  {
    id: 'web',
    label: 'Web',
    description: 'Fast interfaces coded by hand, from focused landing pages to complete web applications.',
    tools: ['React', 'TypeScript', 'Next.js', 'WebGL', 'GSAP'],
    accent: '#6fd8ff',
  },
  {
    id: 'apis',
    label: 'APIs',
    description: 'Clean integration layers and webhooks, so every tool you rely on can talk to every other.',
    tools: ['REST', 'Webhooks', 'Node.js', 'Python'],
    accent: '#7c9bff',
  },
  {
    id: 'data',
    label: 'Data',
    description:
      'Databases, vector search and pipelines that keep your information structured, searchable and worthy of trust.',
    tools: ['PostgreSQL', 'Supabase', 'Vector DBs', 'Sheets'],
    accent: '#62e0cf',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    description: 'The channels and platforms your business already runs on, wired together into a single system.',
    tools: ['WhatsApp', 'Email', 'CRMs', 'Google Workspace', 'Payments'],
    accent: '#d07bff',
  },
];
