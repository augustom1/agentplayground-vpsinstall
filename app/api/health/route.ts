import { NextResponse } from "next/server";

const AGENTS_BASE_URL = process.env.AGENTS_BASE_URL ?? "http://localhost";

const AGENTS = [
  { id: "marketing",       name: "Marketing",       port: Number(process.env.AGENT_MARKETING_PORT      ?? 8001) },
  { id: "accounting",      name: "Accounting",       port: Number(process.env.AGENT_ACCOUNTING_PORT     ?? 8002) },
  { id: "messaging",       name: "Messaging",        port: Number(process.env.AGENT_MESSAGING_PORT      ?? 8003) },
  { id: "website-builder", name: "Website Builder",  port: Number(process.env.AGENT_WEBSITE_BUILDER_PORT ?? 3001) },
];

export async function GET() {
  const results = await Promise.all(
    AGENTS.map(async (agent) => {
      try {
        const res = await fetch(`${AGENTS_BASE_URL}:${agent.port}/health`, {
          signal: AbortSignal.timeout(2000),
          cache: "no-store",
        });
        return { ...agent, status: res.ok ? "healthy" : "error", latencyMs: null };
      } catch {
        return { ...agent, status: "error", latencyMs: null };
      }
    })
  );

  return NextResponse.json(results);
}
