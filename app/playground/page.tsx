"use client";

import { useState, useRef } from "react";
import { agentTeams, playgroundHistory as initialHistory } from "@/lib/mock-data";
import { Play, ChevronDown, Terminal, Clock, Square } from "lucide-react";

type HistoryItem = {
  id: string;
  target: string;
  prompt: string;
  result: string;
  timestamp: string;
};

const targets = ["All Teams", ...agentTeams.map((t) => t.name)];

export default function PlaygroundPage() {
  const [target, setTarget] = useState("All Teams");
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory);
  const abortRef = useRef<AbortController | null>(null);

  async function runTask() {
    if (!prompt.trim() || running) return;
    setRunning(true);
    setOutput("");

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, prompt }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.text();
        setOutput(`✗ Error: ${err}`);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setOutput(accumulated);
      }

      // Save to history
      const now = new Date();
      const timestamp = `Today ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      setHistory((prev) => [
        { id: Date.now().toString(), target, prompt, result: accumulated.slice(0, 120).replace(/\n/g, " "), timestamp },
        ...prev,
      ]);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setOutput("✗ Request failed. Check your API key in .env.local.");
      }
    } finally {
      setRunning(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
    setRunning(false);
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl">
      <div>
        <h1 style={{ color: "#e2e2f0" }} className="text-xl font-semibold">
          Playground
        </h1>
        <p style={{ color: "#6b7280" }} className="text-sm mt-0.5">
          Task your agent teams directly
        </p>
      </div>

      {/* Task input */}
      <div
        style={{ backgroundColor: "#111118", border: "1px solid #2a2a3a", borderRadius: "12px" }}
        className="p-5 flex flex-col gap-4"
      >
        {/* Target selector */}
        <div className="flex items-center gap-3">
          <span style={{ color: "#6b7280" }} className="text-sm shrink-0">
            Target:
          </span>
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              style={{
                backgroundColor: "#1a1a24",
                border: "1px solid #2a2a3a",
                borderRadius: "8px",
                color: "#e2e2f0",
                cursor: "pointer",
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm"
            >
              {target}
              <ChevronDown size={14} style={{ color: "#6b7280" }} />
            </button>
            {open && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  backgroundColor: "#1a1a24",
                  border: "1px solid #2a2a3a",
                  borderRadius: "8px",
                  zIndex: 10,
                  minWidth: "160px",
                  overflow: "hidden",
                }}
              >
                {targets.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTarget(t); setOpen(false); }}
                    style={{
                      backgroundColor: t === target ? "rgba(99,102,241,0.15)" : "transparent",
                      color: t === target ? "#a5b4fc" : "#e2e2f0",
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      fontSize: "13px",
                      border: "none",
                      cursor: "pointer",
                    }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Prompt */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want the agent to do..."
          rows={4}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) runTask();
          }}
          style={{
            backgroundColor: "#1a1a24",
            border: "1px solid #2a2a3a",
            borderRadius: "8px",
            color: "#e2e2f0",
            resize: "none",
            fontFamily: "inherit",
            fontSize: "14px",
            padding: "12px",
            outline: "none",
          }}
        />

        <div className="flex items-center justify-between">
          <span style={{ color: "#4b5563" }} className="text-xs">
            ⌘ + Enter to run
          </span>
          <div className="flex gap-2">
            {running && (
              <button
                onClick={stop}
                style={{
                  backgroundColor: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                className="flex items-center gap-2 px-4 py-2"
              >
                <Square size={13} />
                Stop
              </button>
            )}
            <button
              onClick={runTask}
              disabled={!prompt.trim() || running}
              style={{
                backgroundColor: running || !prompt.trim() ? "#2a2a3a" : "#6366f1",
                color: running || !prompt.trim() ? "#4b5563" : "white",
                borderRadius: "8px",
                border: "none",
                cursor: running || !prompt.trim() ? "not-allowed" : "pointer",
                fontWeight: 500,
                fontSize: "14px",
              }}
              className="flex items-center gap-2 px-4 py-2 transition-colors"
            >
              <Play size={14} />
              {running ? "Running..." : "Run Task"}
            </button>
          </div>
        </div>
      </div>

      {/* Terminal output */}
      {(output || running) && (
        <div
          style={{ backgroundColor: "#0d0d12", border: "1px solid #2a2a3a", borderRadius: "12px" }}
          className="p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Terminal size={14} style={{ color: "#6b7280" }} />
            <span style={{ color: "#6b7280" }} className="text-xs font-medium">
              Output — {target}
            </span>
          </div>
          <pre
            style={{
              color: "#a5b4fc",
              fontFamily: "var(--font-geist-mono)",
              fontSize: "13px",
              lineHeight: "1.7",
              whiteSpace: "pre-wrap",
              margin: 0,
            }}
          >
            {output}
            {running && !output && (
              <span style={{ color: "#6b7280" }}>Connecting...</span>
            )}
            {running && <span style={{ opacity: 0.5 }}>▊</span>}
          </pre>
        </div>
      )}

      {/* History */}
      <div
        style={{ backgroundColor: "#111118", border: "1px solid #2a2a3a", borderRadius: "12px" }}
        className="p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock size={14} style={{ color: "#6b7280" }} />
          <h2 style={{ color: "#e2e2f0" }} className="font-semibold text-sm">
            Run History
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {history.map((h) => (
            <div
              key={h.id}
              style={{ backgroundColor: "#1a1a24", borderRadius: "8px", cursor: "pointer" }}
              className="px-4 py-3 hover:border hover:border-indigo-500/20 transition-colors"
              onClick={() => { setTarget(h.target); setPrompt(h.prompt); }}
            >
              <div className="flex items-center justify-between mb-1">
                <span style={{ color: "#a5b4fc" }} className="text-xs font-medium">
                  {h.target}
                </span>
                <span style={{ color: "#4b5563" }} className="text-xs">
                  {h.timestamp}
                </span>
              </div>
              <p style={{ color: "#e2e2f0" }} className="text-sm mb-1">
                {h.prompt}
              </p>
              <p
                style={{ color: "#22c55e", fontFamily: "var(--font-geist-mono)", fontSize: "12px" }}
                className="truncate"
              >
                {h.result}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
