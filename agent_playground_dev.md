# Agent Playground — Developer Reference

> Last updated: 2026-03-20

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + inline CSS variables |
| UI icons | Lucide React |
| AI SDK | `@anthropic-ai/sdk` |
| Agent services | Python 3.12 + FastAPI + Uvicorn |
| Containerization | Docker + Docker Compose |
| Reverse proxy | Traefik (production) |
| Runtime | Node 20+ (dashboard), Python 3.12 (agents) |

---

## Project Structure

```
agent_dashboard_ui_app/
│
├── app/                          Next.js App Router
│   ├── layout.tsx                Root shell — Sidebar + main wrapper
│   ├── page.tsx                  / → redirect to /dashboard
│   ├── globals.css               Dark theme tokens + Tailwind v4 import
│   │
│   ├── dashboard/page.tsx        Overview — stats, teams, activity, clients
│   ├── playground/page.tsx       Task dispatch — streams from /api/task
│   ├── chat/page.tsx             AI copilot — streams from /api/chat
│   ├── teams/page.tsx            Agent team management
│   ├── clients/page.tsx          Client CRM
│   ├── settings/page.tsx         Env var status + quick links
│   │
│   └── api/
│       ├── health/route.ts       GET  — polls all agent /health endpoints
│       ├── chat/route.ts         POST — streams Claude responses
│       └── task/route.ts         POST — orchestrates task dispatch, streams
│
├── components/
│   ├── Sidebar.tsx               Left nav with active-route highlighting
│   ├── StatusBadge.tsx           Colored pill: healthy/idle/error/deploying
│   └── RefreshButton.tsx         Client-side router.refresh() trigger
│
├── lib/
│   ├── mock-data.ts              Seed data: agent teams, clients, activity
│   └── utils.ts                  cn() — Tailwind class merger
│
├── .env.local.example            Template for required env vars
├── .env.local                    Your secrets — never commit
└── package.json
```

---

## Environment Variables

Copy `.env.local.example` → `.env.local` and fill in:

```env
# Required
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx

# Optional — defaults shown
AGENTS_BASE_URL=http://localhost
AGENT_MARKETING_PORT=8001
AGENT_ACCOUNTING_PORT=8002
AGENT_MESSAGING_PORT=8003
AGENT_WEBSITE_BUILDER_PORT=3001
```

Restart `npm run dev` after changing `.env.local`.

---

## Running Locally

```bash
# Install dependencies
npm install

# Start dashboard
npm run dev
# → http://localhost:3000

# Start Python agents (optional — dashboard works without them)
cd ../servicios-digitales/agents/marketing && uvicorn main:app --port 8001
cd ../servicios-digitales/agents/accounting && uvicorn main:app --port 8002
cd ../servicios-digitales/agents/messaging && uvicorn main:app --port 8003
```

Or start all agents at once via Docker:
```bash
docker compose -f ../servicios-digitales/bundles/full-bcs/docker-compose.yml up -d
```

---

## API Routes

### `GET /api/health`
Pings all 4 agent `/health` endpoints (2s timeout each) in parallel.

**Response:**
```json
[
  { "id": "marketing", "name": "Marketing", "port": 8001, "status": "healthy" },
  { "id": "accounting", "name": "Accounting", "port": 8002, "status": "error" },
  ...
]
```

---

### `POST /api/chat`
Streams a Claude response with a system prompt that describes all agent teams and clients.

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "Show me March expenses" },
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "Break it down by category" }
  ]
}
```

**Response:** `text/plain` stream — raw token chunks.

The system prompt gives Claude full context: agent APIs, current clients, operator role. Extend it in `app/api/chat/route.ts` → `SYSTEM_PROMPT` as you add teams or clients.

---

### `POST /api/task`
Pings the target agent's health first, then sends the task to Claude with that agent's API docs as context. Streams back a narrated response.

**Request body:**
```json
{
  "target": "Marketing",
  "prompt": "Schedule 3 posts about our new menu for this week"
}
```

**Response:** `text/plain` stream.

To make this actually call the agent (not just narrate), add a `fetch()` after Claude interprets the task — see the `// TODO: call agent` section in `app/api/task/route.ts`.

---

## Mock Data

`lib/mock-data.ts` is the single source of truth for all seed data:
- `agentTeams` — 4 teams with status, ports, task counts
- `clients` — 3 clients with plans, bundles, billing status
- `recentActivity` — feed items for the dashboard
- `playgroundHistory` — pre-seeded run history

