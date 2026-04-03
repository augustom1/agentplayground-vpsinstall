#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# Postgres init script — runs once on first container startup.
# Creates additional databases in the shared Postgres instance.
# Each service gets its own database but shares the same server,
# so agents and tools can query across all data freely.
# ─────────────────────────────────────────────────────────────────
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- n8n workflow automation
    SELECT 'CREATE DATABASE n8n'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'n8n')\gexec

    -- Future services: uncomment or add as needed
    -- SELECT 'CREATE DATABASE myapp' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'myapp')\gexec
EOSQL

echo "[init-db] Additional databases created."
