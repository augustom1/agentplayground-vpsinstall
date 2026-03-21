import Anthropic from "@anthropic-ai/sdk";
import { CHAT_TOOLS, executeTool } from "@/lib/chat-tools";

const SYSTEM_PROMPT = `You are an AI operations platform assistant. You help users build, manage, and optimize their agent teams through conversation.

Your capabilities:
- **Create agent teams** — Build new teams of AI agents tailored to the user's needs
- **Create agents** — Add individual agents with specific roles, models, and capabilities to teams
- **Register skills** — Define what skills each team can use
- **Register CLI functions** — Set up command-line operations agents can execute
- **Schedule tasks** — Add tasks to the calendar with optional recurrence
- **Query data** — Look up teams, agents, tasks, skills, and activity logs
- **List skills** — Show all available skills in the system

When a user describes what they need, proactively:
1. Ask clarifying questions if the request is ambiguous
2. Create the team, agents, and skills using your tools
3. Confirm what was created and suggest next steps

You have built-in default skills: Build Agent Team, MCP Server, CLI Execute, File Management, Database Query, Schedule Task, Import/Export Teams.

Be concise and direct. Use ✓ for successes. Format responses cleanly with markdown.

IMPORTANT: When the user first arrives with no teams created, welcome them and ask what kind of agent teams they'd like to build. Guide them through the process.`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("ANTHROPIC_API_KEY is not set. Add it to .env.local.", { status: 500 });
  }

  let messages: Array<{ role: "user" | "assistant"; content: string }>;
  try {
    const body = await req.json();
    messages = body.messages ?? [];
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  // Convert tool definitions for Anthropic API
  const tools = CHAT_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));

  const readable = new ReadableStream({
    async start(controller) {
      try {
        let currentMessages = [...messages];
        let continueLoop = true;

        while (continueLoop) {
          const response = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 2048,
            system: SYSTEM_PROMPT,
            messages: currentMessages,
            tools: tools as Anthropic.Messages.Tool[],
          });

          continueLoop = false;

          for (const block of response.content) {
            if (block.type === "text") {
              controller.enqueue(encoder.encode(block.text));
            } else if (block.type === "tool_use") {
              // Execute the tool
              const result = await executeTool(
                block.name,
                block.input as Record<string, unknown>
              );

              // Stream a status update to the user
              controller.enqueue(
                encoder.encode(`\n\n⚡ *Used tool: ${block.name}*\n\n`)
              );

              // Add tool use and result to messages for the next iteration
              currentMessages = [
                ...currentMessages,
                { role: "assistant" as const, content: response.content as unknown as string },
                {
                  role: "user" as const,
                  content: [
                    {
                      type: "tool_result",
                      tool_use_id: block.id,
                      content: result,
                    },
                  ] as unknown as string,
                },
              ];

              // Continue the loop so Claude can process the tool result
              continueLoop = true;
            }
          }

          // If stop_reason is "end_turn" with no tool use, we're done
          if (response.stop_reason === "end_turn") {
            continueLoop = false;
          }
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`\n\n❌ Error: ${String(err)}`));
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