Replace individual imports with `fetch()` calls as you wire up real backends. The Dashboard page already does a live health fetch and falls back to mock statuses if agents are offline.

---

## Adding a New Agent Team

1. **Build the agent** — FastAPI service, pick an unused port, add a `GET /health` endpoint
2. **Add to mock-data** — add an entry to `agentTeams` in `lib/mock-data.ts`
3. **Register the port** — add `AGENT_<NAME>_PORT` to `.env.local.example` and `app/api/health/route.ts`
4. **Update the task route system prompt** — add the new agent's API docs to `agentSystemPrompt()` in `app/api/task/route.ts`
5. **Update the chat system prompt** — add it to `SYSTEM_PROMPT` in `app/api/chat/route.ts`
6. **Docker** — add a service entry to the relevant `bundles/` compose file

---

## To-Do List

### Core — Must have before using in production

- [ ] **Scheduler** — unified scheduling layer across all agent teams
  - Calendar/timeline view at `/schedule`
  - Each agent team can schedule tasks (cron-like or one-shot)
  - Personal events/reminders mixed in (your own calendar)
  - "Sleep mode" scheduler: user marks away/sleep hours, system queues heavy AI tasks (website builds, batch posts, report generation) to run during those windows
  - Claude can read the schedule and suggest optimal timing
  - Backend: SQLite table `scheduled_jobs` + a Node cron runner or Python APScheduler
  - Every completed job writes to an activity log (feeds the dashboard feed)
- [ ] **SQLite persistence** — replace all in-memory agent storage with a real DB
  - Marketing: store posts table
  - Accounting: store transactions table
  - Shared: scheduler jobs, activity log, client registry
- [ ] **Real task dispatch** — in `app/api/task/route.ts`, after Claude interprets the task, actually `fetch()` the agent endpoint and include the real response
- [ ] **Website Builder agent** — implement `agents/website-builder/main.py`; reads questionnaire JSON, scaffolds a Next.js site using Claude, returns a download or deploys it

### Dashboard improvements

- [ ] **Live activity feed** — replace mock `recentActivity` with real events from a DB activity log
- [ ] **Per-team task history** — clicking a team shows its full task log, not just last activity
- [ ] **Client deploy flow** — "Deploy Bundle" button in `/clients` runs `deploy.sh` via a server action and streams the output
- [ ] **Metrics charts** — simple sparklines on the stat cards (tasks per day, etc.)

### Teams & Agents

- [ ] **Create Team wizard** — multi-step form where you describe the team, Claude generates the FastAPI boilerplate, you review and deploy
- [ ] **View Logs** button — streams Docker container logs for the selected team
- [ ] **Config editor** — edit a team's env vars from the UI, restart the container

### Security (required before SaaS version)

- [ ] **Auth** — protect the dashboard with a login (simple password or OAuth)
- [ ] **Agent authentication** — API key header required on all agent endpoints
- [ ] **Rate limiting** on `/api/chat` and `/api/task`

### SaaS version (future)

- [ ] **Multi-tenancy** — workspace isolation per operator
- [ ] **Billing** — Stripe or MercadoPago integration
- [ ] **Self-serve onboarding** — new operator signs up, picks a plan, gets a workspace
- [ ] **White-labeling** — custom domain + logo per workspace
- [ ] **Super-admin panel** — view all tenants, usage, revenue
- [ ] **CI/CD** — auto-deploy on push to main

### Infrastructure

- [ ] **Dockerfile** — add one for the dashboard itself (same pattern as `website/Dockerfile`)
- [ ] **Add dashboard to `bundles/full-bcs/docker-compose.yml`** behind Traefik at `admin.yourdomain.com`
- [ ] **Monitoring** — basic uptime alerts if any agent goes dark

---

## Key Design Decisions

**Why inline `style={{}}` for colors instead of Tailwind classes?**
Tailwind v4 uses `@theme inline` for custom tokens. Rather than fighting the config, inline styles give direct access to the CSS variable palette and make the intent explicit. Tailwind handles spacing/layout; styles handle brand colors.

**Why Server Components for Dashboard but Client Components for Chat/Playground?**
Dashboard data (health checks, client list) is fetched once per load — no interactivity needed, so Server Component is the right default. Chat and Playground need `useState` for streaming buffers, so they're Client Components.

**Why Claude as the task orchestrator instead of hardcoded routing?**
Agent APIs will change as you build them. Having Claude read the API docs at call-time means you don't need to update routing logic every time an endpoint changes — you just update the system prompt.
