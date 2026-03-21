/**
 * Database Agent — Central data access layer
 *
 * The Database Agent is the gatekeeper for all database operations.
 * Other agents request data through this layer, which enforces
 * permission scopes and returns only authorized data.
 */

import { prisma } from "@/lib/prisma";
import {
  type PermissionScope,
  hasPermission,
  scopeFilter,
} from "@/lib/agent-permissions";

export interface DbRequest {
  action: string;
  table: string;
  teamId: string;
  permissions: PermissionScope[];
  data?: Record<string, unknown>;
  filters?: Record<string, unknown>;
}

export interface DbResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Execute a database operation through the DB Agent.
 * Enforces permission scopes before executing.
 */
export async function dbAgentExecute(req: DbRequest): Promise<DbResponse> {
  const { action, table, teamId, permissions, data, filters } = req;

  // Check read permission
  if (action === "read" || action === "list") {
    const readScope = hasPermission(permissions, "db:read:all")
      ? "db:read:all"
      : "db:read:own_team";
    if (!hasPermission(permissions, readScope as PermissionScope)) {
      return { success: false, error: `No read permission for ${table}` };
    }
  }

  // Check write permission
  if (action === "create" || action === "update" || action === "delete") {
    const writeScope = hasPermission(permissions, "db:write:all")
      ? "db:write:all"
      : "db:write:own_team";
    if (!hasPermission(permissions, writeScope as PermissionScope)) {
      return { success: false, error: `No write permission for ${table}` };
    }
  }

  const scope = scopeFilter(permissions, teamId);

  try {
    switch (table) {
      case "agent_teams":
        return await handleTeams(action, scope, data, filters);
      case "agents":
        return await handleAgents(action, scope, data, filters);
      case "tasks":
        return await handleTasks(action, scope, data, filters);
      case "skills":
        return await handleSkills(action, scope, data, filters);
      case "scheduled_jobs":
        return await handleScheduledJobs(action, scope, data, filters);
      case "activity_logs":
        return await handleActivityLogs(action, scope, data);
      default:
        return { success: false, error: `Unknown table: ${table}` };
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

async function handleTeams(
  action: string,
  _scope: { teamId?: string },
  data?: Record<string, unknown>,
  filters?: Record<string, unknown>
): Promise<DbResponse> {
  switch (action) {
    case "list":
      const teams = await prisma.agentTeam.findMany({
        where: filters ? (filters as never) : undefined,
        include: { _count: { select: { agents: true, tasks: true, skills: true } } },
        orderBy: { createdAt: "desc" },
      });
      return { success: true, data: teams };
    case "read":
      const team = await prisma.agentTeam.findUnique({
        where: { id: data?.id as string },
        include: { agents: true, skills: true },
      });
      return { success: true, data: team };
    case "create":
      const newTeam = await prisma.agentTeam.create({ data: data as never });
      return { success: true, data: newTeam };
    default:
      return { success: false, error: `Unsupported action: ${action}` };
  }
}

async function handleAgents(
  action: string,
  scope: { teamId?: string },
  data?: Record<string, unknown>,
  filters?: Record<string, unknown>
): Promise<DbResponse> {
  switch (action) {
    case "list":
      const agents = await prisma.agent.findMany({
        where: { ...scope, ...filters },
        orderBy: { createdAt: "desc" },
      });
      return { success: true, data: agents };
    case "create":
      const agent = await prisma.agent.create({ data: data as never });
      return { success: true, data: agent };
    default:
      return { success: false, error: `Unsupported action: ${action}` };
  }
}

async function handleTasks(
  action: string,
  scope: { teamId?: string },
  data?: Record<string, unknown>,
  filters?: Record<string, unknown>
): Promise<DbResponse> {
  switch (action) {
    case "list":
      const tasks = await prisma.task.findMany({
        where: { ...scope, ...filters },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return { success: true, data: tasks };
    case "create":
      const task = await prisma.task.create({ data: data as never });
      return { success: true, data: task };
    default:
      return { success: false, error: `Unsupported action: ${action}` };
  }
}

async function handleSkills(
  action: string,
  scope: { teamId?: string },
  data?: Record<string, unknown>,
  filters?: Record<string, unknown>
): Promise<DbResponse> {
  switch (action) {
    case "list":
      const skills = await prisma.skill.findMany({
        where: { ...scope, ...filters },
        orderBy: { name: "asc" },
      });
      return { success: true, data: skills };
    case "create":
      const skill = await prisma.skill.create({ data: data as never });
      return { success: true, data: skill };
    default:
      return { success: false, error: `Unsupported action: ${action}` };
  }
}

async function handleScheduledJobs(
  action: string,
  scope: { teamId?: string },
  data?: Record<string, unknown>,
  filters?: Record<string, unknown>
): Promise<DbResponse> {
  switch (action) {
    case "list":
      const jobs = await prisma.scheduledJob.findMany({
        where: { ...scope, ...filters },
        orderBy: { scheduledFor: "asc" },
      });
      return { success: true, data: jobs };
    case "create":
      const job = await prisma.scheduledJob.create({ data: data as never });
      return { success: true, data: job };
    default:
      return { success: false, error: `Unsupported action: ${action}` };
  }
}

async function handleActivityLogs(
  action: string,
  scope: { teamId?: string },
  data?: Record<string, unknown>
): Promise<DbResponse> {
  switch (action) {
    case "list":
      const logs = await prisma.activityLog.findMany({
        where: scope,
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return { success: true, data: logs };
    case "create":
      const log = await prisma.activityLog.create({ data: data as never });
      return { success: true, data: log };
    default:
      return { success: false, error: `Unsupported action: ${action}` };
  }
}
