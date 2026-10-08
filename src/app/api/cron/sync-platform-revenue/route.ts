import { NextResponse } from "next/server";
import { isPlatformOAuthFeatureEnabled } from "@/lib/platform-oauth/config";
import { syncAllOAuthPlatformAccounts } from "@/lib/platform-oauth/sync-account";
import { recordAllConnectedPlatformMetricSnapshots } from "@/lib/platform-oauth/metric-history";
import { createServiceClient } from "@/lib/supabase/admin";
import { reportOpsAlert } from "@/lib/ops/alerts";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    void reportOpsAlert({
      kind: "cron",
      title: "Cron failed: sync-platform-revenue",
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

  if (!isPlatformOAuthFeatureEnabled()) {
    return NextResponse.json({
      skipped: true,
      reason: "Platform OAuth is disabled.",
    });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    void reportOpsAlert({
      kind: "cron",
      title: "Cron failed: sync-platform-revenue",
      detail: "SUPABASE_SERVICE_ROLE_KEY is not configured.",
    });
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 503 }
    );
  }

  try {
    const result = await syncAllOAuthPlatformAccounts(supabase);
    const metrics = await recordAllConnectedPlatformMetricSnapshots(supabase);

    if (result.failed > 0 || metrics.failed > 0) {
      void reportOpsAlert({
        kind: "cron",
        title: "Cron failed: sync-platform-revenue",
        detail: [
          `${result.failed} account sync(s) failed.`,
          `${metrics.failed} metric snapshot(s) failed.`,
          ...result.errors.slice(0, 8),
          ...metrics.errors.slice(0, 8),
        ].join("\n"),
      });
    }

    return NextResponse.json({
      success: true,
      synced: result.synced,
      failed: result.failed,
      errors: result.errors.slice(0, 10),
      metricsRecorded: metrics.recorded,
      metricsFailed: metrics.failed,
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Platform revenue cron failed.";
    void reportOpsAlert({
      kind: "cron",
      title: "Cron failed: sync-platform-revenue",
      detail,
    });
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
