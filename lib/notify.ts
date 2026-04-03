/**
 * Notification system — currently supports email via Resend
 * Falls back silently if RESEND_API_KEY is not set.
 *
 * Required env vars:
 *   RESEND_API_KEY        — Resend API key (https://resend.com)
 *   NOTIFICATION_EMAIL    — Recipient address for all alerts
 *
 * Optional env vars:
 *   NOTIFICATION_FROM_EMAIL — Sender address (default: notifications@agentplayground.net)
 */

import { Resend } from "resend";

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function getRecipient(): string | null {
  return process.env.NOTIFICATION_EMAIL ?? null;
}

function getFromAddress(): string {
  return process.env.NOTIFICATION_FROM_EMAIL ?? "notifications@agentplayground.net";
}

// ─── Email templates ──────────────────────────────────────────────────────────

function taskCompleteHtml(params: {
  taskTitle: string;
  taskId: string;
  result: string;
  teamName?: string;
  status: "completed" | "failed";
}): string {
  const { taskTitle, taskId, result, teamName, status } = params;
  const isCompleted = status === "completed";
  const statusColor = isCompleted ? "#22c55e" : "#ef4444";
  const statusLabel = isCompleted ? "Completed" : "Failed";
  const icon = isCompleted ? "✓" : "✗";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;overflow:hidden;max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="padding:20px 28px;border-bottom:1px solid #2a2a2a;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:13px;font-weight:600;color:#a78bfa;letter-spacing:0.05em;text-transform:uppercase;">AgentPlayground</span>
                </td>
                <td align="right">
                  <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${isCompleted ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)"};color:${statusColor};">
                    ${icon} ${statusLabel}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px;">
            <h1 style="margin:0 0 6px;font-size:18px;font-weight:600;color:#f1f1f1;">Task ${statusLabel}</h1>
            <p style="margin:0 0 20px;font-size:13px;color:#888;">${teamName ? `Team: ${teamName}` : "No team assigned"}</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border-radius:8px;border:1px solid #2a2a2a;margin-bottom:20px;">
              <tr>
                <td style="padding:14px 16px;">
                  <p style="margin:0 0 4px;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.05em;">Task</p>
                  <p style="margin:0;font-size:14px;color:#e2e2e2;font-weight:500;">${escapeHtml(taskTitle)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 16px 14px;">
                  <p style="margin:0 0 4px;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.05em;">Task ID</p>
                  <p style="margin:0;font-size:12px;color:#888;font-family:monospace;">${escapeHtml(taskId)}</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.05em;">Result</p>
            <div style="background:#111;border-radius:8px;border:1px solid #2a2a2a;padding:14px 16px;max-height:200px;overflow:hidden;">
              <p style="margin:0;font-size:13px;color:#c9c9c9;white-space:pre-wrap;word-break:break-word;line-height:1.5;">${escapeHtml(result.slice(0, 800))}${result.length > 800 ? "\n\n… (truncated)" : ""}</p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #2a2a2a;">
            <p style="margin:0;font-size:11px;color:#555;">Sent by AgentPlayground · <a href="https://agentplayground.net" style="color:#a78bfa;text-decoration:none;">agentplayground.net</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function scheduledJobFailedHtml(params: {
  jobTitle: string;
  teamName: string;
  error: string;
}): string {
  const { jobTitle, teamName, error } = params;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;overflow:hidden;max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="padding:20px 28px;border-bottom:1px solid #2a2a2a;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:13px;font-weight:600;color:#a78bfa;letter-spacing:0.05em;text-transform:uppercase;">AgentPlayground</span>
                </td>
                <td align="right">
                  <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(239,68,68,0.12);color:#ef4444;">
                    ✗ Scheduled Job Failed
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px;">
            <h1 style="margin:0 0 6px;font-size:18px;font-weight:600;color:#f1f1f1;">Scheduled Job Failed</h1>
            <p style="margin:0 0 20px;font-size:13px;color:#888;">Team: ${escapeHtml(teamName)}</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border-radius:8px;border:1px solid #2a2a2a;margin-bottom:20px;">
              <tr>
                <td style="padding:14px 16px;">
                  <p style="margin:0 0 4px;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.05em;">Job</p>
                  <p style="margin:0;font-size:14px;color:#e2e2e2;font-weight:500;">${escapeHtml(jobTitle)}</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.05em;">Error</p>
            <div style="background:#1a0e0e;border-radius:8px;border:1px solid rgba(239,68,68,0.2);padding:14px 16px;">
              <p style="margin:0;font-size:13px;color:#f87171;white-space:pre-wrap;word-break:break-word;line-height:1.5;">${escapeHtml(error.slice(0, 600))}</p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #2a2a2a;">
            <p style="margin:0;font-size:11px;color:#555;">Sent by AgentPlayground · <a href="https://agentplayground.net" style="color:#a78bfa;text-decoration:none;">agentplayground.net</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send an email when a task completes or fails.
 * Silently no-ops if RESEND_API_KEY or NOTIFICATION_EMAIL are not configured.
 */
export async function notifyTaskComplete(params: {
  taskTitle: string;
  taskId: string;
  result: string;
  teamName?: string;
  status: "completed" | "failed";
}): Promise<void> {
  try {
    const client = getClient();
    const to = getRecipient();
    if (!client || !to) return;

    const statusLabel = params.status === "completed" ? "Completed" : "Failed";
    await client.emails.send({
      from: getFromAddress(),
      to,
      subject: `[AgentPlayground] Task ${statusLabel}: ${params.taskTitle.slice(0, 60)}`,
      html: taskCompleteHtml(params),
    });
  } catch (err) {
    console.error("[notify] Failed to send task notification:", err);
  }
}

/**
 * Send an email when a scheduled job fails.
 * Silently no-ops if RESEND_API_KEY or NOTIFICATION_EMAIL are not configured.
 */
export async function notifyScheduledJobFailed(params: {
  jobTitle: string;
  teamName: string;
  error: string;
}): Promise<void> {
  try {
    const client = getClient();
    const to = getRecipient();
    if (!client || !to) return;

    await client.emails.send({
      from: getFromAddress(),
      to,
      subject: `[AgentPlayground] Scheduled Job Failed: ${params.jobTitle.slice(0, 60)}`,
      html: scheduledJobFailedHtml(params),
    });
  } catch (err) {
    console.error("[notify] Failed to send scheduled job notification:", err);
  }
}
