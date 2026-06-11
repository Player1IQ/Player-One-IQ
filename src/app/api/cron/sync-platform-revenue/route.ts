import { NextResponse } from "next/server";
import { isPlatformOAuthFeatureEnabled } from "@/lib/platform-oauth/config";
import { syncAllOAuthPlatformAccounts } from "@/lib/platform-oauth/sync-account";
import { createServiceClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
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
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 503 }
    );
  }

  const result = await syncAllOAuthPlatformAccounts(supabase);

  return NextResponse.json({
    success: true,
    synced: result.synced,
    failed: result.failed,
    errors: result.errors.slice(0, 10),
  });
}
