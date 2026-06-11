"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { requireBillingManageAccess } from "@/lib/permissions";
import type { BillingInterval, PlanCode } from "./types";
import { getSubscriptionPlans } from "./queries";

export async function changeSubscriptionPlan(
  planCode: PlanCode,
  billingInterval: BillingInterval = "monthly"
) {
  const permError = await requireBillingManageAccess();
  if (permError) return permError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const plans = await getSubscriptionPlans();
  const plan = plans.find((p) => p.code === planCode);
  if (!plan) return { error: "Invalid plan selected." };

  const now = new Date();
  const periodEnd = new Date(now);
  if (billingInterval === "yearly") {
    periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 1);
  } else {
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
  }

  const { error } = await supabase
    .from("organization_subscriptions")
    .upsert(
      {
        organization_id: organizationId,
        plan_id: plan.id,
        status: "active",
        billing_interval: billingInterval,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        canceled_at: null,
        updated_at: now.toISOString(),
      },
      { onConflict: "organization_id" }
    );

  if (error) return { error: error.message };

  revalidatePath("/billing");
  revalidatePath("/settings");
  revalidatePath("/");

  return { success: true, planCode };
}

export async function cancelSubscription() {
  const permError = await requireBillingManageAccess();
  if (permError) return permError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { error } = await supabase
    .from("organization_subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId);

  if (error) return { error: error.message };

  revalidatePath("/billing");
  return { success: true };
}
