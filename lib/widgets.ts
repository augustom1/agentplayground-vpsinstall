export type WidgetType = "stat" | "feed" | "calendar";

export interface Widget {
  id: string;
  teamId: string;
  title: string;
  type: WidgetType;
  data: StatData | FeedData | CalendarData;
}

export interface StatData {
  value: string | number;
  label: string;
  change?: string;       // e.g. "+12%"
  changeType?: "up" | "down" | "neutral";
}

export interface FeedData {
  items: Array<{ text: string; time: string }>;
}

export interface CalendarData {
  dots: Array<{ day: number; count: number }>;    // day 0-6, Mon-Sun
}

export function getWidgetsForTeam(teamId: string): Widget[] {
  const registry: Record<string, Widget[]> = {
    marketing: [
      {
        id: "mkt-posts",
        teamId: "marketing",
        title: "Posts This Week",
        type: "stat",
        data: { value: 12, label: "Scheduled", change: "+3", changeType: "up" } as StatData,
      },
      {
        id: "mkt-cal",
        teamId: "marketing",
        title: "Posting Schedule",
        type: "calendar",
        data: { dots: [{ day: 0, count: 3 }, { day: 1, count: 2 }, { day: 2, count: 1 }, { day: 4, count: 4 }, { day: 5, count: 2 }] } as CalendarData,
      },
    ],
    accounting: [
      {
        id: "acc-rev",
        teamId: "accounting",
        title: "Revenue This Month",
        type: "stat",
        data: { value: "$18.4k", label: "Income", change: "+8%", changeType: "up" } as StatData,
      },
      {
        id: "acc-exp",
        teamId: "accounting",
        title: "Expenses This Month",
        type: "stat",
        data: { value: "$11.2k", label: "Expenses", change: "-2%", changeType: "down" } as StatData,
      },
    ],
    messaging: [
      {
        id: "msg-today",
        teamId: "messaging",
        title: "Queries Today",
        type: "stat",
        data: { value: 24, label: "Messages", change: "+5", changeType: "up" } as StatData,
      },
      {
        id: "msg-rt",
        teamId: "messaging",
        title: "Avg Response Time",
        type: "stat",
        data: { value: "1.2s", label: "Response", changeType: "neutral" } as StatData,
      },
    ],
    "website-builder": [
      {
        id: "wb-sites",
        teamId: "website-builder",
        title: "Sites Built",
        type: "stat",
        data: { value: 0, label: "Total", changeType: "neutral" } as StatData,
      },
    ],
  };

  return registry[teamId] ?? [];
}

export function getAllWidgets(): Widget[] {
  return ["marketing", "accounting", "messaging", "website-builder"].flatMap(getWidgetsForTeam);
}
