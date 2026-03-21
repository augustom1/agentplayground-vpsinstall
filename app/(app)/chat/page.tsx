"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Zap, Plus } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const GREETING: Message = {
  id: "0",
  role: "assistant",
  content:
    "Hey! I'm your agent copilot. I have visibility into all your agent teams and clients.\n\nI can help you task agents, check status, review client data, or deploy bundles — just tell me what you need.",
};

const suggestions = [
  "Schedule 3 posts for cliente1 this week",
  "Show March expense summary for Tacos El Gordo",
  "Run a health check on all teams",
  "Which clients are on the Full BCS Bundle?",
  "Deploy Marketing team to cliente3",
];

const SESSION_KEY = "chat_conversation_id";

export default function ChatPage() {
  const { addToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Load or create conversation on mount
  useEffect(() => {
    async function initConversation() {
      try {
        const storedId = sessionStorage.getItem(SESSION_KEY);
        if (storedId) {
          const res = await fetch(`/api/conversations/${storedId}`);
          if (res.ok) {
            const conv = await res.json();
            if (conv.messages && conv.messages.length > 0) {
              const dbMessages: Message[] = conv.messages.map((m: { id: string; role: "user" | "assistant"; content: string }) => ({
                id: m.id,
                role: m.role,
                content: m.content,
              }));
              setMessages([GREETING, ...dbMessages]);
            }
            setConversationId(storedId);
            setLoadingHistory(false);
            return;
          }
        }
        // Create new conversation
        const res = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        if (res.ok) {
          const conv = await res.json();
          sessionStorage.setItem(SESSION_KEY, conv.id);
          setConversationId(conv.id);
        }
      } catch {
        // non-critical — app still works without persistence
      } finally {
        setLoadingHistory(false);
      }
    }
    initConversation();
  }, []);

  const saveMessage = useCallback(async (convId: string, role: "user" | "assistant", content: string) => {
    try {
      await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, content }),
      });
    } catch {
      // non-critical
    }
  }, []);

  async function newConversation() {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (res.ok) {
        const conv = await res.json();
        sessionStorage.setItem(SESSION_KEY, conv.id);
        setConversationId(conv.id);
        setMessages([GREETING]);
        setStreamingContent("");
        addToast("New conversation started", "info");
      }
    } catch {
      addToast("Failed to create conversation", "error");
    }
  }

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    setInput("");

    const userMsg: Message = { id: Date.now().toString(), role: "user", content };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setStreaming(true);
    setStreamingContent("");

    // Persist user message
    if (conversationId) {
      saveMessage(conversationId, "user", content);
    }

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

      const assistantMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: accumulated,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Persist assistant message
      if (conversationId) {
        saveMessage(conversationId, "assistant", accumulated);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "assistant", content: "⚠ Request failed. Check your API key." },
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
        className="flex items-center justify-between px-6 py-3.5 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-8 h-8"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
              borderRadius: "9px",
            }}
          >
            <Bot size={15} style={{ color: "#a5b4fc" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Agent Copilot
            </p>
            <p className="text-[11px]" style={{ color: "var(--color-muted)" }}>
              claude-sonnet-4-6 · connected to all teams
            </p>
          </div>
        </div>
        <button
          onClick={newConversation}
          className="btn-ghost flex items-center gap-1.5 px-3 py-1.5"
          style={{ fontSize: "12px" }}
          title="Start a new conversation"
        >
          <Plus size={13} />
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
        {loadingHistory && (
          <div className="flex justify-center py-4">
            <div className="text-[12px]" style={{ color: "var(--color-muted)" }}>
              Loading history...
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} isMono={isMono(msg.content)} />
        ))}

        {streaming && (
          <div className="flex gap-3 animate-fade-in">
            <Avatar role="assistant" />
            <div
              className="glass-card px-4 py-3"
              style={{ maxWidth: "72%", borderColor: "rgba(99,102,241,0.2)" }}
            >
              {streamingContent ? (
                <p
                  style={{
                    color: "var(--color-text)",
                    fontSize: "14px",
                    lineHeight: "1.7",
                    whiteSpace: "pre-wrap",
                    fontFamily: isMono(streamingContent) ? "var(--font-mono)" : "inherit",
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
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        backgroundColor: "#818cf8",
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

      {/* Suggestions */}
      {messages.length <= 1 && !streaming && (
        <div className="px-6 pb-2 flex gap-2 flex-wrap">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200"
              style={{
                background: "rgba(18,18,31,0.6)",
                border: "1px solid var(--color-border)",
                color: "#a5b4fc",
                fontSize: "11px",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.4)";
                (e.target as HTMLElement).style.background = "rgba(99,102,241,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.borderColor = "var(--color-border)";
                (e.target as HTMLElement).style.background = "rgba(18,18,31,0.6)";
              }}
            >
              <Zap size={10} />
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        className="px-6 py-3.5 shrink-0"
        style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-surface)" }}
      >
        <div className="glass-input flex items-end gap-3 px-4 py-3">
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
              color: "var(--color-text)",
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
            className="transition-all shrink-0"
            style={{
              background: input.trim() && !streaming ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "var(--color-surface-3)",
              borderRadius: "8px",
              border: "none",
              cursor: input.trim() && !streaming ? "pointer" : "not-allowed",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Send size={14} style={{ color: input.trim() && !streaming ? "white" : "var(--color-muted)" }} />
          </button>
        </div>
        <p className="text-[10px] mt-1 text-center" style={{ color: "var(--color-muted)" }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function Avatar({ role }: { role: "user" | "assistant" }) {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        background:
          role === "assistant"
            ? "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))"
            : "var(--color-green-dim)",
        borderRadius: "9px",
        width: "30px",
        height: "30px",
      }}
    >
      {role === "assistant" ? (
        <Bot size={14} style={{ color: "#a5b4fc" }} />
      ) : (
        <User size={14} style={{ color: "var(--color-green)" }} />
      )}
    </div>
  );
}

function MessageBubble({ msg, isMono }: { msg: Message; isMono: boolean }) {
  return (
    <div className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
      <Avatar role={msg.role} />
      <div
        className="px-4 py-3"
        style={{
          background:
            msg.role === "assistant"
              ? "linear-gradient(135deg, rgba(12,12,24,0.8), rgba(18,18,31,0.6))"
              : "rgba(18,18,31,0.8)",
          border: `1px solid ${msg.role === "assistant" ? "rgba(99,102,241,0.15)" : "var(--color-border)"}`,
          borderRadius: "14px",
          maxWidth: "72%",
        }}
      >
        <p
          style={{
            color: "var(--color-text)",
            fontSize: "14px",
            lineHeight: "1.7",
            whiteSpace: "pre-wrap",
            fontFamily: isMono ? "var(--font-mono)" : "inherit",
          }}
        >
          {msg.content}
        </p>
      </div>
    </div>
  );
}
