"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Zap } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
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
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    setInput("");

    const userMsg: Message = { id: Date.now().toString(), role: "user", content };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setStreaming(true);
    setStreamingContent("");

    // Build conversation history for the API (exclude the initial greeting id="0")
    const history = nextMessages
      .filter((m) => m.id !== "0")
      .map((m) => ({ role: m.role, content: m.content }));

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.text();
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "assistant", content: `⚠ Error: ${err}` },
        ]);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setStreamingContent(accumulated);
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: accumulated },
      ]);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "assistant", content: "⚠ Request failed. Check your API key in .env.local." },
        ]);
      }
    } finally {
      setStreaming(false);
      setStreamingContent("");
    }
  }

  const isMono = (content: string) =>
    content.includes("✓") || content.includes("✗") || content.includes("POST") || content.includes("GET");

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
            claude-sonnet-4-6 · connected to all teams
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} isMono={isMono(msg.content)} />
        ))}

        {/* Streaming bubble */}
        {streaming && (
          <div className="flex gap-3">
            <Avatar role="assistant" />
            <div
              style={{ backgroundColor: "#111118", border: "1px solid #2a2a3a", borderRadius: "12px", maxWidth: "72%" }}
              className="px-4 py-3"
            >
              {streamingContent ? (
                <p
                  style={{
                    color: "#e2e2f0",
                    fontSize: "14px",
                    lineHeight: "1.7",
                    whiteSpace: "pre-wrap",
                    fontFamily: isMono(streamingContent) ? "var(--font-geist-mono)" : "inherit",
                  }}
                >
                  {streamingContent}
                  <span style={{ opacity: 0.5 }}>▊</span>
                </p>
              ) : (
                <div className="flex items-center gap-1.5 py-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "#4f46e5",
                        display: "inline-block",
                        animation: `blink 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions — only on first load */}
      {messages.length <= 1 && !streaming && (
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
                cursor: "pointer",
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
            disabled={!input.trim() || streaming}
            style={{
              backgroundColor: input.trim() && !streaming ? "#6366f1" : "#2a2a3a",
              borderRadius: "8px",
              border: "none",
              cursor: input.trim() && !streaming ? "pointer" : "not-allowed",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            className="transition-colors shrink-0"
          >
            <Send size={14} style={{ color: input.trim() && !streaming ? "white" : "#4b5563" }} />
          </button>
        </div>
        <p style={{ color: "#4b5563" }} className="text-xs mt-1.5 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>

      <style>{`
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function Avatar({ role }: { role: "user" | "assistant" }) {
  return (
    <div
      style={{
        backgroundColor: role === "assistant" ? "rgba(99,102,241,0.15)" : "rgba(34,197,94,0.15)",
        borderRadius: "8px",
        width: "32px",
        height: "32px",
        flexShrink: 0,
      }}
      className="flex items-center justify-center"
    >
      {role === "assistant" ? (
        <Bot size={14} style={{ color: "#a5b4fc" }} />
      ) : (
        <User size={14} style={{ color: "#22c55e" }} />
      )}
    </div>
  );
}

function MessageBubble({ msg, isMono }: { msg: Message; isMono: boolean }) {
  return (
    <div className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
      <Avatar role={msg.role} />
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
            fontFamily: isMono ? "var(--font-geist-mono)" : "inherit",
          }}
        >
          {msg.content}
        </p>
      </div>
    </div>
  );
}
