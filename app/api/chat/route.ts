import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are an AI operations copilot for a one-person digital services business targeting small businesses in Latin America.

You have access to the following agent teams:
- Marketing Agent (port 8001): schedules and manages social media posts. API: POST /schedule { "content": "...", "scheduled_for": "ISO date" }, GET /posts
- Accounting Agent (port 8002): tracks income and expenses. API: POST /transactions { "type": "income|expense", "amount": number, "category": "...", "description": "..." }, GET /transactions, GET /summary
- Messaging Agent (port 8003): AI chatbot for customer support. API: POST /message { "message": "..." }
- Website Builder (port 3001): scaffolds client websites from questionnaire data. Not yet implemented.

Current clients:
- Tacos El Gordo (cliente1.tudominio.com) — Full BCS Bundle, active, paid
- Ferretería López (cliente2.tudominio.com) — Marketing + Messaging, active, manual billing
- Estudio Creativo MX (cliente3.tudominio.com) — Messaging only, pending

Your role:
- Answer questions about agent status, client data, and business metrics
- Help the operator task their agents by describing exactly what API call to make
- Suggest actions proactively (e.g. "Ferretería López hasn't had posts scheduled this week")
- Be concise and direct — this is an internal tool, not a customer-facing product
- When referencing API calls, use monospace formatting
- Use ✓ for successes and ✗ for failures/issues`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("ANTHROPIC_API_KEY is not set. Add it to .env.local.", { status: 500 });
  }

  const { messages } = await req.json() as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  const client = new Anthropic({ apiKey });

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
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
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
