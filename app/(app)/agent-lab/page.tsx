"use client";

import { useState, useRef, useEffect } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/ToastProvider";
import {
  Play,
  ChevronDown,
  Terminal,
  Clock,
  Square,
  Plus,
  Zap,
  Server,
  Share2,
  Upload,
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

type Team = {
  id: string;
  name: string;
  description: string;
  port: number;
  status: string;
  language: string;
  tasksCompleted: number;
  lastActivity: string;
  _count: { agents: number; tasks: number; skills: number };
};

type HistoryItem = {
  id: string;
  target: string;
  prompt: string;
  result: string;
  createdAt: string;
};

export default function AgentLabPage() {
  const { addToast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [target, setTarget] = useState("All Teams");
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const targets = ["All Teams", ...teams.map((t) => t.name)];

  async function fetchTeams() {
    setTeamsLoading(true);
    setTeamsError(null);
    try {
      const res = await fetch("/api/teams");
      if (!res.ok) throw new Error("Failed to load teams");
      const data: Team[] = await res.json();
      setTeams(data.filter((t) => !(t as unknown as { isSystemTeam?: boolean }).isSystemTeam));
    } catch (err) {
      setTeamsError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setTeamsLoading(false);
    }
  }

  async function fetchHistory() {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/playground-runs");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch {
      // non-critical
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    fetchTeams();
    fetchHistory();
  }, []);

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

      // Persist run to DB (fire-and-forget)
      fetch("/api/playground-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, prompt, result: accumulated }),
      })
        .then(async (r) => {
          if (r.ok) {
            const run = await r.json();
            setHistory((prev) => [run, ...prev].slice(0, 20));
          }
        })
        .catch(() => {});
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setOutput("✗ Request failed. Check your API key in .env.local.");
        addToast("Task failed. Check your API key.", "error");
      }
    } finally {
      setRunning(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
    setRunning(false);
  }

  function formatTimestamp(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    return isToday ? `Today ${time}` : `${d.toLocaleDateString()} ${time}`;
  }

  return (
    <div className="flex flex-col gap-5 p-6 max-w-6xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Agent Lab
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
            Manage your agent teams and run tasks directly
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost flex items-center gap-2 px-3 py-2" style={{ fontSize: "13px" }}>
            <Upload size={14} />
            Import
          </button>
          <button className="btn-ghost flex items-center gap-2 px-3 py-2" style={{ fontSize: "13px" }}>
            <Download size={14} />
            Browse Online
          </button>
          <button className="btn-primary flex items-center gap-2 px-4 py-2.5">
            <Plus size={15} />
            New Team
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left panel — Agent Teams */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2
              className="font-semibold text-xs uppercase tracking-wider"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Agent Teams
            </h2>
            {teamsLoading && (
              <Loader2 size={13} className="animate-spin" style={{ color: "var(--color-muted)" }} />
            )}
          </div>

          {/* Error state */}
          {teamsError && (
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: "var(--color-red-dim)", border: "1px solid rgba(248,113,113,0.2)" }}
            >
              <AlertCircle size={13} style={{ color: "var(--color-red)" }} />
              <p className="text-xs flex-1" style={{ color: "var(--color-red)" }}>{teamsError}</p>
              <button onClick={fetchTeams}>
                <RefreshCw size={11} style={{ color: "var(--color-red)" }} />
              </button>
            </div>
          )}

          {/* Loading skeleton */}
          {teamsLoading && teams.length === 0 && (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="glass-card p-4 animate-pulse"
                  style={{ height: "96px" }}
                >
                  <div className="flex gap-3">
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(99,102,241,0.08)" }} />
                    <div className="flex-1 flex flex-col gap-2">
                      <div style={{ height: "12px", width: "60%", borderRadius: "4px", background: "rgba(255,255,255,0.06)" }} />
                      <div style={{ height: "10px", width: "80%", borderRadius: "4px", background: "rgba(255,255,255,0.04)" }} />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {teams.map((t) => {
            const isSelected = selectedTeam === t.id;
            const statusColor =
              t.status === "healthy" ? "var(--color-green)" :
              t.status === "error" ? "var(--color-red)" :
              t.status === "idle" ? "var(--color-yellow)" : "#818cf8";

            return (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTeam(isSelected ? null : t.id);
                  if (!isSelected) setTarget(t.name);
                }}
                className="glass-card-interactive p-4 text-left"
                style={{
                  borderColor: isSelected ? "rgba(99,102,241,0.4)" : undefined,
                  borderTopWidth: "2px",
                  borderTopColor: isSelected ? statusColor : "transparent",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center w-9 h-9 shrink-0"
                      style={{
                        background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))",
                        borderRadius: "10px",
                      }}
                    >
                      <Zap size={16} style={{ color: "#818cf8" }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
                        {t.name}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--color-muted)" }}>
                        {t.description}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>

                <div className="flex gap-5 mt-3">
                  {[
                    { label: "Port", value: `:${t.port}`, mono: true },
                    { label: "Tasks", value: String(t.tasksCompleted), mono: false },
                    { label: "Last active", value: t.lastActivity, mono: false },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-[10px]" style={{ color: "var(--color-muted)" }}>{stat.label}</p>
                      <p
                        className="text-[12px]"
                        style={{
                          color: stat.mono ? "#a5b4fc" : "var(--color-text)",
                          fontFamily: stat.mono ? "var(--font-mono)" : "inherit",
                        }}
                      >
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {isSelected && (
                  <div
                    className="mt-3 pt-3 flex flex-col gap-2.5 animate-fade-in"
                    style={{ borderTop: "1px solid var(--color-border)" }}
                  >
                    <div className="flex items-center gap-2">
                      <Server size={12} style={{ color: "var(--color-muted)" }} />
                      <span className="text-[11px]" style={{ color: "var(--color-muted)" }}>Runtime:</span>
                      <span className="text-[11px]" style={{ color: "var(--color-text)" }}>{t.language}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button className="btn-ghost px-3 py-1.5 flex items-center gap-1.5" style={{ fontSize: "12px" }}>
                        <Share2 size={11} />
                        Export
                      </button>
                      <button className="btn-ghost px-3 py-1.5" style={{ fontSize: "12px" }}>View Logs</button>
                      <button className="btn-ghost px-3 py-1.5" style={{ fontSize: "12px" }}>Config</button>
                    </div>
                  </div>
                )}
              </button>
            );
          })}

          {/* Create new team card */}
          <button
            className="flex flex-col items-center justify-center gap-2 p-5 rounded-[14px] transition-all duration-200 cursor-pointer hover:bg-white/[0.02]"
            style={{ border: "1px dashed var(--color-border)", background: "transparent", minHeight: "90px" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.3)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}
          >
            <div
              className="flex items-center justify-center w-9 h-9"
              style={{ background: "rgba(99,102,241,0.08)", borderRadius: "10px" }}
            >
              <Plus size={16} style={{ color: "#818cf8" }} />
            </div>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              Create a new agent team
            </p>
          </button>
        </div>

        {/* Right panel — Playground */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <h2
            className="font-semibold text-xs uppercase tracking-wider"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Playground
          </h2>

          {/* Task Input */}
          <div className="glass-card p-5 flex flex-col gap-4">
            {/* Target selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs shrink-0 font-medium" style={{ color: "var(--color-muted)" }}>
                Target
              </span>
              <div className="relative">
                <button
                  onClick={() => setOpen(!open)}
                  className="glass-input flex items-center gap-2 px-3 py-2 text-sm"
                  style={{ cursor: "pointer" }}
                >
                  <span style={{ color: "var(--color-text)" }}>{target}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      color: "var(--color-muted)",
                      transition: "transform 0.2s",
                      transform: open ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>
                {open && (
                  <div
                    className="glass-panel animate-fade-in"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      zIndex: 10,
                      minWidth: "180px",
                      overflow: "hidden",
                    }}
                  >
                    {targets.map((t) => (
                      <button
                        key={t}
                        onClick={() => { setTarget(t); setOpen(false); }}
                        className="hover:bg-white/[0.05] transition-colors"
                        style={{
                          backgroundColor: t === target ? "rgba(99,102,241,0.1)" : "transparent",
                          color: t === target ? "#a5b4fc" : "var(--color-text)",
                          width: "100%",
                          textAlign: "left",
                          padding: "8px 14px",
                          fontSize: "13px",
                          border: "none",
                          cursor: "pointer",
                        }}
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
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.metaKey) runTask();
              }}
              className="glass-input"
              style={{ resize: "none", fontFamily: "inherit", fontSize: "14px", padding: "12px", lineHeight: "1.6" }}
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] flex items-center gap-1.5" style={{ color: "var(--color-muted)" }}>
                <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>⌘</kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>Enter</kbd>
                <span>to run</span>
              </span>
              <div className="flex gap-2">
                {running && (
                  <button
                    onClick={stop}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                    style={{
                      background: "var(--color-red-dim)",
                      color: "var(--color-red)",
                      border: "1px solid rgba(248,113,113,0.2)",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    <Square size={12} />
                    Stop
                  </button>
                )}
                <button
                  onClick={runTask}
                  disabled={!prompt.trim() || running}
                  className="btn-primary flex items-center gap-2 px-5 py-2"
                >
                  <Play size={13} />
                  {running ? "Running..." : "Run Task"}
                </button>
              </div>
            </div>
          </div>

          {/* Terminal output */}
          {(output || running) && (
            <div className="glass-card p-4" style={{ background: "rgba(6,6,14,0.8)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Terminal size={13} style={{ color: "var(--color-muted)" }} />
                <span className="text-[11px] font-medium" style={{ color: "var(--color-muted)" }}>
                  Output — {target}
                </span>
              </div>
              <pre
                style={{
                  color: "#a5b4fc",
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  lineHeight: "1.7",
                  whiteSpace: "pre-wrap",
                  margin: 0,
                }}
              >
                {output}
                {running && !output && (
                  <span style={{ color: "var(--color-muted)" }}>Connecting...</span>
                )}
                {running && <span style={{ opacity: 0.5 }}>▊</span>}
              </pre>
            </div>
          )}

          {/* History */}
          {!historyLoading && history.length > 0 && (
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={13} style={{ color: "var(--color-muted)" }} />
                <h2
                  className="font-semibold text-xs uppercase tracking-wider"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Run History
                </h2>
              </div>
              <div className="flex flex-col gap-2">
                {history.slice(0, 5).map((h) => (
                  <div
                    key={h.id}
                    className="glass-card-interactive px-4 py-3"
                    onClick={() => { setTarget(h.target); setPrompt(h.prompt); }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium" style={{ color: "#a5b4fc" }}>
                        {h.target}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--color-muted)" }}>
                        {formatTimestamp(h.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm mb-0.5" style={{ color: "var(--color-text)" }}>
                      {h.prompt}
                    </p>
                    <p
                      className="truncate text-[12px]"
                      style={{ color: "var(--color-green)", fontFamily: "var(--font-mono)" }}
                    >
                      {h.result.slice(0, 120).replace(/\n/g, " ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {historyLoading && (
            <div className="glass-card p-4 animate-pulse" style={{ height: "80px" }} />
          )}
        </div>
      </div>
    </div>
  );
}
