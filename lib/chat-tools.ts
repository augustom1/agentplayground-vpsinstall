/**
 * Chat Tools — Tool definitions for Claude tool-use
 *
 * These tools are available to Claude during chat conversations.
 * When a user asks to create teams, agents, skills, etc., Claude
 * calls these tools to make it happen.
 */

import { prisma } from "@/lib/prisma";
import { PERMISSION_PRESETS } from "@/lib/agent-permissions";

/** Anthropic tool definition format */
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

/** All tools available to Claude in chat */
export const CHAT_TOOLS: ToolDefinition[] = [
  {
    name: "create_team",
    description:
      "Create a new agent team. Use this when the user wants to set up a new team of agents for a specific purpose (e.g., marketing, data analysis, customer support). Returns the created team.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the team" },
        description: { type: "string", description: "What this team does" },
        port: { type: "number", description: "Port number (default: auto-assigned)" },
        language: { type: "string", description: "Runtime language (default: Python / FastAPI)" },
        permissionPreset: {
          type: "string",
          enum: ["admin", "standard", "builder", "readonly"],
          description: "Permission level (default: standard)",
        },
      },
      required: ["name", "description"],
    },
  },
  {
    name: "create_agent",
    description:
      "Create an individual agent within a team. Use this after creating a team to add agents with specific roles, models, and capabilities.",
    input_schema: {
      type: "object",
      properties: {
        teamId: { type: "string", description: "ID of the team to add the agent to" },
        name: { type: "string", description: "Agent name" },
        description: { type: "string", description: "What the agent does" },
        model: { type: "string", description: "AI model (default: claude-sonnet-4-6)" },
        capabilities: {
          type: "array",
          items: { type: "string" },
          description: "List of capability tags",
        },
        systemPrompt: { type: "string", description: "System prompt for the agent" },
      },
      required: ["teamId", "name"],
    },
  },
  {
    name: "add_skill",
    description:
      "Register a skill that an agent team can use. Skills define capabilities like data analysis, file processing, API calls, etc.",
    input_schema: {
      type: "object",
      properties: {
        teamId: { type: "string", description: "Team ID" },
        name: { type: "string", description: "Skill name" },
        description: { type: "string", description: "What the skill does" },
        category: {
          type: "string",
          enum: ["general", "data", "communication", "code", "research", "system"],
          description: "Skill category",
        },
        instructions: { type: "string", description: "How to use this skill" },
      },
      required: ["teamId", "name", "description"],
    },
  },
  {
    name: "add_cli_function",
    description:
      "Register a CLI command that agents can execute. Use for system operations, file management, deployments, etc.",
    input_schema: {
      type: "object",
      properties: {
        teamId: { type: "string", description: "Team ID" },
        name: { type: "string", description: "Function name" },
        command: { type: "string", description: "CLI command template" },
        description: { type: "string", description: "What it does" },
        dangerous: { type: "boolean", description: "Requires confirmation? (default: false)" },
      },
      required: ["teamId", "name", "command"],
    },
  },
  {
    name: "schedule_task",
    description:
      "Schedule a task on the calendar for a specific date and time. Can be one-time or recurring.",
    input_schema: {
      type: "object",
      properties: {
        teamId: { type: "string", description: "Team ID" },
        teamName: { type: "string", description: "Team name" },
        title: { type: "string", description: "Task title" },
        description: { type: "string", description: "Task description" },
        scheduledFor: { type: "string", description: "ISO 8601 datetime" },
        recurring: {
          type: "string",
          enum: ["none", "daily", "weekly", "monthly"],
          description: "Recurrence (default: none)",
        },
      },
      required: ["teamId", "teamName", "title", "scheduledFor"],
    },
  },
  {
    name: "query_data",
    description:
      "Query the database for information. Use this to look up teams, agents, tasks, skills, activity logs, or scheduled jobs.",
    input_schema: {
      type: "object",
      properties: {
        table: {
          type: "string",
          enum: ["agent_teams", "agents", "tasks", "skills", "scheduled_jobs", "activity_logs", "improvements"],
          description: "Which table to query",
        },
        filters: {
          type: "object",
          description: "Optional filters (e.g., { status: 'active' })",
        },
      },
      required: ["table"],
    },
  },
  {
    name: "list_available_skills",
    description: "List all default and custom skills available in the system.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
];

/**
 * Execute a tool call from Claude.
 * Returns the result as a string for Claude to interpret.
 */
