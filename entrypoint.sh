#!/bin/sh
# Agent Dashboard — Container Entrypoint
# Runs DB migrations, then starts the app.
# Ollama runs as its own separate container (vps-ollama).
set -e

# Validate required secrets
if [ -z "$AUTH_SECRET" ]; then
  echo "ERROR: AUTH_SECRET is not set. Generate one with: openssl rand -hex 32"
  exit 1
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "WARNING: ANTHROPIC_API_KEY is not set. Anthropic models will not work (Ollama models are still available)."
fi

# ── Database ─────────────────────────────────────────────────────────────────
echo "▶ Applying database schema..."
node node_modules/prisma/build/index.js db push --skip-generate

echo "▶ Starting application..."
exec node server.js
