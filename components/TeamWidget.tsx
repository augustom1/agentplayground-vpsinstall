import type { Widget, StatData, CalendarData } from "@/lib/widgets";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const teamAccent: Record<string, string> = {
  marketing: "var(--color-accent)",
  accounting: "var(--color-green)",
  messaging: "var(--color-yellow)",
  "website-builder": "var(--color-red)",
};

function StatWidget({ widget }: { widget: Widget }) {
  const data = widget.data as StatData;
  const color = teamAccent[widget.teamId] || "var(--color-accent)";

  return (
    <div className="glass-card p-3 flex flex-col gap-1">
      <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>
        {widget.title}
      </p>
      <div className="flex items-end justify-between">
        <p className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
          {data.value}
        </p>
        {data.change && (
          <span className="flex items-center gap-0.5 text-[10px] font-medium" style={{
            color: data.changeType === "up" ? "var(--color-green)" : data.changeType === "down" ? "var(--color-red)" : "var(--color-muted)",
          }}>
            {data.changeType === "up" && <TrendingUp size={10} />}
            {data.changeType === "down" && <TrendingDown size={10} />}
            {data.changeType === "neutral" && <Minus size={10} />}
            {data.change}
          </span>
        )}
      </div>
      <p className="text-[10px]" style={{ color: "var(--color-muted)" }}>{data.label}</p>
    </div>
  );
}

function CalendarWidget({ widget }: { widget: Widget }) {
  const data = widget.data as CalendarData;
  const color = teamAccent[widget.teamId] || "var(--color-accent)";
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="glass-card p-3 flex flex-col gap-2">
      <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>
        {widget.title}
      </p>
      <div className="flex gap-1.5 justify-between">
        {dayLabels.map((label, i) => {
          const dot = data.dots.find((d) => d.day === i);
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[9px]" style={{ color: "var(--color-muted)" }}>{label}</span>
              <div
                className="w-3 h-3 rounded-sm flex items-center justify-center"
                style={{
                  background: dot ? `${color}${Math.min(15 + dot.count * 15, 80).toString(16)}` : "rgba(100,116,139,0.08)",
                }}
              >
                {dot && dot.count > 0 && (
                  <span className="text-[7px] font-bold" style={{ color: "white" }}>
                    {dot.count}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TeamWidget({ widget }: { widget: Widget }) {
  switch (widget.type) {
    case "stat":
      return <StatWidget widget={widget} />;
    case "calendar":
      return <CalendarWidget widget={widget} />;
    default:
      return null;
  }
}
