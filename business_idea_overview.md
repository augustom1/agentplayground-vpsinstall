# Agent Playground — Business Overview

> Last updated: 2026-03-20
> Replaces the original `Servicios Digitales` overview. Prices and billing details removed — to be defined separately.

---

## 1. What This Platform Is

A personal AI operations center that runs a digital services business for small businesses in Latin America. The operator (you) manages AI agent teams through a private admin dashboard. Those agents do the actual work: scheduling social media content, tracking client finances, handling customer chat, building client websites.

There are two versions of the platform:

**Personal Version** — You are the only user. The dashboard is your cockpit. You task agents, monitor clients, and deliver services. No auth, no billing system, runs on a single VPS.

**SaaS Version** — Other operators license the platform to run their own digital services businesses. Each operator gets a private workspace. Requires auth, billing, onboarding, and white-labeling. Built on top of the personal version once the core is proven.

---

## 2. Platform Components

### Admin Dashboard (`agent_dashboard_ui_app/`)
The operator's command center. Built with Next.js 16.

| Page | What it does |
|------|-------------|
| `/dashboard` | Live overview — agent health, activity feed, client stats |
| `/playground` | Direct task dispatch to any agent team, with streaming output |
| `/chat` | Claude-powered copilot — natural language interface to all agents and data |
| `/teams` | Manage agent teams — status, config, deploy, create new |
| `/clients` | Client CRM — plans, bundles, billing status, deploy actions |
| `/schedule` | Unified scheduler — agent tasks, personal events, off-hours optimization *(planned)* |
| `/settings` | Env var status, API key config, quick links |

### Agent Microservices (`agents/` in the original repo)
Self-contained Python FastAPI services, each in a Docker container.

| Agent | Port | What it does |
|-------|------|-------------|
| Marketing | 8001 | Schedule and manage social media posts |
| Accounting | 8002 | Track income and expenses, generate summaries |
| Messaging | 8003 | AI chatbot for client customer support (Claude or Ollama) |
| Website Builder | 3001 | Scaffold client websites from questionnaire data *(not yet built)* |

### Supporting Infrastructure
- **Traefik** — reverse proxy with automatic SSL, routes subdomains to client bundles
- **Docker Compose bundles** — pre-configured stacks for each service tier
- **Resend** — email delivery for onboarding and contact forms
- **SQLite** *(planned)* — persistent storage for all agents and the scheduler
- **Marketing Website** — public-facing Next.js site where clients learn about services and sign up

---

## 3. Architecture

```
Operator (You)
    │
    ▼
Admin Dashboard  ←→  Claude API
    │
    ├── /api/health  →  agents: GET /health
    ├── /api/chat    →  Claude (with agent + client context)
    └── /api/task    →  Claude (orchestrates) → agents: POST endpoints

Agent Microservices (per client subdomain)
    ├── Marketing   :8001
    ├── Accounting  :8002
    ├── Messaging   :8003
    └── Website Builder :3001

Traefik (SSL + subdomain routing)
    ├── yourdomain.com          → Marketing website
    ├── admin.yourdomain.com    → Admin Dashboard
    └── client1.yourdomain.com → Client 1 agent bundle

AI
    ├── Anthropic Claude API  (primary)
    └── Ollama                (local fallback)
```

---

## 4. The Scheduler — Cross-Cutting Feature

The scheduler is a shared layer used by every part of the platform. It is not just a cron runner — it is the platform's sense of time.

**What it handles:**
- Agent tasks scheduled to run at specific times (e.g. post a social update every Monday at 9am)
- Recurring jobs (weekly accounting summaries, monthly client reports)
- One-off tasks dispatched from Chat or Playground with a "run at" time
- Personal calendar events and reminders for the operator
- Activity log — every completed job writes a record, which feeds the dashboard activity feed

**Off-hours optimization:**
- Operator marks their "away" or "sleep" windows in the scheduler
- Heavy, long-running tasks (website generation, batch content creation, report generation) are automatically queued to run during those windows
- Claude reads the schedule and can suggest: "You have 4 hours free tonight — want me to queue the website build and the February accounting summary?"

**Architecture:**
- SQLite table `scheduled_jobs` with status tracking
- Node.js cron runner (or Python APScheduler on the agent side)
- Dashboard `/schedule` page with calendar/timeline view
- All agent teams read from and write to the schedule via a shared API endpoint

---

## 5. What's Built vs. What's Not

### Built
- Admin dashboard UI (all 5 pages + sidebar, dark theme)
- Claude-powered Chat with real streaming
- Playground with streaming task output and run history
- Live agent health polling
- Settings page
- Git repository initialized

### Not Yet Built

| Gap | Impact | Effort |
|-----|--------|--------|
| **Scheduler** — unified scheduling + off-hours optimizer | No recurring jobs, no activity log, no calendar | High |
| **Website Builder agent** | Clients on the Web plan get nothing | High |
| **SQLite persistence** | All agent data lost on restart | Medium |
| **Real task dispatch** | Playground narrates tasks via Claude but doesn't call agents | Medium |
| **Client deploy flow** | "Deploy Bundle" button is UI-only, no real deploy | Medium |
| **Auth** | Dashboard is open — required before SaaS version | Medium |
| **Live activity feed** | Currently uses mock data | Low |
| **Monitoring / alerts** | No notification if an agent goes down | Low |
| **CI/CD** | Manual deploys only | Low |

---

## 6. Two Versions — Build Order

### Personal Version (build first)
1. Get the dashboard running locally, confirm all 5 pages work
2. Wire real task dispatch to running agents
3. Add SQLite persistence to all agents
4. Build the Scheduler (the most impactful feature)
5. Build the Website Builder agent
6. Deploy everything to VPS, go live with first client
7. Add monitoring

### SaaS Version (build after personal version is proven)
1. Add authentication (NextAuth or Clerk)
2. Add workspace isolation (per-operator data scoping)
3. Add billing (Stripe or MercadoPago) — pricing to be defined
4. Build self-serve operator onboarding
5. Add white-labeling (custom domain + branding per workspace)
6. Add super-admin panel
7. Add CI/CD

---

## 7. Business Model

**Personal version:** You use it to deliver digital services to small businesses in Latin America. Revenue comes from client subscriptions. The dashboard is your internal tool — clients never see it.

**SaaS version:** Other operators (agencies, freelancers, consultants in LatAm) license the platform to run their own digital services businesses. Revenue from operator subscriptions. Pricing and tiers to be defined separately.

---

## 8. Client Services Offered

| Module | What clients receive |
|--------|---------------------|
| Web Presence | A generated, deployed business website |
| Marketing | AI-managed social media scheduling and content |
| Accounting | Monthly income/expense tracking and reporting |
| Messaging | 24/7 AI chatbot on their website |
| Full Bundle | All of the above |

Each client gets their own subdomain and a bundle of these services deployed exclusively for them.

---

*See `agent_playground_overview.md` for the technical architecture.*
*See `agent_playground_dev.md` for the full developer to-do list and code reference.*
*See `agent_playground_client.md` for client-facing documentation and onboarding guides.*
