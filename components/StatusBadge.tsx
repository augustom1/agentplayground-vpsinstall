import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/lib/mock-data";

const config: Record<AgentStatus, { label: string; color: string; dot: string }> = {
  healthy: { label: "Healthy", color: "rgba(34,197,94,0.15)", dot: "#22c55e" },
  idle: { label: "Idle", color: "rgba(245,158,11,0.15)", dot: "#f59e0b" },
  error: { label: "Error", color: "rgba(239,68,68,0.15)", dot: "#ef4444" },
  deploying: { label: "Deploying", color: "rgba(99,102,241,0.15)", dot: "#6366f1" },
};

export function StatusBadge({ status }: { status: AgentStatus }) {
  const c = config[status];
  return (
    <span
      style={{ backgroundColor: c.color, borderRadius: "20px" }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium"
    >
      <span
        style={{ backgroundColor: c.dot, width: "6px", height: "6px", borderRadius: "50%", display: "inline-block" }}
      />
      <span style={{ color: c.dot }}>{c.label}</span>
    </span>
  );
}
