"use client";

import { useState } from "react";
import { agentTeams, playgroundHistory } from "@/lib/mock-data";
import { Play, ChevronDown, Terminal, Clock } from "lucide-react";

type OutputLine = { text: string; type: "info" | "success" | "error" | "system" };

const fakeOutputs: Record<string, OutputLine[]> = {
  "Marketing": [
    { text: "> Connecting to Marketing agent (port 8001)...", type: "system" },
    { text: "✓ Agent online", type: "success" },
    { text: "> Sending task...", type: "system" },
    { text: "Processing: analyzing task intent...", type: "info" },
    { text: "Scheduling posts for the week...", type: "info" },
    { text: "✓ 5 posts queued successfully", type: "success" },
    { text: "Mon 12:00 – 'New menu item: grilled chicken tacos'", type: "info" },
    { text: "Wed 12:00 – 'Customer review highlight ⭐⭐⭐⭐⭐'", type: "info" },
    { text: "Fri 18:00 – 'Weekend special: 2x1 on all combos'", type: "info" },
  ],
  "Accounting": [
    { text: "> Connecting to Accounting agent (port 8002)...", type: "system" },
    { text: "✓ Agent online", type: "success" },
    { text: "> Sending task...", type: "system" },
    { text: "Querying transaction records...", type: "info" },
    { text: "✓ Summary ready", type: "success" },
    { text: "Income this month:  $22,400.00", type: "info" },
    { text: "Expenses this month: $14,200.00", type: "info" },
    { text: "Net profit:          $8,200.00  (+12% vs last month)", type: "success" },
  ],
  "Messaging": [
    { text: "> Connecting to Messaging agent (port 8003)...", type: "system" },
    { text: "✓ Agent online", type: "success" },
    { text: "> Sending task...", type: "system" },
    { text: "Relaying to Claude API...", type: "info" },
    { text: "✓ Response generated", type: "success" },
    { text: "Agent is ready to handle customer queries.", type: "info" },
  ],
  "Website Builder": [
    { text: "> Connecting to Website Builder (port 3001)...", type: "system" },
    { text: "✗ Connection refused – agent not running", type: "error" },
    { text: "Tip: This agent has not been implemented yet.", type: "info" },
  ],
  "All Teams": [
    { text: "> Running health check on all teams...", type: "system" },
    { text: "Marketing   (8001) – ✓ online", type: "success" },
    { text: "Accounting  (8002) – ✓ online", type: "success" },
    { text: "Messaging   (8003) – ✓ online", type: "success" },
    { text: "Website Bld (3001) – ✗ not responding", type: "error" },
    { text: "3/4 teams healthy", type: "info" },
  ],
};

export default function PlaygroundPage() {
  const [target, setTarget] = useState("All Teams");
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [open, setOpen] = useState(false);

  const targets = ["All Teams", ...agentTeams.map((t) => t.name)];

  function runTask() {
    if (!prompt.trim() || running) return;
    setRunning(true);
    setOutput([]);
    const lines = fakeOutputs[target] ?? fakeOutputs["All Teams"];
    let i = 0;
    const interval = setInterval(() => {
      if (i < lines.length) {
        setOutput((prev) => [...prev, lines[i]]);
        i++;
      } else {
        clearInterval(interval);
        setRunning(false);
      }
    }, 300);
  }

  const lineColor: Record<OutputLine["type"], string> = {
    system: "#6b7280",
    info: "#a5b4fc",
    success: "#22c55e",
    error: "#ef4444",
  };

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
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) runTask();
          }}
        />

        <div className="flex items-center justify-between">
          <span style={{ color: "#4b5563" }} className="text-xs">
            ⌘ + Enter to run
          </span>
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

      {/* Output terminal */}
      {(output.length > 0 || running) && (
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
          <div className="flex flex-col gap-1">
            {output.map((line, i) => (
              <p
                key={i}
                style={{ color: lineColor[line.type], fontFamily: "var(--font-geist-mono)", fontSize: "13px", lineHeight: "1.6" }}
              >
                {line.text}
              </p>
            ))}
            {running && (
              <p style={{ color: "#6b7280", fontFamily: "var(--font-geist-mono)", fontSize: "13px" }}>
                ▊
              </p>
            )}
          </div>
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
          {playgroundHistory.map((h) => (
            <div
              key={h.id}
              style={{ backgroundColor: "#1a1a24", borderRadius: "8px" }}
              className="px-4 py-3"
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
              <p style={{ color: "#22c55e", fontFamily: "var(--font-geist-mono)", fontSize: "12px" }}>
                {h.result}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
