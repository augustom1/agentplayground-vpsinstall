/**
 * AgentPlayground — Pricing & Plan Configuration
 *
 * STATUS: DEFINED, NOT ACTIVE.
 *
 * The billing schema (ApiUsage, UserCredits, Invoice) is in place.
 * To go live:
 *   1. Call trackUsage() from each API route (chat, web_search, web_browse, etc.)
 *   2. Call checkPlanLimit() in middleware / API routes to enforce limits
 *   3. Connect Stripe (or any payment processor) to UserCredits for top-ups
 *   4. Wire /api/cron → generateMonthlyInvoices() on the 1st of each month
 *
 * Credit system
 *   1 credit  = $0.001  (one-tenth of a cent)
 *   $1        = 1,000 credits
 *   $10       = 10,000 credits
 */

// ─── Unit conversion ─────────────────────────────────────────────────────────

export const CREDIT_VALUE_USD = 0.001;

export function creditsToUsd(credits: number): number {
  return parseFloat((credits * CREDIT_VALUE_USD).toFixed(4));
}

export function usdToCredits(usd: number): number {
  return Math.floor(usd / CREDIT_VALUE_USD);
}

// ─── Per-service pricing (credits) ───────────────────────────────────────────

export const PRICING = {
  /**
   * Claude API — credits per 1,000 tokens
   * Mirrors Anthropic's per-million pricing scaled to credits.
   */
  claude: {
    "claude-sonnet-4-6":         { input: 3,    output: 15   },
    "claude-opus-4-6":           { input: 15,   output: 75   },
    "claude-haiku-4-5-20251001": { input: 0.25, output: 1.25 },
    default:                     { input: 3,    output: 15   },
  },

  /** Tool calls inside a Claude conversation */
  web_search: 10,   // credits per call
  web_browse:  5,   // credits per call

  /** Ollama (local) — free forever */
  ollama: 0,

  /** Server compute */
  compute: {
    shared:    1,  // credits per minute  (~$0.001/min = ~$0.06/hr)
    dedicated: 5,  // credits per minute  (~$0.005/min = ~$0.30/hr)
  },
} as const;

/** Calculate credits for a Claude API call */
export function claudeCallCredits(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const rates =
    PRICING.claude[model as keyof typeof PRICING.claude] ??
    PRICING.claude.default;
  return (inputTokens / 1000) * rates.input + (outputTokens / 1000) * rates.output;
}

// ─── Credit packages (pre-pay top-ups) ───────────────────────────────────────
// Slight bulk discount at higher tiers.

export const CREDIT_PACKAGES = [
  { id: "starter",  credits:   2_000, usd:  2,  label: "Starter",  perCredit: 0.001000 },
  { id: "basic",    credits:   5_500, usd:  5,  label: "Basic",    perCredit: 0.000909 },
  { id: "standard", credits:  12_000, usd: 10,  label: "Standard", perCredit: 0.000833 },
  { id: "growth",   credits:  35_000, usd: 25,  label: "Growth",   perCredit: 0.000714 },
  { id: "scale",    credits: 100_000, usd: 60,  label: "Scale",    perCredit: 0.000600 },
  { id: "pro",      credits: 300_000, usd: 150, label: "Pro",      perCredit: 0.000500 },
] as const;

export type CreditPackageId = typeof CREDIT_PACKAGES[number]["id"];

// ─── Plan definitions ─────────────────────────────────────────────────────────

export const PLANS = {
  free: {
    name:                "Free",
    monthlyFreeCredits:  500,       // reset on 1st of month
    claudeEnabled:       false,     // Ollama only — no external LLM cost
    ollamaEnabled:       true,
    maxTeams:            2,
    maxAgentsPerTeam:    3,
    dailyCallLimit:      50,        // API calls/day (web_search + web_browse)
    creditTopUpAllowed:  false,     // must upgrade plan to buy credits
    hardCap:             500,       // balance can never exceed this; blocked at 0
  },
  pro: {
    name:                "Pro",
    monthlyFreeCredits:  1_000,     // included; then deducted from purchased balance
    claudeEnabled:       true,
    ollamaEnabled:       true,
    maxTeams:            20,
    maxAgentsPerTeam:    20,
    dailyCallLimit:      null,      // unlimited
    creditTopUpAllowed:  true,
    hardCap:             null,      // no cap — top up as needed
  },
  enterprise: {
    name:                "Enterprise",
    monthlyFreeCredits:  5_000,
    claudeEnabled:       true,
    ollamaEnabled:       true,
    maxTeams:            null,      // unlimited
    maxAgentsPerTeam:    null,
    dailyCallLimit:      null,
    creditTopUpAllowed:  true,
    hardCap:             null,
  },
} as const;

export type Plan = keyof typeof PLANS;

// ─── Helpers (inactive — use these when you wire billing up) ─────────────────

/**
 * Returns true if a user on this plan can use the Claude API.
 * Free tier: blocked. Pro/Enterprise: allowed if balance > 0.
 */
export function canUseClaudeApi(plan: Plan, balance: number): boolean {
  if (!PLANS[plan].claudeEnabled) return false;
  if (PLANS[plan].hardCap !== null && balance <= 0) return false;
  return true;
}

/**
 * Returns the amount of free credits to grant on the 1st of each month.
 */
export function monthlyFreeCredits(plan: Plan): number {
  return PLANS[plan].monthlyFreeCredits;
}

/**
 * Returns the daily call limit for a plan (null = unlimited).
 */
export function dailyCallLimit(plan: Plan): number | null {
  return PLANS[plan].dailyCallLimit;
}
