import { NextResponse } from "next/server";

export function apiError(err: unknown, status = 500) {
  const message = err instanceof Error ? err.message : String(err);
  console.error("[API Error]", message);
  return NextResponse.json({ error: message }, { status });
}
