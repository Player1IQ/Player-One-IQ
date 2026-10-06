"use server";

import { revalidatePath } from "next/cache";
import { canAccessCreator } from "@/lib/permissions";
import { getCreatorPlatformAccounts } from "@/lib/creator-revenue/queries";
import { isOAuthPlatform } from "./types";
import { recordCreatorPlatformMetricSnapshot } from "./metric-history";

export async function refreshCreatorAudienceAction(
  creatorId: string
): Promise<{ ok: true; updatedAt: string } | { ok: false; error: string }> {
  if (!(await canAccessCreator(creatorId))) {
    return { ok: false, error: "You cannot refresh this creator." };
  }

  const accounts = await getCreatorPlatformAccounts(creatorId);
  const connected = accounts.filter(
    (account) =>
      account.connectionStatus === "connected_oauth" &&
      isOAuthPlatform(account.platform)
  );

  await Promise.all(
    connected.map((account) =>
      recordCreatorPlatformMetricSnapshot({
        organizationId: account.organizationId,
        creatorId,
        platform: account.platform,
        platformAccountId: account.id,
      }).catch((error) => {
        console.error(
          "[oauth] refresh failed",
          account.platform,
          error instanceof Error ? error.message : error
        );
      })
    )
  );

  revalidatePath("/portal");
  revalidatePath("/portal/growth");
  revalidatePath(`/creators/${creatorId}`);

  return { ok: true, updatedAt: new Date().toISOString() };
}
