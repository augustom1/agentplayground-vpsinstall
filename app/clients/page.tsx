"use client";

import { useState } from "react";
import { clients } from "@/lib/mock-data";
import { Plus, Building2, Globe, CalendarDays, Package, ChevronDown } from "lucide-react";

const billingStyle: Record<string, { color: string; bg: string }> = {
  paid: { color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  overdue: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  manual: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
};

const statusStyle: Record<string, { color: string; bg: string }> = {
  active: { color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  pending: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  inactive: { color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
};

export default function ClientsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: "#e2e2f0" }} className="text-xl font-semibold">
            Clients
          </h1>
          <p style={{ color: "#6b7280" }} className="text-sm mt-0.5">
            Manage your client accounts and deployments
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
          Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Clients", value: clients.length },
          { label: "Active", value: clients.filter((c) => c.status === "active").length },
          { label: "Pending", value: clients.filter((c) => c.status === "pending").length },
        ].map((s) => (
          <div
            key={s.label}
            style={{ backgroundColor: "#111118", border: "1px solid #2a2a3a", borderRadius: "10px" }}
            className="px-5 py-4"
          >
            <p style={{ color: "#6b7280" }} className="text-xs mb-1">
              {s.label}
            </p>
            <p style={{ color: "#e2e2f0" }} className="text-2xl font-bold">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Client list */}
      <div className="flex flex-col gap-3">
        {clients.map((c) => {
          const isOpen = expanded === c.id;
          const bs = billingStyle[c.billing];
          const ss = statusStyle[c.status];
          return (
            <div
              key={c.id}
              style={{
                backgroundColor: "#111118",
                border: `1px solid ${isOpen ? "#4f46e5" : "#2a2a3a"}`,
                borderRadius: "12px",
              }}
            >
              {/* Row */}
              <button
                onClick={() => setExpanded(isOpen ? null : c.id)}
                className="w-full text-left"
                style={{ background: "transparent", border: "none", cursor: "pointer", borderRadius: "12px" }}
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  <div
                    style={{ backgroundColor: "rgba(99,102,241,0.15)", borderRadius: "10px" }}
                    className="flex items-center justify-center w-10 h-10 shrink-0"
                  >
                    <Building2 size={18} style={{ color: "#6366f1" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p style={{ color: "#e2e2f0" }} className="font-semibold text-sm">
                      {c.name}
                    </p>
                    <p style={{ color: "#6b7280", fontFamily: "var(--font-geist-mono)" }} className="text-xs mt-0.5">
                      {c.domain}
                    </p>
                  </div>

                  <div className="hidden sm:flex items-center gap-3">
                    <span
                      style={{ color: "#a5b4fc", backgroundColor: "rgba(99,102,241,0.1)", borderRadius: "6px", fontSize: "12px" }}
                      className="px-2.5 py-1"
                    >
                      {c.plan}
                    </span>
                    <span
                      style={{ color: bs.color, backgroundColor: bs.bg, borderRadius: "20px", fontSize: "11px" }}
                      className="px-2.5 py-1 font-medium"
                    >
                      {c.billing.charAt(0).toUpperCase() + c.billing.slice(1)}
                    </span>
                    <span
                      style={{ color: ss.color, backgroundColor: ss.bg, borderRadius: "20px", fontSize: "11px" }}
                      className="px-2.5 py-1 font-medium"
                    >
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </div>

                  <ChevronDown
                    size={16}
                    style={{
                      color: "#6b7280",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  />
                </div>
              </button>

              {/* Expanded */}
              {isOpen && (
                <div style={{ borderTop: "1px solid #2a2a3a" }} className="px-5 py-4 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p style={{ color: "#6b7280" }} className="text-xs mb-1 flex items-center gap-1">
                        <Globe size={11} /> Domain
                      </p>
                      <p style={{ color: "#a5b4fc", fontFamily: "var(--font-geist-mono)", fontSize: "12px" }}>
                        {c.domain}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "#6b7280" }} className="text-xs mb-1 flex items-center gap-1">
                        <Package size={11} /> Bundles
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {c.bundles.map((b) => (
                          <span
                            key={b}
                            style={{ backgroundColor: "#1a1a24", color: "#e2e2f0", borderRadius: "4px", fontSize: "11px" }}
                            className="px-1.5 py-0.5"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p style={{ color: "#6b7280" }} className="text-xs mb-1 flex items-center gap-1">
                        <CalendarDays size={11} /> Client since
                      </p>
                      <p style={{ color: "#e2e2f0", fontSize: "13px" }}>{c.since}</p>
                    </div>
                    <div>
                      <p style={{ color: "#6b7280" }} className="text-xs mb-1">Billing</p>
                      <span
                        style={{ color: bs.color, backgroundColor: bs.bg, borderRadius: "20px", fontSize: "11px" }}
                        className="px-2.5 py-1 font-medium"
                      >
                        {c.billing.charAt(0).toUpperCase() + c.billing.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
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
                      Deploy Bundle
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
                      View Activity
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
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
