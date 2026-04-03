export async function POST(req: Request) {
  const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  let model: string;

  try {
    const body = await req.json();
    model = body.model;
    if (!model) return new Response("Missing model name", { status: 400 });
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch(`${OLLAMA_BASE}/api/pull`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: model, stream: true }),
          signal: AbortSignal.timeout(600000),
        });

        if (!res.ok) {
          controller.enqueue(
            new TextEncoder().encode(JSON.stringify({ error: `Ollama pull failed: ${res.statusText}` }) + "\n")
          );
          controller.close();
          return;
        }

        const reader = res.body!.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } catch (err) {
        controller.enqueue(
          new TextEncoder().encode(JSON.stringify({ error: String(err) }) + "\n")
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
