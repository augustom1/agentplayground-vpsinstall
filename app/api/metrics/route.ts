import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";

// GET /api/metrics — aggregated dashboard data
export async function GET() {
  try {
    const [teamCount, taskStatusGroups, recentActivity, upcomingJobs, recentRuns, teams] =
      await Promise.all([
        prisma.agentTeam.count({ where: { isSystemTeam: false } }),
        prisma.task.groupBy({ by: ["status"], _count: { status: true } }),
        prisma.activityLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.scheduledJob.findMany({
          where: { scheduledFor: { gte: new Date() } },
          orderBy: { scheduledFor: "asc" },
          take: 5,
        }),
        prisma.playgroundRun.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.agentTeam.findMany({
          where: { isSystemTeam: false },
          select: {
            id: true,
            name: true,
            status: true,
            tasksCompleted: true,
            lastActivity: true,
            description: true,
          },
          take: 20,
        }),
      ]);

    const taskCounts = Object.fromEntries(
      taskStatusGroups.map((g) => [g.status, g._count.status])
    );

    return NextResponse.json({
      teamCount,
      taskCounts,
      recentActivity,
      upcomingJobs,
      recentRuns,
      teams,
    });
  } catch (err) {
    return apiError(err);
  }
}
