"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { requireWriteAccess } from "@/lib/permissions";
import { platforms, type Platform } from "@/lib/creators";
import {
  getCurrentPeriodMonth,
  revenueTypes,
  type RevenueType,
} from "@/lib/creator-revenue";

interface RevenueInput {
  advertisement?: number;
  subscription?: number;
  donations?: number;
  other?: number;
}

async function saveRevenueEntry(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  params: {
    organizationId: string;
    creatorId: string;
    platformAccountId: string;
    platform: string;
    revenueType: RevenueType;
    amount: number;
    periodMonth: string;
  }
) {
  const { data: existing } = await supabase
    .from("creator_revenue_entries")
    .select("id, source")
    .eq("platform_account_id", params.platformAccountId)
    .eq("revenue_type", params.revenueType)
    .eq("period_month", params.periodMonth)
    .maybeSingle();

  if (existing?.source === "api_sync") {
    return null;
  }

  if (params.amount <= 0) {
    if (existing) {
      await supabase
        .from("creator_revenue_entries")
        .delete()
        .eq("id", existing.id);
    }
    return null;
  }

  const payload = {
    organization_id: params.organizationId,
    creator_id: params.creatorId,
    platform_account_id: params.platformAccountId,
    platform: params.platform,
    revenue_type: params.revenueType,
    amount: params.amount,
    period_month: params.periodMonth,
    source: "manual" as const,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from("creator_revenue_entries")
      .update(payload)
      .eq("id", existing.id);
    return error;
  }

  const { error } = await supabase.from("creator_revenue_entries").insert(payload);
  return error;
}

async function getCreatorInOrg(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  organizationId: string,
  creatorId: string
) {
  const { data, error } = await supabase
    .from("creators")
    .select("id")
    .eq("id", creatorId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function connectCreatorPlatformAccount(
  creatorId: string,
  platform: Platform,
  accountHandle: string,
  initialRevenue?: RevenueInput
) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

  if (!platforms.includes(platform)) {
    return { error: "Invalid platform." };
  }

  const handle = accountHandle.trim();
  if (!handle) return { error: "Account handle is required." };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const creator = await getCreatorInOrg(supabase, organizationId, creatorId);
  if (!creator) return { error: "Creator not found." };

  const { data: account, error } = await supabase
    .from("creator_platform_accounts")
    .upsert(
      {
        organization_id: organizationId,
        creator_id: creatorId,
        platform,
        account_handle: handle,
        display_name: handle,
        connection_method: "manual",
        connection_status: "connected_manual",
        sync_error: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "creator_id,platform" }
    )
    .select("id")
    .single();

  if (error || !account) {
    return { error: error?.message ?? "Failed to connect platform account." };
  }

  if (initialRevenue) {
    const periodMonth = getCurrentPeriodMonth();
    for (const revenueType of revenueTypes) {
      const amount = initialRevenue[revenueType];
      if (amount === undefined) continue;

      const entryError = await saveRevenueEntry(supabase, {
        organizationId,
        creatorId,
        platformAccountId: account.id,
        platform,
        revenueType,
        amount,
        periodMonth,
      });
      if (entryError) return { error: entryError.message };
    }
  }

  revalidatePath(`/creators/${creatorId}`);
  revalidatePath("/");
  revalidatePath("/creators");
  return { success: true };
}

export async function disconnectCreatorPlatformAccount(accountId: string) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: account, error: fetchError } = await supabase
    .from("creator_platform_accounts")
    .select("creator_id")
    .eq("id", accountId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (fetchError || !account) {
    return { error: "Platform account not found." };
  }

  const { error } = await supabase
    .from("creator_platform_accounts")
    .update({
      connection_status: "disconnected",
      oauth_metadata: {},
      sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId)
    .eq("organization_id", organizationId);

  if (error) return { error: error.message };

  revalidatePath(`/creators/${account.creator_id}`);
  revalidatePath("/");
  return { success: true };
}

export async function upsertCreatorPlatformRevenue(
  accountId: string,
  revenue: RevenueInput
) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: account, error: fetchError } = await supabase
    .from("creator_platform_accounts")
    .select("id, creator_id, platform")
    .eq("id", accountId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (fetchError || !account) {
    return { error: "Platform account not found." };
  }

  const periodMonth = getCurrentPeriodMonth();

  for (const revenueType of revenueTypes) {
    const amount = revenue[revenueType];
    if (amount === undefined) continue;

    const entryError = await saveRevenueEntry(supabase, {
      organizationId,
      creatorId: account.creator_id,
      platformAccountId: account.id,
      platform: account.platform,
      revenueType,
      amount,
      periodMonth,
    });
    if (entryError) return { error: entryError.message };
  }

  revalidatePath(`/creators/${account.creator_id}`);
  revalidatePath("/");
  return { success: true };
}

export async function syncCreatorPlatformAccount(accountId: string) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { syncCreatorPlatformAccountById } = await import(
    "@/lib/platform-oauth/sync-account"
  );

  const result = await syncCreatorPlatformAccountById(accountId, organizationId);

  if ("error" in result) return { error: result.error };

  const supabase = await createClient();
  if (supabase) {
    const { data: account } = await supabase
      .from("creator_platform_accounts")
      .select("creator_id")
      .eq("id", accountId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (account?.creator_id) {
      revalidatePath(`/creators/${account.creator_id}`);
    }
  }

  revalidatePath("/");
  revalidatePath("/creators");
  return { success: true };
}

export async function syncAllCreatorOAuthAccounts(creatorId: string) {
  const permError = await requireWriteAccess();
  if (permError) return permError;

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const { data: accounts } = await supabase
    .from("creator_platform_accounts")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("creator_id", creatorId)
    .eq("connection_status", "connected_oauth");

  const { syncCreatorPlatformAccountById } = await import(
    "@/lib/platform-oauth/sync-account"
  );

  let synced = 0;
  const errors: string[] = [];

  for (const account of accounts ?? []) {
    const result = await syncCreatorPlatformAccountById(
      account.id,
      organizationId
    );
    if ("error" in result) {
      errors.push(result.error);
    } else {
      synced += 1;
    }
  }

  revalidatePath(`/creators/${creatorId}`);
  revalidatePath("/");
  revalidatePath("/creators");

  if (synced === 0 && errors.length > 0) {
    return { error: errors[0] };
  }

  return {
    success: true,
    synced,
    failed: errors.length,
  };
}
