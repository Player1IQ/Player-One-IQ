import { NextResponse } from "next/server";
import { getConfiguredAppUrl } from "@/lib/email/app-url";
import { evaluateHealthUptimeCheck } from "@/lib/ops/alerts-config";
import { reportOpsAlert } from "@/lib/ops/alerts";

export const maxDuration = 15;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    void reportOpsAlert({
      kind: "uptime",
      title: "Uptime check failed",
      detail: "CRON_SECRET is not configured.",
    });
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const healthUrl = `${getConfiguredAppUrl()}/api/health`;

  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    const result = evaluateHealthUptimeCheck({
      status: response.status,
      body,
    });

    if (!result.ok) {
      void reportOpsAlert({
        kind: "uptime",
        title: "Uptime check failed",
        detail: `${result.reason} (${healthUrl})`,
      });
      return NextResponse.json(
        { ok: false, healthUrl, reason: result.reason },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true, healthUrl });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Health fetch failed.";
    void reportOpsAlert({
      kind: "uptime",
      title: "Uptime check failed",
      detail: `${detail} (${healthUrl})`,
    });
    return NextResponse.json(
      { ok: false, healthUrl, reason: detail },
      { status: 503 }
    );
  }
}
