export type AgentStatus = "healthy" | "idle" | "error" | "deploying";

const config: Record<AgentStatus, { label: string; bg: string; dot: string }> = {
  healthy: { label: "Healthy", bg: "var(--color-green-dim)", dot: "var(--color-green)" },
  idle: { label: "Idle", bg: "var(--color-yellow-dim)", dot: "var(--color-yellow)" },
  error: { label: "Error", bg: "var(--color-red-dim)", dot: "var(--color-red)" },
  deploying: { label: "Deploying", bg: "rgba(255,255,255,0.08)", dot: "var(--color-text-secondary)" },
};

export function StatusBadge({ status }: { status: string }) {
  const c = config[status as AgentStatus] ?? config.idle;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: c.bg, borderRadius: "20px" }}
    >
      <span
        className={status === "healthy" ? "dot-pulse" : ""}
        style={{
          backgroundColor: c.dot,
          color: c.dot,
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          display: "inline-block",
        }}
      />
      <span style={{ color: c.dot }}>{c.label}</span>
    </span>
  );
}
