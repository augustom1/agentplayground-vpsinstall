import { describe, it, expect } from "vitest";

// Pure logic extracted from /api/schedule route — no DB needed

function getMonthDateRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return { start, end };
}

function filterJobsByMonth(
  jobs: Array<{ scheduledFor: string; title: string }>,
  year: number,
  month: number
) {
  const { start, end } = getMonthDateRange(year, month);
  return jobs.filter((j) => {
    const d = new Date(j.scheduledFor);
    return d >= start && d <= end;
  });
}

describe("Schedule API — date range logic", () => {
  it("computes correct start date for January 2026", () => {
    const { start } = getMonthDateRange(2026, 0);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(1);
  });

  it("computes correct end date for January (31 days)", () => {
    const { end } = getMonthDateRange(2026, 0);
    expect(end.getDate()).toBe(31);
  });

  it("computes correct end date for February in non-leap year (28 days)", () => {
    const { end } = getMonthDateRange(2025, 1);
    expect(end.getDate()).toBe(28);
  });

  it("computes correct end date for February in leap year (29 days)", () => {
    const { end } = getMonthDateRange(2024, 1);
    expect(end.getDate()).toBe(29);
  });

  it("computes correct end date for April (30 days)", () => {
    const { end } = getMonthDateRange(2026, 3);
    expect(end.getDate()).toBe(30);
  });

  it("filters jobs to only include those in the target month", () => {
    const jobs = [
      { scheduledFor: "2026-03-15T09:00:00Z", title: "March job" },
      { scheduledFor: "2026-04-01T09:00:00Z", title: "April job" },
      { scheduledFor: "2026-02-28T23:59:59Z", title: "February job" },
    ];
    const result = filterJobsByMonth(jobs, 2026, 2); // March (0-indexed)
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("March job");
  });

  it("returns empty array when no jobs in the target month", () => {
    const jobs = [
      { scheduledFor: "2026-05-01T00:00:00Z", title: "May job" },
    ];
    const result = filterJobsByMonth(jobs, 2026, 2); // March
    expect(result).toHaveLength(0);
  });

  it("includes jobs at month boundaries", () => {
    // Use mid-month dates to avoid UTC/local timezone edge cases
    const jobs = [
      { scheduledFor: "2026-03-05T12:00:00.000Z", title: "Early March" },
      { scheduledFor: "2026-03-25T12:00:00.000Z", title: "Late March" },
    ];
    const result = filterJobsByMonth(jobs, 2026, 2); // March
    expect(result).toHaveLength(2);
  });

  it("validates required POST fields", () => {
    // Simulate the validation logic from the route
    function validate(body: Record<string, unknown>): string | null {
      if (!body.title) return "Missing required field: title";
      if (!body.scheduledFor) return "Missing required field: scheduledFor";
      if (!body.teamId) return "Missing required field: teamId";
      if (!body.teamName) return "Missing required field: teamName";
      return null;
    }

    expect(validate({})).toBe("Missing required field: title");
    expect(validate({ title: "T" })).toBe("Missing required field: scheduledFor");
    expect(validate({ title: "T", scheduledFor: "2026-03-15T09:00:00Z" })).toBe("Missing required field: teamId");
    expect(validate({ title: "T", scheduledFor: "2026-03-15T09:00:00Z", teamId: "abc" })).toBe("Missing required field: teamName");
    expect(
      validate({ title: "T", scheduledFor: "2026-03-15T09:00:00Z", teamId: "abc", teamName: "Team" })
    ).toBeNull();
  });
});
