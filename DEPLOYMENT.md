# Agent Dashboard — VPS Deployment Guide

Everything runs in Docker. **No Nginx, no Node.js, no Certbot to install on the host.**
The stack is: Traefik (HTTPS) → Next.js → PostgreSQL, all in containers.

---

## What you need

- A VPS running **Ubuntu 22.04+** (any provider — DigitalOcean, Hetzner, Vultr, etc.)
- A **domain name** with an A record pointing to your VPS IP
- Your **Anthropic API key**
- 5 minutes

---

## Step 1 — Point your domain

At your domain registrar, create an A record:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `YOUR_VPS_IP` |

DNS propagation takes 1–30 minutes. You can continue setup while waiting.

---

## Step 2 — Install Docker on your VPS

```bash
ssh root@YOUR_VPS_IP

curl -fsSL https://get.docker.com | sh

# Verify
docker --version        # Docker 24+
docker compose version  # v2.20+
```

---

## Step 3 — Upload the project

**Option A — Git (recommended):**
```bash
git clone https://github.com/YOUR_USERNAME/agent-dashboard.git /opt/agent-dashboard
cd /opt/agent-dashboard
```

**Option B — SCP from your local machine:**
```bash
# Run this on your local machine, not the VPS
scp -r ./agent_dashboard_ui_app root@YOUR_VPS_IP:/opt/agent-dashboard
```

---

## Step 4 — Configure environment

```bash
cd /opt/agent-dashboard
cp .env.local.example .env.local
nano .env.local
```

Fill in these values (minimum required):

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here

POSTGRES_PASSWORD=use-a-strong-random-password

DOMAIN=yourdomain.com
ACME_EMAIL=you@yourdomain.com

AUTH_SECRET=generate-with-openssl-rand-hex-32
CRON_SECRET=generate-with-openssl-rand-hex-32
```

Generate both secrets in one step:
```bash
echo "AUTH_SECRET=$(openssl rand -hex 32)" >> .env.local
echo "CRON_SECRET=$(openssl rand -hex 32)" >> .env.local
```

---

## Step 5 — Deploy

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

That's it. This single command:
- Builds the Next.js app
- Starts PostgreSQL with pgvector
- **Automatically runs database migrations** on first boot
- Starts Traefik and obtains your SSL certificate from Let's Encrypt
- Starts the recurring task cron executor
- Configures automatic HTTP → HTTPS redirect

---

## Step 6 — Verify

```bash
# All containers should be running
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Check app logs (migrations run first, then app starts)
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs dashboard

# Check SSL cert was issued
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs traefik | grep "certificate"
```

Visit `https://yourdomain.com` — you will be redirected to `/setup` to create your admin account (this screen appears only once, then disappears forever once an account exists).

---

## Updating the application

```bash
cd /opt/agent-dashboard
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
# Migrations run automatically on restart — no manual step needed
```

---

## Database backups

```bash
# Create backup script
cat > /opt/backup-db.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p /opt/backups
docker compose -f /opt/agent-dashboard/docker-compose.yml exec -T postgres \
  pg_dump -U postgres agent_dashboard > /opt/backups/db_${TIMESTAMP}.sql
# Keep only last 7 days
find /opt/backups -name "db_*.sql" -mtime +7 -delete
echo "Backup complete: db_${TIMESTAMP}.sql"
EOF

chmod +x /opt/backup-db.sh

# Schedule daily at 3am
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/backup-db.sh") | crontab -
```

---

## Architecture

```
Internet
  ↓ port 80  → Traefik → redirect to HTTPS
  ↓ port 443 → Traefik (TLS termination, Let's Encrypt cert)
                ↓
                Next.js Dashboard (port 3000, internal only)
                  ↓
                  PostgreSQL + pgvector (port 5432, internal only)

Cron (alpine) → pings /api/cron every minute for recurring tasks
```

Postgres is **not exposed** to the internet in production — only accessible within Docker's internal network.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Certificate not issued | Ensure DNS A record is set and `DOMAIN` in `.env.local` matches exactly |
| App stuck at "Waiting for database" | `docker compose logs postgres` — check if postgres is healthy |
| 502 Bad Gateway | App is still starting — wait 20s, then retry |
| Port 80/443 already in use | Another process is using it: `ss -tlnp \| grep ':80\|:443'` |
| DB schema out of date | Migrations run automatically on every restart |

---

## Local development (no HTTPS needed)

```bash
# Just use the base compose file — no Traefik, port 3000 exposed directly
docker compose up -d --build
# Visit http://localhost:3000
```