export async function executeTool(
  toolName: string,
  input: Record<string, unknown>
): Promise<string> {
  try {
    switch (toolName) {
      case "create_team":
        return await toolCreateTeam(input);
      case "create_agent":
        return await toolCreateAgent(input);
      case "add_skill":
        return await toolAddSkill(input);
      case "add_cli_function":
        return await toolAddCliFunction(input);
      case "schedule_task":
        return await toolScheduleTask(input);
      case "query_data":
        return await toolQueryData(input);
      case "list_available_skills":
        return await toolListSkills();
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (err) {
    return JSON.stringify({ error: String(err) });
  }
}

async function toolCreateTeam(input: Record<string, unknown>): Promise<string> {
  const preset = (input.permissionPreset as string) || "standard";
  const permissions = PERMISSION_PRESETS[preset] || PERMISSION_PRESETS.standard;

  const team = await prisma.agentTeam.create({
    data: {
      name: input.name as string,
      description: input.description as string,
      port: (input.port as number) || 8000 + Math.floor(Math.random() * 1000),
      language: (input.language as string) || "Python / FastAPI",
      config: { permissions },
    },
  });

  await prisma.activityLog.create({
    data: {
      action: `Created agent team "${team.name}"`,
      type: "deploy",
      teamName: team.name,
      teamId: team.id,
    },
  });

  return JSON.stringify({
    success: true,
    team: { id: team.id, name: team.name, description: team.description, port: team.port },
    message: `Team "${team.name}" created successfully with ${preset} permissions.`,
  });
}

async function toolCreateAgent(input: Record<string, unknown>): Promise<string> {
  const agent = await prisma.agent.create({
    data: {
      name: input.name as string,
      description: (input.description as string) || null,
      model: (input.model as string) || "claude-sonnet-4-6",
      capabilities: (input.capabilities as string[]) || [],
      systemPrompt: (input.systemPrompt as string) || null,
      teamId: input.teamId as string,
    },
  });

  return JSON.stringify({
    success: true,
    agent: { id: agent.id, name: agent.name, model: agent.model },
    message: `Agent "${agent.name}" added to the team.`,
  });
}

async function toolAddSkill(input: Record<string, unknown>): Promise<string> {
  const skill = await prisma.skill.create({
    data: {
      name: input.name as string,
      description: input.description as string,
      category: (input.category as string) || "general",
      instructions: (input.instructions as string) || null,
      teamId: input.teamId as string,
    },
  });

  return JSON.stringify({
    success: true,
    skill: { id: skill.id, name: skill.name },
    message: `Skill "${skill.name}" registered.`,
  });
}

async function toolAddCliFunction(input: Record<string, unknown>): Promise<string> {
  const fn = await prisma.cliFunction.create({
    data: {
      name: input.name as string,
      command: input.command as string,
      description: (input.description as string) || null,
      dangerous: (input.dangerous as boolean) || false,
      teamId: input.teamId as string,
    },
  });

  return JSON.stringify({
    success: true,
    function: { id: fn.id, name: fn.name },
    message: `CLI function "${fn.name}" registered.`,
  });
}

async function toolScheduleTask(input: Record<string, unknown>): Promise<string> {
  const job = await prisma.scheduledJob.create({
    data: {
      title: input.title as string,
      description: (input.description as string) || null,
      scheduledFor: new Date(input.scheduledFor as string),
      recurring: (input.recurring as string) || "none",
      teamId: input.teamId as string,
      teamName: input.teamName as string,
    },
  });

  return JSON.stringify({
    success: true,
    job: { id: job.id, title: job.title, scheduledFor: job.scheduledFor },
    message: `Task "${job.title}" scheduled.`,
  });
}

async function toolQueryData(input: Record<string, unknown>): Promise<string> {
  const table = input.table as string;
  const filters = (input.filters as Record<string, unknown>) || {};

  let data: unknown;
  switch (table) {
    case "agent_teams":
      data = await prisma.agentTeam.findMany({
        where: filters as never,
        include: { _count: { select: { agents: true, tasks: true, skills: true } } },
        take: 20,
      });
      break;
    case "agents":
      data = await prisma.agent.findMany({ where: filters as never, take: 20 });
      break;
    case "tasks":
      data = await prisma.task.findMany({ where: filters as never, take: 20, orderBy: { createdAt: "desc" } });
      break;
    case "skills":
      data = await prisma.skill.findMany({ where: filters as never, take: 50 });
      break;
    case "scheduled_jobs":
      data = await prisma.scheduledJob.findMany({ where: filters as never, take: 20, orderBy: { scheduledFor: "asc" } });
      break;
    case "activity_logs":
      data = await prisma.activityLog.findMany({ where: filters as never, take: 20, orderBy: { createdAt: "desc" } });
      break;
    case "improvements":
      data = await prisma.improvement.findMany({ where: filters as never, take: 20, orderBy: { createdAt: "desc" } });
      break;
    default:
      return JSON.stringify({ error: `Unknown table: ${table}` });
  }

  return JSON.stringify({ success: true, data, count: Array.isArray(data) ? data.length : 0 });
}

async function toolListSkills(): Promise<string> {
  const skills = await prisma.skill.findMany({ orderBy: { name: "asc" } });
  return JSON.stringify({
    success: true,
    skills: skills.map((s: { name: string; description: string; category: string }) => ({ name: s.name, description: s.description, category: s.category })),
    count: skills.length,
  });
}
