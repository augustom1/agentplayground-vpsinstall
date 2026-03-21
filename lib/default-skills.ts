/**
 * Default Skills — Built-in skills that ship with the platform
 *
 * These are registered on first startup and cannot be deleted.
 */

export interface DefaultSkill {
  name: string;
  description: string;
  category: string;
  instructions: string;
}

export const DEFAULT_SKILLS: DefaultSkill[] = [
  {
    name: "Build Agent Team",
    description:
      "Create and configure new agent teams from natural language descriptions. Understands requirements and builds teams with appropriate agents, skills, and permissions.",
    category: "system",
    instructions:
      "When a user describes a need, analyze the requirements and create a team with: 1) Appropriate name and description, 2) Individual agents with specific roles, 3) Relevant skills, 4) CLI functions if needed. Use the create_team, create_agent, and add_skill tools.",
  },
  {
    name: "MCP Server",
    description:
      "Connect to and manage Model Context Protocol (MCP) servers. Enables agents to access external tools, APIs, and data sources through the MCP standard.",
    category: "system",
    instructions:
      "Use MCP to connect agents to external services. Supports: 1) Connecting to MCP servers via stdio or HTTP, 2) Listing available tools from connected servers, 3) Routing tool calls to the correct server. Configure via the team's config JSON.",
  },
  {
    name: "CLI Execute",
    description:
      "Execute CLI commands safely with confirmation for dangerous operations. Supports templated commands with argument substitution.",
    category: "system",
    instructions:
      "Execute registered CLI functions. Rules: 1) Only run commands registered via add_cli_function, 2) Commands marked 'dangerous' require explicit user confirmation, 3) Capture and return stdout/stderr, 4) Time out after 60 seconds.",
  },
  {
    name: "File Management",
    description:
      "Read, write, and organize files through the FileBrowser integration. Keeps project files structured and accessible.",
    category: "system",
    instructions:
      "Manage files through the FileBrowser API. Capabilities: 1) List directory contents, 2) Read file contents, 3) Create/update files, 4) Organize files into folders, 5) Search for files. All operations go through the FileBrowser REST API.",
  },
  {
    name: "Database Query",
    description:
      "Query the platform database through the Database Agent. Returns scoped data based on the requesting team's permissions.",
    category: "data",
    instructions:
      "Use the query_data tool to read from the database. Available tables: agent_teams, agents, tasks, skills, scheduled_jobs, activity_logs, improvements. Results are filtered by the requesting team's permissions.",
  },
  {
    name: "Schedule Task",
    description:
      "Schedule tasks on the calendar for future execution. Supports one-time and recurring schedules (daily, weekly, monthly).",
    category: "system",
    instructions:
      "Use the schedule_task tool to create calendar entries. Specify: 1) Which team handles the task, 2) Title and description, 3) Date/time (ISO 8601), 4) Recurrence pattern. Tasks appear on the Schedule calendar page.",
  },
  {
    name: "Import/Export Teams",
    description:
      "Export agent team configurations as JSON for backup or sharing. Import team configs from files or URLs to quickly set up new environments.",
    category: "system",
    instructions:
      "Export: GET /api/export-team/:id returns full team config JSON. Import: POST /api/import-team with team config JSON creates the team, agents, skills, and CLI functions.",
  },
];

/** The default Database Agent team definition */
export const DB_AGENT_TEAM = {
  name: "Database Agent",
  description:
    "System agent that manages all database access. Other agents request data through this team, which enforces permission scopes.",
  port: 9000,
  language: "TypeScript / Internal",
  config: {
    permissions: ["db:read:all", "db:write:all", "files:read", "files:write", "teams:create", "teams:delete", "skills:manage"],
    isSystemTeam: true,
  },
};

/** The default File Manager team definition */
export const FILE_AGENT_TEAM = {
  name: "File Manager",
  description:
    "System agent that organizes and manages files through FileBrowser. Keeps project files structured and accessible.",
  port: 9001,
  language: "TypeScript / Internal",
  config: {
    permissions: ["db:read:own_team", "db:write:own_team", "files:read", "files:write"],
    isSystemTeam: true,
  },
};
