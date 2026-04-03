/**
 * Usage Tracker — writes ApiUsage records and debits UserCredits.
 * Call this from any API route that consumes billable resources.
 */

import { prisma } from "@/lib/prisma";
import { claudeCallCredits, PRICING } from "@/lib/pricing";

export interface TrackUsageParams {
  userId: string;
  service: "claude" | "ollama" | "web_search" | "web_browse" | "compute";
  endpoint?: string;        // model name for claude, ignored for others
  inputUnits?: number;      // input tokens (claude)
  outputUnits?: number;     // output tokens (claude)
  units?: number;           // calls or minutes for other services
  unitType?: "tokens" | "calls" | "minutes";
  metadata?: Record<string, unknown>;
}

/**
 * Track API usage and deduct credits from user's wallet.
 * Returns the number of credits consumed (0 for Ollama).
 */
export async function trackUsage(params: TrackUsageParams): Promise<number> {
  const {
    userId,
    service,
    endpoint,
    inputUnits = 0,
    outputUnits = 0,
    units = 1,
    unitType = "calls",
    metadata,
  } = params;

  let credits = 0;

  switch (service) {
    case "claude":
      credits = claudeCallCredits(endpoint ?? "default", inputUnits, outputUnits);
      break;
    case "web_search":
      credits = PRICING.web_search * units;
      break;
    case "web_browse":
      credits = PRICING.web_browse * units;
      break;
    case "compute":
      credits = PRICING.compute.shared * units;
      break;
    case "ollama":
    default:
      credits = 0;
  }

  try {
    // Write usage record
    await prisma.apiUsage.create({
      data: {
        userId,
        service,
        endpoint: endpoint ?? null,
        inputUnits,
        outputUnits,
        units,
        unitType,
        credits,
        metadata: metadata ?? undefined,
      },
    });

    // Debit credit wallet (upsert handles first-time users)
    if (credits > 0) {
      await prisma.userCredits.upsert({
        where: { userId },
        update: {
          balance: { decrement: credits },
          lifetimeUsed: { increment: credits },
        },
        create: {
          userId,
          balance: -credits,
          lifetimeUsed: credits,
          lifetimePurchased: 0,
        },
      });
    }
  } catch (err) {
    // Non-fatal — log but don't break the request
    console.error("[usage-tracker] Failed to record usage:", err);
  }

  return credits;
}

/**
 * Get a user's current credit balance.
 * Returns 0 if no wallet exists yet.
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const wallet = await prisma.userCredits.findUnique({
    where: { userId },
    select: { balance: true },
  });
  return wallet?.balance ?? 0;
}

/**
 * Add credits to a user's wallet (admin top-up or Stripe purchase).
 */
export async function addCredits(
  userId: string,
  amount: number,
  source: "purchase" | "monthly_reset" | "admin_grant"
): Promise<number> {
  const wallet = await prisma.userCredits.upsert({
    where: { userId },
    update: {
      balance: { increment: amount },
      lifetimePurchased: source === "purchase" ? { increment: amount } : undefined,
    },
    create: {
      userId,
      balance: amount,
      lifetimePurchased: source === "purchase" ? amount : 0,
      lifetimeUsed: 0,
    },
  });
  return wallet.balance;
}
