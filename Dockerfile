# ─────────────────────────────────────────────
# Agent Dashboard — Multi-stage Docker build
# ─────────────────────────────────────────────
# Produces a lean image that auto-migrates the
# database on startup before serving the app.
#
# Build:  docker build -t agent-dashboard .
# Run:    docker run -p 3000:3000 --env-file .env.local agent-dashboard
# ─────────────────────────────────────────────

# ── Stage 1: Install dependencies ──────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ── Stage 2: Build the application ─────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build-time env vars (non-secret defaults)
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: Production runner ─────────────
# node:20-slim (Debian) is required — Ollama needs glibc (not available on Alpine)
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
# Store Ollama models inside /app so we control ownership
ENV OLLAMA_MODELS=/app/.ollama/models

# Install Ollama
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    curl -fsSL https://ollama.ai/install.sh | sh

# Pre-pull llama3.2:3b (~2 GB) so the model is baked into the image.
# ollama serve runs in the background during this RUN layer only.
RUN mkdir -p /app/.ollama/models && \
    ollama serve & \
    sleep 15 && \
    ollama pull llama3.2:3b && \
    kill %1 || true

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Hand model ownership to the app user
RUN chown -R nextjs:nodejs /app/.ollama

# Copy standalone output + static assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema + generated client + CLI (needed for db push at startup)
COPY --from=builder /app/node_modules/.prisma  ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma  ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma   ./node_modules/prisma
COPY --from=builder /app/prisma                ./prisma

# Copy entrypoint and make it executable (must happen before USER switch)
COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000
EXPOSE 11434

ENTRYPOINT ["./entrypoint.sh"]
