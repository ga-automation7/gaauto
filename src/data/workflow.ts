/**
 * "The transformation" — an illustrative automated business system:
 * enquiries arrive on any channel, an AI agent understands and qualifies them,
 * systems of record update themselves, and the team sees it all live.
 * Positions are in a 1000 × 620 design space (desktop) and 400 × 900 (mobile).
 */
export type WorkflowNodeKind = 'input' | 'agent' | 'system' | 'output';

export interface WorkflowNode {
  id: string;
  label: string;
  detail: string;
  kind: WorkflowNodeKind;
  desktop: [number, number];
  mobile: [number, number];
}

export const workflowNodes: WorkflowNode[] = [
  {
    id: 'form',
    label: 'Website form',
    detail: 'Enquiry',
    kind: 'input',
    desktop: [110, 110],
    mobile: [70, 90],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    detail: 'Message',
    kind: 'input',
    desktop: [110, 250],
    mobile: [200, 90],
  },
  { id: 'email', label: 'Email', detail: 'Inbox', kind: 'input', desktop: [110, 390], mobile: [330, 90] },
  {
    id: 'call',
    label: 'Calls',
    detail: 'Voice notes',
    kind: 'input',
    desktop: [110, 530],
    mobile: [200, 210],
  },
  {
    id: 'agent',
    label: 'AI agent',
    detail: 'Understand · qualify · decide',
    kind: 'agent',
    desktop: [470, 320],
    mobile: [200, 390],
  },
  {
    id: 'crm',
    label: 'CRM',
    detail: 'Contact + deal',
    kind: 'system',
    desktop: [760, 130],
    mobile: [70, 580],
  },
  {
    id: 'calendar',
    label: 'Calendar',
    detail: 'Meeting booked',
    kind: 'system',
    desktop: [760, 270],
    mobile: [200, 580],
  },
  {
    id: 'db',
    label: 'Database',
    detail: 'Records synced',
    kind: 'system',
    desktop: [760, 410],
    mobile: [330, 580],
  },
  {
    id: 'reply',
    label: 'Follow-up',
    detail: 'WhatsApp + email',
    kind: 'output',
    desktop: [760, 540],
    mobile: [95, 770],
  },
  {
    id: 'dash',
    label: 'Dashboard',
    detail: 'Live pipeline',
    kind: 'output',
    desktop: [925, 330],
    mobile: [290, 770],
  },
];

export const workflowEdges: [string, string][] = [
  ['form', 'agent'],
  ['whatsapp', 'agent'],
  ['email', 'agent'],
  ['call', 'agent'],
  ['agent', 'crm'],
  ['agent', 'calendar'],
  ['agent', 'db'],
  ['agent', 'reply'],
  ['crm', 'dash'],
  ['calendar', 'dash'],
  ['db', 'dash'],
];

/** The event log that scrolls by as the system runs (illustrative, not client data). */
export const workflowEvents: { time: string; source: string; message: string }[] = [
  { time: '09:41:02', source: 'WhatsApp', message: 'New enquiry received' },
  { time: '09:41:02', source: 'AI agent', message: 'Intent understood — pricing request' },
  { time: '09:41:03', source: 'AI agent', message: 'Lead qualified · priority high' },
  { time: '09:41:03', source: 'CRM', message: 'Contact + deal created' },
  { time: '09:41:04', source: 'WhatsApp', message: 'Personalised reply sent' },
  { time: '09:41:05', source: 'Calendar', message: 'Demo booked for Thursday 11:00' },
  { time: '09:41:05', source: 'Dashboard', message: 'Pipeline updated · team notified' },
];

/** A card placed on the stage (same design spaces as the workflow nodes). */
export interface StageCard {
  id: string;
  label: string;
  detail: string;
  desktop: [number, number];
  mobile: [number, number];
}

