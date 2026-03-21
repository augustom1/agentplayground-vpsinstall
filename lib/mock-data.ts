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

export interface ActivityItem {
  id: string;
  team: string;
  action: string;
  client?: string;
  timestamp: string;
  type: "task" | "deploy" | "error" | "chat";
}

export interface ScheduledJob {
  id: string;
  teamId: string;
  teamName: string;
  title: string;
  description: string;
  scheduledFor: string;
  recurring: "none" | "daily" | "weekly" | "monthly";
  status: "pending" | "running" | "completed" | "failed";
  isOffHours: boolean;
}

// ─── Agent Teams ─────────────────────────────────────
// These are your real agent team definitions.
// Update status/ports as you build and deploy each one.
export const agentTeams: AgentTeam[] = [
  {
    id: "marketing",
    name: "Marketing",
    description: "Schedules and manages social media posts for clients",
    port: 8001,
    status: "idle",
    tasksCompleted: 0,
    lastActivity: "Never",
    clients: [],
    language: "Python / FastAPI",
  },
  {
    id: "accounting",
    name: "Accounting",
    description: "Tracks expenses and income, generates financial summaries",
    port: 8002,
    status: "idle",
    tasksCompleted: 0,
    lastActivity: "Never",
    clients: [],
    language: "Python / FastAPI",
  },
  {
    id: "messaging",
    name: "Messaging",
    description: "AI-powered chatbot for client customer support",
    port: 8003,
    status: "idle",
    tasksCompleted: 0,
    lastActivity: "Never",
    clients: [],
    language: "Python / FastAPI",
  },
  {
    id: "website-builder",
    name: "Website Builder",
    description: "Scaffolds client websites from questionnaire data",
    port: 3001,
    status: "idle",
    tasksCompleted: 0,
    lastActivity: "Never",
    clients: [],
    language: "Node / Next.js",
  },
];



// ─── Activity Log ────────────────────────────────────
// Will be populated by real events from agent tasks.
export const recentActivity: ActivityItem[] = [];

// ─── Playground History ──────────────────────────────
// Populated as you run tasks from the Playground.
export const playgroundHistory: { id: string; target: string; prompt: string; result: string; timestamp: string }[] = [];

// ─── Scheduled Jobs ──────────────────────────────────
// Will be populated as you schedule tasks.
export const scheduledJobs: ScheduledJob[] = [];

// Away blocks — configure your sleep/away schedule here.
export const awayBlocks: { day: number; startHour: number; endHour: number; label: string }[] = [
  { day: 0, startHour: 23, endHour: 24, label: "Sleep" },
  { day: 1, startHour: 0, endHour: 7, label: "Sleep" },
  { day: 1, startHour: 23, endHour: 24, label: "Sleep" },
  { day: 2, startHour: 0, endHour: 7, label: "Sleep" },
  { day: 2, startHour: 23, endHour: 24, label: "Sleep" },
  { day: 3, startHour: 0, endHour: 7, label: "Sleep" },
  { day: 3, startHour: 23, endHour: 24, label: "Sleep" },
  { day: 4, startHour: 0, endHour: 7, label: "Sleep" },
  { day: 4, startHour: 23, endHour: 24, label: "Sleep" },
  { day: 5, startHour: 0, endHour: 8, label: "Sleep" },
  { day: 6, startHour: 0, endHour: 9, label: "Sleep" },
];
