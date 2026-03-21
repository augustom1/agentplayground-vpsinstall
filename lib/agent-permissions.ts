/**
 * Agent Permission System
 *
 * Defines scoped access levels for agent teams.
 * The Database Agent has full access; other teams get scoped permissions.
 */

export type PermissionScope =
  | "db:read:own_team"
  | "db:write:own_team"
  | "db:read:schedule"
  | "db:write:schedule"
  | "db:read:all"
  | "db:write:all"
  | "files:read"
  | "files:write"
  | "cli:execute"
  | "cli:execute:dangerous"
  | "teams:create"
  | "teams:delete"
  | "skills:manage"
  | "mcp:connect";

export interface AgentPermissions {
  teamId: string;
  scopes: PermissionScope[];
}

/** Default permission sets for different team roles */
export const PERMISSION_PRESETS: Record<string, PermissionScope[]> = {
  /** Full access — only for the Database Agent */
  admin: [
    "db:read:all",
    "db:write:all",
    "files:read",
    "files:write",
    "cli:execute",
    "cli:execute:dangerous",
    "teams:create",
    "teams:delete",
    "skills:manage",
    "mcp:connect",
  ],

  /** Standard agent team — can read/write own data + read schedule */
  standard: [
    "db:read:own_team",
    "db:write:own_team",
    "db:read:schedule",
    "files:read",
  ],

  /** Builder agents — can create teams and skills */
  builder: [
    "db:read:all",
    "db:write:own_team",
    "db:read:schedule",
    "db:write:schedule",
    "files:read",
    "files:write",
    "teams:create",
    "skills:manage",
    "cli:execute",
    "mcp:connect",
  ],

  /** Read-only — for monitoring/reporting agents */
  readonly: [
    "db:read:own_team",
    "db:read:schedule",
    "files:read",
  ],
};

/**
 * Check if a set of permissions includes a specific scope.
 */
export function hasPermission(
  permissions: PermissionScope[],
  required: PermissionScope
): boolean {
  // Admin scopes grant everything
  if (permissions.includes("db:read:all") && required.startsWith("db:read:")) return true;
  if (permissions.includes("db:write:all") && required.startsWith("db:write:")) return true;
  return permissions.includes(required);
}

/**
 * Filter database results based on team permissions.
 * If the team has "db:read:all", return everything.
 * Otherwise, filter to only records belonging to that team.
 */
export function scopeFilter(
  permissions: PermissionScope[],
  teamId: string
): { teamId?: string } {
  if (permissions.includes("db:read:all")) return {};
  return { teamId };
}
