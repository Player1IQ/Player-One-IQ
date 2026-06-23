"use server";

import { createClient } from "@/lib/supabase/server";
import { isManualPresenceStatus } from "./utils";
import {
  presenceStatuses,
  type PresenceStatus,
} from "./types";

function nowIso() {
  return new Date().toISOString();
}

export async function heartbeatPresence() {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: existing } = await supabase
    .from("user_presence")
    .select("status, is_manual")
    .eq("user_id", user.id)
    .maybeSingle();

  const manual =
    existing?.is_manual &&
    isManualPresenceStatus(existing.status as PresenceStatus);

  const { error } = await supabase.from("user_presence").upsert(
    {
      user_id: user.id,
      status: manual ? existing!.status : "online",
      is_manual: manual,
      last_seen_at: nowIso(),
      updated_at: nowIso(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: error.message };
  return { success: true as const };
}

export async function updateMyPresence(status: PresenceStatus) {
  if (!presenceStatuses.includes(status)) {
    return { error: "Invalid status." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const manual = isManualPresenceStatus(status);
  const timestamp = nowIso();

  const payload: {
    user_id: string;
    status: PresenceStatus;
    is_manual: boolean;
    updated_at: string;
    last_seen_at?: string;
  } = {
    user_id: user.id,
    status,
    is_manual: manual,
    updated_at: timestamp,
  };
  if (status !== "inactive") {
    payload.last_seen_at = timestamp;
  }

  const { error } = await supabase
    .from("user_presence")
    .upsert(payload, { onConflict: "user_id" });

  if (error) return { error: error.message };
  return { success: true as const, status };
}

export async function fetchMyPresence(): Promise<PresenceStatus> {
  const { getMyPresence } = await import("./queries");
  return getMyPresence();
}

export async function setPresenceInactive() {
  const supabase = await createClient();
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("user_presence").upsert(
    {
      user_id: user.id,
      status: "inactive",
      is_manual: false,
      updated_at: nowIso(),
    },
    { onConflict: "user_id" }
  );
}

export async function updateCreatorAvailability(
  creatorId: string,
  status: PresenceStatus
) {
  if (!presenceStatuses.includes(status)) {
    return { error: "Invalid status." };
  }

  const { requireResourceWriteAccess } = await import("@/lib/permissions");
  const permError = await requireResourceWriteAccess("creators");
  if (permError) return permError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const { getOrganizationId } = await import("@/lib/organization/queries");
  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { error } = await supabase
    .from("creators")
    .update({ availability_status: status })
    .eq("id", creatorId)
    .eq("organization_id", organizationId);

  if (error) return { error: error.message };

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/creators");
  revalidatePath(`/creators/${creatorId}`);
  return { success: true as const, status };
}
