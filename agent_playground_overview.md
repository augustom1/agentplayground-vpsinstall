# Agent Playground — Project Overview

> Last updated: 2026-03-20

---

## What This Is

Agent Playground is a personal AI operations dashboard. You use it to build, manage, and task AI agent teams that do real work on your behalf — scheduling social media posts, tracking finances, handling customer chats, building client websites.

It is **not** a product you sell to end clients directly. It is the cockpit you fly from.

The platform comes in two versions:

| Version | Who it's for | What it does |
|---------|-------------|--------------|
| **Personal** | You, the operator | Full ops center — manage your own agent teams, task them, monitor everything, run your digital services business |
| **SaaS** | Other operators (future) | A white-labeled, multi-tenant version other people can license to run their own agent businesses |

Both versions share the same core codebase. The SaaS version adds multi-tenancy, billing, and a self-serve onboarding flow.

---

## Core Philosophy

- **You are the product.** The agents work for you. You use them to deliver services to your clients.
- **Everything grows as you use it.** New agent teams get added as you need them. The dashboard adapts.
- **Claude is the brain.** The AI copilot in Chat and Playground can task any agent using natural language. You don't need to know the API details.
- **Runs anywhere.** Locally on your machine, on a cheap VPS, or scaled out — the same Docker-based architecture works everywhere.

---

## The Five Pillars

### 1. Dashboard
Real-time overview of all agent teams and clients. Live health badges, activity feed, key metrics. The first thing you see every morning.

### 2. Playground
A direct task interface. Pick a target (one team or all), describe what you want, hit Run. See the output stream in a terminal. Build your run history.

### 3. Chat (AI Copilot)
A Claude-powered conversation interface with full context of your agents and clients. Issue commands in plain English, get answers about your business, dispatch work, review summaries. This is the power-user default.

### 4. Agent Teams
Create, configure, and monitor your agent teams. Each team is a containerized microservice. The dashboard tracks their status, which clients they serve, and their task history. New teams can be scaffolded via the "Create" flow — describe what the team should do, Claude generates the code.

### 5. Scheduler *(planned)*
A shared scheduling layer across all agent teams. Schedule tasks to run at specific times, set recurring jobs, block out your personal calendar. The system optimizes heavy AI tasks to run during your off-hours (sleeping, away) so they don't compete with your focus time. Every team can read and write to the schedule.

---

## Architecture

```
You (Browser)
    │
    ▼
Agent Dashboard (Next.js 16 — this repo)
    ├── /dashboard     → overview + live health
    ├── /playground    → direct task dispatch
    ├── /chat          → Claude copilot
    ├── /teams         → manage agent teams
    ├── /clients       → client CRM
    ├── /schedule      → unified scheduler (planned)
    │
    └── API Routes
            ├── /api/health   → polls agent /health endpoints
            ├── /api/chat     → streams Claude responses
            └── /api/task     → orchestrates task dispatch via Claude

Python Agent Microservices (FastAPI, Docker)
    ├── Marketing Agent   :8001  → social media scheduling
    ├── Accounting Agent  :8002  → income/expense tracking
    ├── Messaging Agent   :8003  → AI chatbot (Claude or Ollama)
    └── Website Builder   :3001  → client site scaffolding (planned)

AI Layer
    ├── Anthropic Claude API  (primary — powers Chat, Playground, Messaging)
    └── Ollama                (local fallback — no API key required)

Infrastructure
    ├── Docker + Docker Compose  (all services containerized)
    ├── Traefik                  (reverse proxy + auto SSL)
    └── VPS (Ubuntu 22.04)       (runs everything)
```

---

## Current State (2026-03-20)

### Built
- Full dashboard UI (5 pages + sidebar) with dark theme
- Live agent health polling
- Claude-powered Chat with streaming responses
- Playground with streaming task output and run history
- Settings page with env var status
- Mock data layer (replaces real APIs until agents are running)
- Git repo initialized

### In Progress / Planned
See `agent_playground_dev.md` for the full to-do list.

---

## Two Versions — Key Differences

### Personal Version
- Single operator (you)
- Runs on one VPS or locally
- No auth needed (it's yours)
- No billing system
- Agents are your internal tools

### SaaS Version
- Multiple operators, each with their own workspace
- Auth required (login, API keys)
- Billing integration (Stripe or MercadoPago)
- Onboarding flow for new operators
- White-label support (custom domain, branding)
- Admin super-panel to manage all tenants
- Pricing to be defined separately

The personal version is what you build and use first. The SaaS version is extracted from it once the core is proven.
