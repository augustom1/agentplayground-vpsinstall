import Anthropic from "@anthropic-ai/sdk";

const AGENTS_BASE_URL = process.env.AGENTS_BASE_URL ?? "http://localhost";

const AGENT_PORTS: Record<string, number> = {
  marketing:       Number(process.env.AGENT_MARKETING_PORT       ?? 8001),
  accounting:      Number(process.env.AGENT_ACCOUNTING_PORT      ?? 8002),
  messaging:       Number(process.env.AGENT_MESSAGING_PORT       ?? 8003),
  "website-builder": Number(process.env.AGENT_WEBSITE_BUILDER_PORT ?? 3001),
};

function agentSystemPrompt(target: string): string {
  const base = `You are an AI orchestrator for the "${target}" agent in a digital services platform.
Your job is to:
1. Interpret the operator's natural language task
2. Determine the correct API call(s) to make to the agent
3. Report what was done clearly and concisely

If the agent is unreachable, say so clearly.
Use ✓ and ✗ symbols. Be brief. Format any data (lists, tables) cleanly.`;

  const agentDocs: Record<string, string> = {
    marketing: `
Marketing Agent API (base: ${AGENTS_BASE_URL}:${AGENT_PORTS.marketing}):
- POST /schedule  body: { "content": string, "scheduled_for": "YYYY-MM-DDTHH:MM" }
- GET /posts      returns: list of scheduled posts`,

    accounting: `
Accounting Agent API (base: ${AGENTS_BASE_URL}:${AGENT_PORTS.accounting}):
- POST /transactions  body: { "type": "income"|"expense", "amount": number, "category": string, "description": string }
- GET /transactions   returns: all transactions
- GET /summary        returns: totals by category`,

    messaging: `
Messaging Agent API (base: ${AGENTS_BASE_URL}:${AGENT_PORTS.messaging}):
- POST /message  body: { "message": string }  returns: AI reply`,

    "website-builder": `
Website Builder: Not yet implemented. Inform the operator and suggest using the questionnaire flow manually.`,

    "all teams": `
You are checking all agents. Ping each one and report their status.
Agent ports: Marketing :${AGENT_PORTS.marketing}, Accounting :${AGENT_PORTS.accounting}, Messaging :${AGENT_PORTS.messaging}, Website Builder :${AGENT_PORTS["website-builder"]}`,
  };

  const key = target.toLowerCase();
  return base + (agentDocs[key] ?? "");
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("ANTHROPIC_API_KEY is not set. Add it to .env.local.", { status: 500 });
  }

  const { target, prompt } = await req.json() as { target: string; prompt: string };

  // If targeting a specific agent, try to ping it first and include status in context
  let agentStatus = "";
  const key = target.toLowerCase().replace(" ", "-");
  const port = AGENT_PORTS[key];
  if (port) {
    try {
      const res = await fetch(`${AGENTS_BASE_URL}:${port}/health`, {
        signal: AbortSignal.timeout(2000),
        cache: "no-store",
      });
      agentStatus = res.ok
        ? `\n\nAgent health check: ✓ online (${AGENTS_BASE_URL}:${port})`
        : `\n\nAgent health check: ✗ responded with ${res.status}`;
    } catch {
      agentStatus = `\n\nAgent health check: ✗ unreachable at ${AGENTS_BASE_URL}:${port}`;
    }
  }

  const client = new Anthropic({ apiKey });

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: agentSystemPrompt(target) + agentStatus,
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      // Stream a header line first
      controller.enqueue(encoder.encode(`> Task dispatched to: ${target}\n`));
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