/** 01 · Intelligence on the stage — raw capability, powerful but not yet pointed at anything. */
export const capabilityCards: StageCard[] = [
  {
    id: 'language',
    label: 'Language model',
    detail: 'Reads · writes · reasons',
    desktop: [165, 105],
    mobile: [108, 120],
  },
  { id: 'vision', label: 'Vision', detail: 'Documents · images', desktop: [520, 70], mobile: [292, 240] },
  { id: 'voice', label: 'Voice', detail: 'Speech ↔ text', desktop: [860, 150], mobile: [108, 370] },
  { id: 'agents', label: 'Agents', detail: 'Tools · actions', desktop: [290, 395], mobile: [292, 500] },
  {
    id: 'automation',
    label: 'Automation',
    detail: 'Triggers · rules',
    desktop: [720, 360],
    mobile: [108, 640],
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    detail: 'Your data, searchable',
    desktop: [500, 545],
    mobile: [292, 780],
  },
];

/** 02 · Network on the stage — the tools, wired to one intelligence at the centre. */
export const networkHub = {
  label: 'Intelligence',
  detail: 'Connected',
  desktop: [500, 310],
  mobile: [200, 470],
} as const;
export const networkCards: StageCard[] = [
  { id: 'n-whatsapp', label: 'WhatsApp', detail: 'Channel', desktop: [150, 115], mobile: [100, 130] },
  { id: 'n-forms', label: 'Website forms', detail: 'Channel', desktop: [500, 70], mobile: [300, 130] },
  { id: 'n-email', label: 'Email', detail: 'Channel', desktop: [850, 115], mobile: [100, 300] },
  { id: 'n-crm', label: 'CRM', detail: 'System of record', desktop: [150, 505], mobile: [300, 300] },
  { id: 'n-calendar', label: 'Calendar', detail: 'Scheduling', desktop: [500, 555], mobile: [100, 660] },
  { id: 'n-db', label: 'Database', detail: 'Data', desktop: [850, 505], mobile: [300, 660] },
];

/** 01 · Intelligence — raw inputs, and how the AI reads each one (illustrative). */
export const phaseSignals: { source: string; input: string; reading: string[] }[] = [
  {
    source: 'Email',
    input: '“Could you send a quote for 40 units?”',
    reading: ['Intent · quote', 'Priority · high'],
  },
  {
    source: 'WhatsApp',
    input: '“Is delivery possible by Friday?”',
    reading: ['Intent · delivery', 'Deadline · Fri'],
  },
  {
    source: 'Form',
    input: '“Looking for a website and CRM set-up”',
    reading: ['Intent · new project', 'Fit · strong'],
  },
  { source: 'Call', input: 'Voice note · 0:42', reading: ['Transcribed', 'Summary ready'] },
];

/** 02 · Network — the tools the system connects to. */
export const phaseConnections: { tool: string; role: string }[] = [
  { tool: 'WhatsApp Business', role: 'Channel' },
  { tool: 'Email inbox', role: 'Channel' },
  { tool: 'Website forms', role: 'Channel' },
  { tool: 'CRM', role: 'System of record' },
  { tool: 'Calendar', role: 'Scheduling' },
  { tool: 'Database', role: 'Data' },
];

/** 03 · Workflow — the flow of work, mapped end to end. */
export const phaseSteps: { step: string; owner: 'AI' | 'System' | 'Team' }[] = [
  { step: 'Capture the enquiry', owner: 'System' },
  { step: 'Understand & qualify', owner: 'AI' },
  { step: 'Create the CRM record', owner: 'System' },
  { step: 'Book the meeting', owner: 'AI' },
  { step: 'Review quotes & exceptions', owner: 'Team' },
  { step: 'Follow up & report', owner: 'System' },
];

export const transformationPhases = [
  {
    id: 'energy',
    index: '01',
    label: 'Intelligence',
    text: 'Raw capability: models, agents, automation — powerful, but not yet pointed at anything.',
  },
  {
    id: 'network',
    index: '02',
    label: 'Network',
    text: 'We connect it to your channels, tools and data, so it can see how your business actually works.',
  },
  {
    id: 'workflow',
    index: '03',
    label: 'Workflow',
    text: 'The flow of work is mapped end to end — who does what, when, and what should happen next.',
  },
  {
    id: 'system',
    index: '04',
    label: 'System',
    text: 'And then it runs. Every enquiry handled, every record updated, every hand-off automatic.',
  },
] as const;
