"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Clock,
  ChevronLeft,
  ChevronRight,
  Zap,
  ChevronDown,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";

type ScheduledJob = {
  id: string;
  title: string;
  description: string | null;
  scheduledFor: string;
  recurring: string;
  status: string;
  isOffHours: boolean;
  teamId: string;
  teamName: string;
};

type Team = {
  id: string;
  name: string;
};

const TEAM_PALETTE = [
  "#6366f1",
  "var(--color-green)",
  "var(--color-yellow)",
  "var(--color-red)",
  "#818cf8",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#6ee7b7",
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getTimeStr(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function SchedulePage() {
  const { addToast } = useToast();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    scheduledFor: "",
    recurring: "none",
    teamId: "",
  });

  // Build a stable teamId → color map from jobs
  const teamIds = [...new Set(jobs.map((j) => j.teamId))];
  function getTeamColor(teamId: string): string {
    const idx = teamIds.indexOf(teamId);
    return TEAM_PALETTE[idx % TEAM_PALETTE.length] || "var(--color-accent)";
  }

  async function fetchJobs() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/schedule?year=${viewYear}&month=${viewMonth}`);
      if (!res.ok) throw new Error("Failed to load schedule");
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeams() {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
        if (data.length > 0 && !form.teamId) {
          setForm((f) => ({ ...f, teamId: data[0].id }));
        }
      }
    } catch {
      // non-critical
    }
  }

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear, viewMonth]);

  useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group jobs by day
  const jobsByDay: Record<string, ScheduledJob[]> = {};
  for (const job of jobs) {
    const key = new Date(job.scheduledFor).toISOString().split("T")[0];
    if (!jobsByDay[key]) jobsByDay[key] = [];
    jobsByDay[key].push(job);
  }

  const monthDays = getMonthDays(viewYear, viewMonth);
  const todayKey = formatDateKey(now);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
    setExpandedDay(null);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
    setExpandedDay(null);
  }

  function goToday() {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setExpandedDay(null);
  }

  async function submitJob(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.scheduledFor || !form.teamId) return;
    setSubmitting(true);
    try {
      const team = teams.find((t) => t.id === form.teamId);
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          scheduledFor: new Date(form.scheduledFor).toISOString(),
          recurring: form.recurring,
          teamId: form.teamId,
          teamName: team?.name ?? "",
        }),
      });
      if (!res.ok) throw new Error("Failed to create job");
      setShowAddModal(false);
      setForm({ title: "", scheduledFor: "", recurring: "none", teamId: teams[0]?.id ?? "" });
      addToast("Job scheduled successfully", "success");
      fetchJobs();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to create job", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  return (
    <div className="flex flex-col gap-5 p-6 max-w-6xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Schedule
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
            Monthly task calendar across all agent teams
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2.5"
        >
          <Plus size={15} />
          Add Job
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="btn-ghost p-2">
            <ChevronLeft size={14} />
          </button>
          <span
            className="text-sm font-semibold min-w-[160px] text-center"
            style={{ color: "var(--color-text)" }}
          >
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} className="btn-ghost p-2">
            <ChevronRight size={14} />
          </button>
          {!isCurrentMonth && (
            <button onClick={goToday} className="btn-ghost px-2.5 py-1 text-[11px]">
              Today
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {loading && <Loader2 size={14} className="animate-spin" style={{ color: "var(--color-muted)" }} />}
          {/* Team color legend — built from loaded jobs */}
          <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--color-muted)" }}>
            {teamIds.map((tid) => {
              const job = jobs.find((j) => j.teamId === tid);
              return (
                <div key={tid} className="flex items-center gap-1">
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "3px",
                      background: getTeamColor(tid),
                      display: "inline-block",
                    }}
                  />
                  {job?.teamName ?? tid}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: "var(--color-red-dim)", border: "1px solid rgba(248,113,113,0.2)" }}
        >
          <AlertCircle size={15} style={{ color: "var(--color-red)" }} />
          <p className="text-sm flex-1" style={{ color: "var(--color-red)" }}>{error}</p>
          <button
            onClick={fetchJobs}
            className="flex items-center gap-1 text-[11px]"
            style={{ color: "var(--color-red)" }}
          >
            <RefreshCw size={11} /> Retry
          </button>
        </div>
      )}

      {/* Calendar grid */}
      <div className="glass-card overflow-hidden" style={{ position: "relative" }}>
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(6,6,14,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 5,
            }}
          >
            <Loader2 size={24} className="animate-spin" style={{ color: "#818cf8" }} />
          </div>
        )}

        {/* Day headers */}
        <div className="grid grid-cols-7" style={{ borderBottom: "1px solid var(--color-border)" }}>
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center py-2.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-muted)" }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {monthDays.map((date, i) => {
            if (!date) {
              return (
                <div
                  key={`empty-${i}`}
                  className="min-h-[80px]"
                  style={{
                    background: "rgba(6,6,14,0.3)",
                    borderRight: (i + 1) % 7 !== 0 ? "1px solid var(--color-border)" : undefined,
                    borderBottom: i < monthDays.length - 7 ? "1px solid var(--color-border)" : undefined,
                  }}
                />
              );
            }

            const key = formatDateKey(date);
            const dayJobs = jobsByDay[key] || [];
            const isToday = key === todayKey;
            const isExpanded = expandedDay === key;
            const hasJobs = dayJobs.length > 0;

            return (
              <div
                key={key}
                className="min-h-[80px] flex flex-col transition-colors"
                style={{
                  background: isToday ? "rgba(99,102,241,0.05)" : "transparent",
                  borderRight: (i + 1) % 7 !== 0 ? "1px solid var(--color-border)" : undefined,
                  borderBottom: i < monthDays.length - 7 ? "1px solid var(--color-border)" : undefined,
                  cursor: hasJobs ? "pointer" : "default",
                }}
                onClick={() => hasJobs && setExpandedDay(isExpanded ? null : key)}
              >
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span
                    className="text-xs font-medium flex items-center justify-center"
                    style={{
                      color: isToday ? "#a5b4fc" : "var(--color-text)",
                      background: isToday ? "rgba(99,102,241,0.15)" : "transparent",
                      borderRadius: "6px",
                      width: "24px",
                      height: "24px",
                    }}
                  >
                    {date.getDate()}
                  </span>
                  {hasJobs && (
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5">
                        {[...new Set(dayJobs.map((j) => j.teamId))].map((tid) => (
                          <span
                            key={tid}
                            style={{
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              background: getTeamColor(tid),
                              display: "inline-block",
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] font-medium" style={{ color: "var(--color-muted)" }}>
                        {dayJobs.length}
                      </span>
                      <ChevronDown
                        size={10}
                        style={{
                          color: "var(--color-muted)",
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="px-1.5 pb-1.5 flex flex-col gap-1 animate-fade-in">
                    {dayJobs.map((job) => (
                      <div
                        key={job.id}
                        className="px-2 py-1.5 rounded-md"
                        style={{
                          background: "rgba(18,18,31,0.6)",
                          borderLeft: `2px solid ${getTeamColor(job.teamId)}`,
                        }}
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <Clock size={8} style={{ color: "var(--color-muted)" }} />
                          <span className="text-[9px] font-mono" style={{ color: "var(--color-muted)" }}>
                            {getTimeStr(job.scheduledFor)}
                          </span>
                        </div>
                        <p className="text-[10px] font-medium leading-tight" style={{ color: "var(--color-text)" }}>
                          {job.title}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Zap size={7} style={{ color: getTeamColor(job.teamId) }} />
                          <span className="text-[8px]" style={{ color: "var(--color-muted)" }}>
                            {job.teamName}
                          </span>
                          {job.recurring !== "none" && (
                            <span
                              className="text-[7px] px-1 py-0 rounded font-medium ml-1"
                              style={{ background: "rgba(99,102,241,0.08)", color: "#818cf8" }}
                            >
                              {job.recurring}
                            </span>
                          )}
                          <span
                            className="text-[7px] px-1 py-0 rounded font-medium ml-auto"
                            style={{
                              background:
                                job.status === "completed" ? "var(--color-green-dim)" :
                                job.status === "failed" ? "var(--color-red-dim)" :
                                job.status === "running" ? "rgba(99,102,241,0.1)" :
                                "rgba(100,116,139,0.1)",
                              color:
                                job.status === "completed" ? "var(--color-green)" :
                                job.status === "failed" ? "var(--color-red)" :
                                job.status === "running" ? "#818cf8" :
                                "var(--color-muted)",
                            }}
                          >
                            {job.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Job Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowAddModal(false)}
        >
          <form
            onSubmit={submitJob}
            className="glass-card p-6 animate-fade-in"
            style={{ width: "420px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-base" style={{ color: "var(--color-text)" }}>
                Schedule a Job
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-muted)", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--color-muted)" }}>
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Weekly content review"
                  required
                  className="glass-input w-full px-3 py-2 text-sm"
                  style={{ color: "var(--color-text)" }}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--color-muted)" }}>
                  Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduledFor}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledFor: e.target.value }))}
                  required
                  className="glass-input w-full px-3 py-2 text-sm"
                  style={{ color: "var(--color-text)", colorScheme: "dark" }}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--color-muted)" }}>
                  Team
                </label>
                <select
                  value={form.teamId}
                  onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}
                  required
                  className="glass-input w-full px-3 py-2 text-sm"
                  style={{ color: "var(--color-text)", colorScheme: "dark", background: "var(--color-surface-2)" }}
                >
                  {teams.length === 0 && (
                    <option value="" disabled>No teams available</option>
                  )}
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--color-muted)" }}>
                  Recurrence
                </label>
                <select
                  value={form.recurring}
                  onChange={(e) => setForm((f) => ({ ...f, recurring: e.target.value }))}
                  className="glass-input w-full px-3 py-2 text-sm"
                  style={{ color: "var(--color-text)", colorScheme: "dark", background: "var(--color-surface-2)" }}
                >
                  <option value="none">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting || !form.title || !form.scheduledFor || !form.teamId}
                className="btn-primary flex items-center justify-center gap-2 py-2.5 mt-1"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
                {submitting ? "Scheduling..." : "Schedule Job"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
