"use client";

import { useState } from "react";
import { agentTeams } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Zap, Globe, Server, ChevronRight } from "lucide-react";

export default function TeamsPage() {
  const [selected, setSelected] = useState<string | null>(null);

  const team = agentTeams.find((t) => t.id === selected);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: "#e2e2f0" }} className="text-xl font-semibold">
            Agent Teams
          </h1>
          <p style={{ color: "#6b7280" }} className="text-sm mt-0.5">
            Manage and configure your deployed agent teams
          </p>
        </div>
        <button
          style={{
            backgroundColor: "#6366f1",
            color: "white",
            borderRadius: "8px",
            border: "none",
            fontWeight: 500,
            fontSize: "14px",
            cursor: "pointer",
          }}
          className="flex items-center gap-2 px-4 py-2.5"
        >
          <Plus size={15} />
          New Team
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {agentTeams.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(selected === t.id ? null : t.id)}
            style={{
              backgroundColor: selected === t.id ? "#1a1a24" : "#111118",
              border: `1px solid ${selected === t.id ? "#4f46e5" : "#2a2a3a"}`,
              borderRadius: "12px",
              textAlign: "left",
              cursor: "pointer",
            }}
            className="p-5 hover:border-indigo-500/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: "rgba(99,102,241,0.15)", borderRadius: "10px" }}
                  className="flex items-center justify-center w-10 h-10 shrink-0"
                >
                  <Zap size={18} style={{ color: "#6366f1" }} />
                </div>
                <div>
                  <p style={{ color: "#e2e2f0" }} className="font-semibold text-sm">
                    {t.name}
                  </p>
                  <p style={{ color: "#6b7280" }} className="text-xs mt-0.5">
                    {t.description}
                  </p>
                </div>
              </div>
              <StatusBadge status={t.status} />
            </div>

            <div className="flex gap-4 mt-4">
              <div>
                <p style={{ color: "#6b7280" }} className="text-xs">Port</p>
                <p style={{ color: "#a5b4fc", fontFamily: "var(--font-geist-mono)", fontSize: "13px" }}>
                  :{t.port}
                </p>
              </div>
              <div>
                <p style={{ color: "#6b7280" }} className="text-xs">Tasks</p>
                <p style={{ color: "#e2e2f0", fontSize: "13px" }}>{t.tasksCompleted}</p>
              </div>
              <div>
                <p style={{ color: "#6b7280" }} className="text-xs">Clients</p>
                <p style={{ color: "#e2e2f0", fontSize: "13px" }}>{t.clients.length}</p>
              </div>
              <div>
                <p style={{ color: "#6b7280" }} className="text-xs">Last active</p>
                <p style={{ color: "#e2e2f0", fontSize: "13px" }}>{t.lastActivity}</p>
              </div>
            </div>

            {selected === t.id && (
              <div
                style={{ borderTop: "1px solid #2a2a3a" }}
                className="mt-4 pt-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <Server size={13} style={{ color: "#6b7280" }} />
                  <span style={{ color: "#6b7280" }} className="text-xs">Runtime:</span>
                  <span style={{ color: "#e2e2f0" }} className="text-xs">{t.language}</span>
                </div>
                {t.clients.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Globe size={13} style={{ color: "#6b7280", marginTop: "2px" }} />
                    <span style={{ color: "#6b7280" }} className="text-xs">Deployed to:</span>
                    <div className="flex flex-wrap gap-1">
                      {t.clients.map((c) => (
                        <span
                          key={c}
                          style={{
                            backgroundColor: "rgba(99,102,241,0.1)",
                            color: "#a5b4fc",
                            borderRadius: "4px",
                            fontSize: "11px",
                            padding: "1px 6px",
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 mt-1">
                  <button
                    style={{
                      backgroundColor: "rgba(99,102,241,0.15)",
                      color: "#a5b4fc",
                      border: "1px solid rgba(99,102,241,0.3)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                    className="px-3 py-1.5 hover:bg-indigo-500/25 transition-colors"
                  >
                    Open in Playground
                  </button>
                  <button
                    style={{
                      backgroundColor: "transparent",
                      color: "#6b7280",
                      border: "1px solid #2a2a3a",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                    className="px-3 py-1.5 hover:border-gray-500 transition-colors"
                  >
                    View Logs
                  </button>
                  <button
                    style={{
                      backgroundColor: "transparent",
                      color: "#6b7280",
                      border: "1px solid #2a2a3a",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                    className="px-3 py-1.5 hover:border-gray-500 transition-colors"
                  >
                    Config
                  </button>
                </div>
              </div>
            )}
          </button>
        ))}

        {/* Create new team card */}
        <button
          style={{
            backgroundColor: "transparent",
            border: "1px dashed #2a2a3a",
            borderRadius: "12px",
            cursor: "pointer",
            minHeight: "120px",
          }}
          className="p-5 flex flex-col items-center justify-center gap-2 hover:border-indigo-500/40 hover:bg-white/[0.02] transition-colors"
        >
          <div
            style={{ backgroundColor: "rgba(99,102,241,0.1)", borderRadius: "10px" }}
            className="flex items-center justify-center w-10 h-10"
          >
            <Plus size={18} style={{ color: "#6366f1" }} />
          </div>
          <p style={{ color: "#6b7280" }} className="text-sm">
            Create a new agent team
          </p>
          <p style={{ color: "#4b5563" }} className="text-xs">
            Describe what it should do, Claude scaffolds it
          </p>
        </button>
      </div>
    </div>
  );
}
