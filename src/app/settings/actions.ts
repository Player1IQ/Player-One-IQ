"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { organizationTypes } from "@/lib/organization";
import { requireSettingsManageAccess } from "@/lib/permissions";

export interface OrganizationSettingsInput {
  name: string;
  type: string;
}

export async function updateOrganizationSettings(input: OrganizationSettingsInput) {
  const permError = await requireSettingsManageAccess();
  if (permError) return permError;

  const name = input.name.trim();
  if (!name) return { error: "Organization name is required." };

  if (!organizationTypes.includes(input.type as (typeof organizationTypes)[number])) {
    return { error: "Invalid organization type." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { error } = await supabase
    .from("organizations")
    .update({ name, type: input.type })
    .eq("id", organizationId);

  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.updateUser({
      data: { organization_name: name, organization_type: input.type },
    });
  }

  revalidatePath("/settings");
  revalidatePath("/");
  return { success: true };
}
