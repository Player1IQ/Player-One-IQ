import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isTransactionalEmailConfigured } from "@/lib/email/send";
import { resolveTransactionalFrom } from "@/lib/email/from";
import { sendDeadlineEmails } from "@/lib/notifications/deadlines";
import { sendMarketplaceOpportunityDigest } from "@/lib/notifications/opportunities";
import { sendWeeklyBriefEmails } from "@/lib/notifications/weekly-brief";

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

  if (!isTransactionalEmailConfigured()) {
    return NextResponse.json({
      skipped: true,
      reason: "Transactional email is not configured.",
    });
  }

  const emailFrom = await resolveTransactionalFrom();
  if (!emailFrom.ok) {
    return NextResponse.json({
      skipped: true,
      reason: emailFrom.error,
      emailFromVerified: false,
    });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 503 }
    );
  }

  const since = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString();
  const [deadlines, marketplace, weeklyBrief] = await Promise.all([
    sendDeadlineEmails(supabase),
    sendMarketplaceOpportunityDigest(supabase, since),
    sendWeeklyBriefEmails(supabase),
  ]);

  return NextResponse.json({
    success: true,
    deadlines,
    marketplace,
    weeklyBrief,
  });
}
