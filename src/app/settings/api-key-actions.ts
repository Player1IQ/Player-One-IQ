"use server";

import { revalidatePath } from "next/cache";
import {
  createOrganizationApiKey,
  getOrganizationApiKeysForSettings,
  revokeOrganizationApiKey,
  type OrganizationApiKeySummary,
} from "@/lib/api/key-management";

export async function listApiKeysAction(): Promise<{
  error?: string;
  keys?: OrganizationApiKeySummary[];
}> {
  const keys = await getOrganizationApiKeysForSettings();
  return { keys };
}

export async function createApiKeyAction(input: {
  name: string;
}): Promise<{
  error?: string;
  key?: OrganizationApiKeySummary;
  fullKey?: string;
}> {
  const result = await createOrganizationApiKey(input);
  if (result.error) return { error: result.error };

  revalidatePath("/settings");
  return {
    key: result.key,
    fullKey: result.fullKey,
  };
}

export async function revokeApiKeyAction(
  keyId: string
): Promise<{ error?: string }> {
  const result = await revokeOrganizationApiKey(keyId);
  if (result.error) return { error: result.error };

  revalidatePath("/settings");
  return {};
}
