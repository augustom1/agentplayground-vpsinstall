# Agent Dashboard

> AI-native operations platform — build, manage, and deploy agent teams through conversation.

## Quick Start

```bash
# 1. Clone and configure
cp .env.local.example .env.local
# Edit .env.local with your API keys

# 2. Install dependencies
npm install

# 3. Start development
npm run dev
```

## Production Deployment

```bash
# Start full stack (Next.js + PostgreSQL + FileBrowser)
docker compose up -d --build

# Run database migrations
docker compose exec dashboard npx prisma db push
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full VPS + domain + SSL guide.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Runtime | React 19 / Node 20+ |
| Database | PostgreSQL + pgvector |
| ORM | Prisma 7 |
| AI | Anthropic Claude |
| Styling | Tailwind CSS v4 |
| Files | FileBrowser (container) |
| Deployment | Docker Compose |

## Architecture

```
Chat Interface (primary)
  ├── Claude + Tools → create teams, agents, skills
  ├── DB Agent → manages all database access
  └── File Agent → manages files via FileBrowser

Dashboard (customizable)
  ├── Widget-based, empty by default
  ├── Agent Lab (teams + playground)
  ├── Schedule (monthly calendar)
  └── Files (FileBrowser)
```

## Project Structure

```
app/
  api/          ← REST API routes
  agent-lab/    ← merged playground + teams
  chat/         ← AI chat (primary interface)
  dashboard/    ← customizable widget dashboard
  schedule/     ← monthly calendar
  settings/     ← configuration
lib/
  modules/      ← extractable modules for reuse
  prisma.ts     ← database client
  chat-tools.ts ← Claude tool definitions
  db-agent.ts   ← database access layer
prisma/
  schema.prisma ← database schema (15 tables)
docs/
  architecture.md
  client-version.md
```
