/**
 * The technology we build with, grouped by what it does. Tools are examples of
 * what we work with — edit freely as the stack evolves.
 */
import type { TechCategory } from '@/types/content';

export const techCategories: TechCategory[] = [
  {
    id: 'ai',
    label: 'AI',
    description: 'Language and vision models chosen for the job — and grounded in your data so they stay accurate.',
    tools: ['OpenAI', 'Claude', 'Gemini', 'Open-source LLMs', 'Embeddings'],
    accent: '#8b6bff',
  },
  {
    id: 'agents',
    label: 'Agents',
    description: 'Assistants that plan, use tools and take action — with guardrails and a human in the loop.',
    tools: ['Tool calling', 'RAG', 'Memory', 'Evaluation'],
    accent: '#a58bff',
  },
  {
    id: 'automation',
    label: 'Automation',
    description: 'Workflow engines and custom jobs that move work between systems reliably, with monitoring.',
    tools: ['n8n', 'Make', 'Zapier', 'Custom workers', 'Schedulers'],
    accent: '#5b8cff',
  },
  {
    id: 'web',
    label: 'Web',
    description: 'Custom-coded, fast front-ends — from landing pages to full web applications.',
    tools: ['React', 'TypeScript', 'Next.js', 'WebGL', 'GSAP'],
    accent: '#6fd8ff',
  },
  {
    id: 'apis',
    label: 'APIs',
    description: 'Clean integration layers and webhooks, so every tool can talk to every other.',
    tools: ['REST', 'Webhooks', 'Node.js', 'Python'],
    accent: '#7c9bff',
  },
  {
    id: 'data',
    label: 'Data',
    description: 'Databases, vector search and pipelines that keep information structured and trustworthy.',
    tools: ['PostgreSQL', 'Supabase', 'Vector DBs', 'Sheets'],
    accent: '#62e0cf',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    description: 'The channels and platforms your business already runs on, wired into one system.',
    tools: ['WhatsApp', 'Email', 'CRMs', 'Google Workspace', 'Payments'],
    accent: '#d07bff',
  },
];
