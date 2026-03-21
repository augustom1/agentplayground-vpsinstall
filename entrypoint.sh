#!/bin/sh
# Agent Dashboard — Container Entrypoint
# Runs DB migrations automatically before starting the app.
set -e

# Validate required secrets
if [ -z "$AUTH_SECRET" ]; then
  echo "ERROR: AUTH_SECRET is not set. Generate one with: openssl rand -hex 32"
  exit 1
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "WARNING: ANTHROPIC_API_KEY is not set. Chat and Playground will not work."
fi

echo "▶ Applying database schema..."
node node_modules/prisma/build/index.js db push --skip-generate

echo "▶ Starting application..."
exec node server.js
