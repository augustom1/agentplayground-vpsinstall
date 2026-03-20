"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Zap } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

const suggestions = [
  "Schedule 3 posts for cliente1 this week",
  "Show March expense summary for Tacos El Gordo",
  "Run a health check on all teams",
  "Which clients are on the Full BCS Bundle?",
  "Deploy Marketing team to cliente3",
];

const initialMessages: Message[] = [
  {
    id: "0",
    role: "assistant",
    content:
      "Hey! I'm your agent copilot. I have visibility into all your agent teams and clients.\n\nI can help you task agents, check status, review client data, or deploy bundles — just tell me what you need.",
    timestamp: "now",
  },
];

const fakeReplies: Record<string, string> = {
  default:
    "Got it. I've relayed that to the relevant team. I'll let you know when there's output to report.",
  schedule:
    "✓ Tasked the Marketing agent.\n\n3 posts have been queued for cliente1 this week:\n- Mon 12:00 – Product spotlight\n- Wed 18:00 – Customer story\n- Fri 12:00 – Weekend promo\n\nAll set.",
  expense:
    "Here's the March summary for Tacos El Gordo:\n\nIncome:   $22,400\nExpenses: $14,200\nNet:      $8,200 (+12% vs Feb)\n\nTop expense category: Supplies ($5,100)",
  health:
    "Health check results:\n\n✓ Marketing  (8001) — online\n✓ Accounting (8002) — online\n✓ Messaging  (8003) — online\n✗ Website Builder (3001) — not responding\n\n3/4 teams healthy. Website Builder needs attention.",
  clients:
    "Clients on Full BCS Bundle:\n\n1. Tacos El Gordo — active, paid\n\nThat's the only one currently. Ferretería López is on Marketing + Messaging.",
  deploy:
    "Deploying Marketing team to cliente3 (Estudio Creativo MX)...\n\n✓ Bundle found: sub1-marketing\n✓ SSH connected\n✓ Docker compose pulled\n✓ Container started on port 8001\n\ncliente3.tudominio.com/marketing is now live.",
};

function getReply(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("schedule") || lower.includes("post")) return fakeReplies.schedule;
  if (lower.includes("expense") || lower.includes("summary") || lower.includes("march"))
    return fakeReplies.expense;
  if (lower.includes("health") || lower.includes("check")) return fakeReplies.health;
  if (lower.includes("bundle") || lower.includes("bcs")) return fakeReplies.clients;
  if (lower.includes("deploy")) return fakeReplies.deploy;
  return fakeReplies.default;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || typing) return;
    setInput("");

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: "now",
    };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);

    setTimeout(() => {
      const reply = getReply(content);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        timestamp: "now",
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setTyping(false);
    }, 1200);
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div
        style={{ borderBottom: "1px solid #2a2a3a", backgroundColor: "#111118" }}
        className="flex items-center gap-3 px-6 py-4 shrink-0"
      >
        <div
          style={{ backgroundColor: "rgba(99,102,241,0.15)", borderRadius: "8px" }}
          className="flex items-center justify-center w-8 h-8"
        >
          <Bot size={16} style={{ color: "#a5b4fc" }} />
        </div>
        <div>
          <p style={{ color: "#e2e2f0" }} className="text-sm font-semibold">
            Agent Copilot
          </p>
          <p style={{ color: "#6b7280" }} className="text-xs">
            Powered by Claude · connected to all teams
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div
              style={{
                backgroundColor:
                  msg.role === "assistant" ? "rgba(99,102,241,0.15)" : "rgba(34,197,94,0.15)",
                borderRadius: "8px",
                width: "32px",
                height: "32px",
                flexShrink: 0,
              }}
              className="flex items-center justify-center"
            >
              {msg.role === "assistant" ? (
                <Bot size={14} style={{ color: "#a5b4fc" }} />
              ) : (
                <User size={14} style={{ color: "#22c55e" }} />
              )}
            </div>

            {/* Bubble */}
            <div
              style={{
                backgroundColor: msg.role === "assistant" ? "#111118" : "#1a1a24",
                border: `1px solid ${msg.role === "assistant" ? "#2a2a3a" : "#3a3a4a"}`,
                borderRadius: "12px",
                maxWidth: "72%",
              }}
              className="px-4 py-3"
            >
              <p
                style={{
                  color: "#e2e2f0",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  whiteSpace: "pre-wrap",
                  fontFamily:
                    msg.role === "assistant" && msg.content.includes("✓")
                      ? "var(--font-geist-mono)"
                      : "inherit",
                }}
              >
                {msg.content}
              </p>
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex gap-3">
            <div
              style={{
                backgroundColor: "rgba(99,102,241,0.15)",
                borderRadius: "8px",
                width: "32px",
                height: "32px",
              }}
              className="flex items-center justify-center shrink-0"
            >
              <Bot size={14} style={{ color: "#a5b4fc" }} />
            </div>
            <div
              style={{
                backgroundColor: "#111118",
                border: "1px solid #2a2a3a",
                borderRadius: "12px",
              }}
              className="px-4 py-3 flex items-center gap-1"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#4f46e5",
                    display: "inline-block",
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-6 pb-2 flex gap-2 flex-wrap">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              style={{
                backgroundColor: "#1a1a24",
                border: "1px solid #2a2a3a",
                borderRadius: "20px",
                color: "#a5b4fc",
                fontSize: "12px",
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:border-indigo-500/50 transition-colors"
            >
              <Zap size={11} />
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        style={{ borderTop: "1px solid #2a2a3a", backgroundColor: "#111118" }}
        className="px-6 py-4 shrink-0"
      >
        <div
          style={{ backgroundColor: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: "12px" }}
          className="flex items-end gap-3 px-4 py-3"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask anything or give your agents a task..."
            rows={1}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#e2e2f0",
              fontSize: "14px",
              resize: "none",
              flex: 1,
              fontFamily: "inherit",
              lineHeight: "1.5",
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || typing}
            style={{
              backgroundColor: input.trim() && !typing ? "#6366f1" : "#2a2a3a",
              borderRadius: "8px",
              border: "none",
              cursor: input.trim() && !typing ? "pointer" : "not-allowed",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            className="transition-colors shrink-0"
          >
            <Send size={14} style={{ color: input.trim() && !typing ? "white" : "#4b5563" }} />
          </button>
        </div>
        <p style={{ color: "#4b5563" }} className="text-xs mt-1.5 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
