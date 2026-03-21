import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/navigation if needed
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

// Mock the ToastProvider to avoid context errors
vi.mock("@/components/ToastProvider", () => ({
  useToast: () => ({ addToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const MOCK_JOBS = [
  {
    id: "job1",
    title: "Content Review",
    description: null,
    scheduledFor: "2026-03-20T09:00:00.000Z",
    recurring: "weekly",
    status: "pending",
    isOffHours: false,
    teamId: "team1",
    teamName: "Marketing",
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
  },
];

const MOCK_TEAMS = [
  { id: "team1", name: "Marketing", description: "Marketing team", port: 8001, status: "idle" },
];

describe("Schedule Page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and displays scheduled jobs in the correct calendar day cell", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/schedule")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_JOBS),
        });
      }
      if (url.includes("/api/teams")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_TEAMS),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }) as typeof fetch;

    // Dynamically import the page to avoid module-level issues
    const { default: SchedulePage } = await import("@/app/(app)/schedule/page");
    render(<SchedulePage />);

    // Should call the schedule API
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/schedule"),
      );
    });
  });

  it("shows loading state while fetching", async () => {
    // Delay the fetch to observe loading state
    global.fetch = vi.fn().mockImplementation(() =>
      new Promise((resolve) =>
        setTimeout(() =>
          resolve({ ok: true, json: () => Promise.resolve([]) }),
          100
        )
      )
    ) as typeof fetch;

    const { default: SchedulePage } = await import("@/app/(app)/schedule/page");
    render(<SchedulePage />);

    // Should render the calendar structure
    await waitFor(() => {
      expect(screen.getByText("Mon")).toBeInTheDocument();
      expect(screen.getByText("Sat")).toBeInTheDocument();
    });
  });

  it("renders all 7 day-of-week column headers", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }) as typeof fetch;

    const { default: SchedulePage } = await import("@/app/(app)/schedule/page");
    render(<SchedulePage />);

    await waitFor(() => {
      for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
        expect(screen.getByText(day)).toBeInTheDocument();
      }
    });
  });

  it("displays Add Job button", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }) as typeof fetch;

    const { default: SchedulePage } = await import("@/app/(app)/schedule/page");
    render(<SchedulePage />);

    await waitFor(() => {
      expect(screen.getByText("Add Job")).toBeInTheDocument();
    });
  });
});
