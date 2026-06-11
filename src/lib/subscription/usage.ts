import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import type { UsageMetricKey } from "./types";

function currentPeriodMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export async function getUsageMetricCount(
  metricKey: UsageMetricKey
): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return 0;

  const organizationId = await getOrganizationId();
  if (!organizationId) return 0;

  const periodMonth = currentPeriodMonth();

  const { data } = await supabase
    .from("usage_tracking")
    .select("count")
    .eq("organization_id", organizationId)
    .eq("metric_key", metricKey)
    .eq("period_month", periodMonth)
    .maybeSingle();

  return data?.count ?? 0;
}

export async function incrementUsageMetric(
  metricKey: UsageMetricKey,
  amount = 1
): Promise<void> {
  const supabase = await createClient();
  if (!supabase) return;

  const organizationId = await getOrganizationId();
  if (!organizationId) return;

  const periodMonth = currentPeriodMonth();

  const { data: existing } = await supabase
    .from("usage_tracking")
    .select("id, count")
    .eq("organization_id", organizationId)
    .eq("metric_key", metricKey)
    .eq("period_month", periodMonth)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("usage_tracking")
      .update({
        count: existing.count + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return;
  }

  await supabase.from("usage_tracking").insert({
    organization_id: organizationId,
    metric_key: metricKey,
    period_month: periodMonth,
    count: amount,
  });
}
