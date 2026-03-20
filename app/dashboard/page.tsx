import { agentTeams as mockTeams, clients, recentActivity } from "@/lib/mock-data";
import type { AgentStatus } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { RefreshButton } from "@/components/RefreshButton";
import {
  Users,
  Building2,
  CheckCircle2,
  Activity,
  ArrowRight,
  Zap,
} from "lucide-react";
import Link from "next/link";

async function getLiveTeamStatuses(): Promise<Record<string, AgentStatus>> {
  try {
    const base = process.env.AGENTS_BASE_URL ?? "http://localhost";
    const res = await fetch(`${base.replace(/\/$/, "")}/api/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return {};
    const data: Array<{ id: string; status: AgentStatus }> = await res.json();
    return Object.fromEntries(data.map((d) => [d.id, d.status]));
  } catch {
    return {};
  }
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "#111118",
        border: "1px solid #2a2a3a",
        borderRadius: "12px",
      }}
      className="p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p style={{ color: "#6b7280" }} className="text-xs font-medium uppercase tracking-wide mb-1">
            {label}
          </p>
          <p style={{ color: "#e2e2f0" }} className="text-3xl font-bold">
            {value}
          </p>
          <p style={{ color: "#6b7280" }} className="text-xs mt-1">
            {sub}
          </p>
        </div>
        <div
          style={{ backgroundColor: accent + "20", borderRadius: "10px" }}
          className="flex items-center justify-center w-10 h-10"
        >
          <Icon size={18} style={{ color: accent }} />
        </div>
      </div>
    </div>
  );
}

const activityTypeStyle: Record<string, { color: string; bg: string }> = {
  task: { color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  deploy: { color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
  error: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  chat: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
};

export default async function DashboardPage() {
  const liveStatuses = await getLiveTeamStatuses();
  const agentTeams = mockTeams.map((t) => ({
    ...t,
    status: liveStatuses[t.id] ?? t.status,
  }));
  const healthyCount = agentTeams.filter((t) => t.status === "healthy").length;
  const totalTasks = agentTeams.reduce((s, t) => s + t.tasksCompleted, 0);
  const activeClients = clients.filter((c) => c.status === "active").length;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: "#e2e2f0" }} className="text-xl font-semibold">
            Overview
          </h1>
          <p style={{ color: "#6b7280" }} className="text-sm mt-0.5">
            Your agent operations at a glance
          </p>
        </div>
        <RefreshButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Agent Teams"
          value={agentTeams.length}
          sub={`${healthyCount} healthy`}
          icon={Users}
          accent="#6366f1"
        />
        <StatCard
          label="Active Clients"
          value={activeClients}
          sub={`${clients.length} total`}
          icon={Building2}
          accent="#22c55e"
        />
        <StatCard
          label="Tasks Completed"
          value={totalTasks}
          sub="all time"
          icon={CheckCircle2}
          accent="#f59e0b"
        />
        <StatCard
          label="Last Activity"
          value="2m"
          sub="Marketing team"
          icon={Activity}
          accent="#a78bfa"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Agent Teams */}
        <div
          style={{ backgroundColor: "#111118", border: "1px solid #2a2a3a", borderRadius: "12px" }}
          className="lg:col-span-2 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ color: "#e2e2f0" }} className="font-semibold text-sm">
              Agent Teams
            </h2>
            <Link
              href="/teams"
              style={{ color: "#6366f1" }}
              className="text-xs flex items-center gap-1 hover:opacity-80"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {agentTeams.map((team) => (
              <div
                key={team.id}
                style={{ backgroundColor: "#1a1a24", borderRadius: "8px" }}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      backgroundColor: "rgba(99,102,241,0.15)",
                      borderRadius: "8px",
                      width: "32px",
                      height: "32px",
                    }}
                    className="flex items-center justify-center"
                  >
                    <Zap size={14} style={{ color: "#6366f1" }} />
                  </div>
                  <div>
                    <p style={{ color: "#e2e2f0" }} className="text-sm font-medium">
                      {team.name}
                    </p>
                    <p style={{ color: "#6b7280" }} className="text-xs">
                      :{team.port} · {team.tasksCompleted} tasks · {team.lastActivity}
                    </p>
                  </div>
                </div>
                <StatusBadge status={team.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div
          style={{ backgroundColor: "#111118", border: "1px solid #2a2a3a", borderRadius: "12px" }}
          className="p-5"
        >
          <h2 style={{ color: "#e2e2f0" }} className="font-semibold text-sm mb-4">
            Recent Activity
          </h2>
          <div className="flex flex-col gap-3">
            {recentActivity.map((item) => {
              const style = activityTypeStyle[item.type];
              return (
                <div key={item.id} className="flex gap-3">
                  <div
                    style={{
                      backgroundColor: style.bg,
                      borderRadius: "6px",
                      width: "28px",
                      height: "28px",
                      flexShrink: 0,
                    }}
                    className="flex items-center justify-center mt-0.5"
                  >
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: style.color, display: "block" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: "#e2e2f0" }} className="text-xs font-medium leading-tight">
                      {item.team}
                    </p>
                    <p style={{ color: "#6b7280" }} className="text-xs truncate">
                      {item.action}
                    </p>
                    {item.client && (
                      <p style={{ color: "#4f46e5" }} className="text-xs">
                        {item.client}
                      </p>
                    )}
                  </div>
                  <span style={{ color: "#4b5563" }} className="text-xs shrink-0 mt-0.5">
                    {item.timestamp}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Clients quick view */}
      <div
        style={{ backgroundColor: "#111118", border: "1px solid #2a2a3a", borderRadius: "12px" }}
        className="p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ color: "#e2e2f0" }} className="font-semibold text-sm">
            Clients
          </h2>
          <Link
            href="/clients"
            style={{ color: "#6366f1" }}
            className="text-xs flex items-center gap-1 hover:opacity-80"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "#6b7280" }} className="text-xs">
                <th className="text-left pb-2 font-medium">Client</th>
                <th className="text-left pb-2 font-medium">Domain</th>
                <th className="text-left pb-2 font-medium">Plan</th>
                <th className="text-left pb-2 font-medium">Billing</th>
                <th className="text-left pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} style={{ borderTop: "1px solid #2a2a3a" }}>
                  <td style={{ color: "#e2e2f0" }} className="py-3 font-medium">
                    {c.name}
                  </td>
                  <td style={{ color: "#6b7280" }} className="py-3 font-mono text-xs">
                    {c.domain}
                  </td>
                  <td style={{ color: "#a5b4fc" }} className="py-3 text-xs">
                    {c.plan}
                  </td>
                  <td className="py-3">
                    <span
                      style={{
                        color: c.billing === "paid" ? "#22c55e" : c.billing === "overdue" ? "#ef4444" : "#f59e0b",
                        fontSize: "11px",
                        fontWeight: 500,
                      }}
                    >
                      {c.billing.charAt(0).toUpperCase() + c.billing.slice(1)}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      style={{
                        color: c.status === "active" ? "#22c55e" : c.status === "pending" ? "#f59e0b" : "#6b7280",
                        fontSize: "11px",
                      }}
                    >
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
