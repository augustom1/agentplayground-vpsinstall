# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────┐
│  User Interface (Next.js 16)                     │
│  ┌──────┐ ┌────────┐ ┌────────┐ ┌──────┐       │
│  │ Chat │ │  Dash  │ │A. Lab  │ │Sched.│ ...   │
│  └──┬───┘ └───┬────┘ └───┬────┘ └──┬───┘       │
│     │         │          │         │             │
│  ┌──▼─────────▼──────────▼─────────▼──┐         │
│  │      Chat Tools (Claude API)       │         │
│  │  create_team | create_agent | ...  │         │
│  └──────────────┬─────────────────────┘         │
│                 │                                │
│  ┌──────────────▼──────────────┐                │
│  │    Database Agent (lib/)     │                │
│  │  Permission-based access    │                │
│  └──────────────┬──────────────┘                │
│                 │                                │
│  ┌──────────────▼──────────────┐                │
│  │  PostgreSQL + pgvector       │                │
│  │  (15 tables, vector search)  │                │
│  └──────────────────────────────┘                │
│                                                  │
│  ┌────────────────┐                              │
│  │  FileBrowser    │  (file management)          │
│  └────────────────┘                              │
└─────────────────────────────────────────────────┘
```

## Data Flow

1. **User → Chat**: Primary interface. User describes needs in natural language.
2. **Chat → Claude API**: Claude processes with tool-use, calls platform tools.
3. **Tools → DB Agent**: All database operations go through the Database Agent.
4. **DB Agent → PostgreSQL**: Permission-checked queries execute against the database.
5. **FileBrowser ↔ Shared Volume**: File management through web UI.

## Permission Model

| Preset | Read Own | Write Own | Read All | Write All | Files | CLI | Teams |
|--------|----------|-----------|----------|-----------|-------|-----|-------|
| admin | ✓ | ✓ | ✓ | ✓ | R/W | ✓ | C/D |
| builder | ✓ | ✓ | ✓ | | R/W | ✓ | C |
| standard | ✓ | ✓ | | | R | | |
| readonly | ✓ | | | | R | | |

## Key Modules

| Module | Path | Purpose |
|--------|------|---------|
| Agent Permissions | `lib/agent-permissions.ts` | Permission scopes and checking |
| DB Agent | `lib/db-agent.ts` | Centralized database access layer |
| Chat Tools | `lib/chat-tools.ts` | Claude tool-use definitions |
| Default Skills | `lib/default-skills.ts` | Built-in platform skills |
| Seed System | `lib/seed-defaults.ts` | First-startup database seeding |
| Prisma Client | `lib/prisma.ts` | Database connection (singleton) |
