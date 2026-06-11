"use server";

import { revalidatePath } from "next/cache";
import { getOrganizationId } from "@/lib/organization/queries";
import { requireFeatureAccess } from "@/lib/permissions";
import { isPlatformOAuthFeatureEnabled } from "@/lib/platform-oauth/config";
import { syncOrgOAuthPlatformAccounts } from "@/lib/platform-oauth/sync-account";

export async function syncOrganizationPlatformRevenue() {
  if (!isPlatformOAuthFeatureEnabled()) {
    return { error: "Platform OAuth is disabled." };
  }

  const permError = await requireFeatureAccess(
    "creator_profiles",
    "platform revenue sync"
  );
  if (permError) return permError;

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const result = await syncOrgOAuthPlatformAccounts(organizationId);

  revalidatePath("/settings");
  revalidatePath("/creators");
  revalidatePath("/");

  if (result.synced === 0 && result.failed > 0) {
    return {
      error: result.errors[0] ?? "Platform sync failed.",
      ...result,
    };
  }

  return { success: true, ...result };
}
