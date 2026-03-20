export type AgentStatus = "healthy" | "idle" | "error" | "deploying";

export interface AgentTeam {
  id: string;
  name: string;
  description: string;
  port: number;
  status: AgentStatus;
  tasksCompleted: number;
  lastActivity: string;
  clients: string[];
  language: string;
}

export interface Client {
  id: string;
  name: string;
  domain: string;
  plan: string;
  bundles: string[];
  status: "active" | "pending" | "inactive";
  billing: "paid" | "overdue" | "manual";
  since: string;
}

export interface ActivityItem {
  id: string;
  team: string;
  action: string;
  client?: string;
  timestamp: string;
  type: "task" | "deploy" | "error" | "chat";
}

export const agentTeams: AgentTeam[] = [
  {
    id: "marketing",
    name: "Marketing",
    description: "Schedules and manages social media posts for clients",
    port: 8001,
    status: "healthy",
    tasksCompleted: 142,
    lastActivity: "2 min ago",
    clients: ["cliente1", "cliente2"],
    language: "Python / FastAPI",
  },
  {
    id: "accounting",
    name: "Accounting",
    description: "Tracks expenses and income, generates financial summaries",
    port: 8002,
    status: "healthy",
    tasksCompleted: 87,
    lastActivity: "14 min ago",
    clients: ["cliente1"],
    language: "Python / FastAPI",
  },
  {
    id: "messaging",
    name: "Messaging",
    description: "AI-powered chatbot for client customer support",
    port: 8003,
    status: "idle",
    tasksCompleted: 310,
    lastActivity: "1 hr ago",
    clients: ["cliente1", "cliente2", "cliente3"],
    language: "Python / FastAPI",
  },
  {
    id: "website-builder",
    name: "Website Builder",
    description: "Scaffolds client websites from questionnaire data",
    port: 3001,
    status: "error",
    tasksCompleted: 0,
    lastActivity: "Never",
    clients: [],
    language: "Node / Next.js",
  },
];

export const clients: Client[] = [
  {
    id: "c1",
    name: "Tacos El Gordo",
    domain: "cliente1.tudominio.com",
    plan: "Full BCS Bundle",
    bundles: ["marketing", "accounting", "messaging"],
    status: "active",
    billing: "paid",
    since: "2025-11-01",
  },
  {
    id: "c2",
    name: "Ferretería López",
    domain: "cliente2.tudominio.com",
    plan: "Marketing + Messaging",
    bundles: ["marketing", "messaging"],
    status: "active",
    billing: "manual",
    since: "2025-12-15",
  },
  {
    id: "c3",
    name: "Estudio Creativo MX",
    domain: "cliente3.tudominio.com",
    plan: "Messaging Module",
    bundles: ["messaging"],
    status: "pending",
    billing: "manual",
    since: "2026-01-20",
  },
];

export const recentActivity: ActivityItem[] = [
  {
    id: "a1",
    team: "Marketing",
    action: "Scheduled 3 posts for next week",
    client: "Tacos El Gordo",
    timestamp: "2 min ago",
    type: "task",
  },
  {
    id: "a2",
    team: "Accounting",
    action: "Generated March expense summary",
    client: "Tacos El Gordo",
    timestamp: "14 min ago",
    type: "task",
  },
  {
    id: "a3",
    team: "Messaging",
    action: "Resolved 5 customer queries",
    client: "Ferretería López",
    timestamp: "1 hr ago",
    type: "task",
  },
  {
    id: "a4",
    team: "System",
    action: "Deployed Marketing bundle to cliente3",
    timestamp: "3 hr ago",
    type: "deploy",
  },
  {
    id: "a5",
    team: "Website Builder",
    action: "Container failed to start",
    timestamp: "6 hr ago",
    type: "error",
  },
  {
    id: "a6",
    team: "Chat",
    action: "Tasked Marketing to create Valentine's content",
    timestamp: "Yesterday",
    type: "chat",
  },
];

export const playgroundHistory = [
  {
    id: "p1",
    target: "Marketing",
    prompt: "Schedule 5 posts about our new lunch menu for this week",
    result: "✓ 5 posts queued: Mon–Fri 12:00 PM",
    timestamp: "Today 10:22",
  },
  {
    id: "p2",
    target: "Accounting",
    prompt: "Show me February's income vs expense breakdown",
    result: "✓ Income: $18,400 / Expenses: $11,200 / Net: $7,200",
    timestamp: "Yesterday 16:05",
  },
  {
    id: "p3",
    target: "All Teams",
    prompt: "Run health check",
    result: "Marketing ✓  Accounting ✓  Messaging ✓  Website Builder ✗ (port 3001 not responding)",
    timestamp: "2 days ago",
  },
];
