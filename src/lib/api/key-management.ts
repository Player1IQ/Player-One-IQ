import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { requireSettingsManageAccess } from "@/lib/permissions";
import { requireFeatureAccess } from "@/lib/permissions";
import { generateApiKey } from "./keys";

export interface OrganizationApiKeySummary {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

interface OrganizationApiKeyRow {
  id: string;
  organization_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  created_by: string | null;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

function mapApiKeyRow(row: OrganizationApiKeyRow): OrganizationApiKeySummary {
  return {
    id: row.id,
    name: row.name,
    keyPrefix: row.key_prefix,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    revokedAt: row.revoked_at,
  };
}

export async function listOrganizationApiKeys(): Promise<
  OrganizationApiKeySummary[]
> {
  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("organization_api_keys")
    .select("id, organization_id, name, key_prefix, key_hash, created_by, last_used_at, revoked_at, created_at")
    .eq("organization_id", organizationId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as OrganizationApiKeyRow[]).map(mapApiKeyRow);
}

export async function createOrganizationApiKey(input: {
  name: string;
}): Promise<{ error?: string; key?: OrganizationApiKeySummary; fullKey?: string }> {
  const permError = await requireSettingsManageAccess();
  if (permError) return permError;

  const featureError = await requireFeatureAccess("api_access", "API access");
  if (featureError) return featureError;

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const name = input.name.trim();
  if (!name) return { error: "Key name is required." };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { fullKey, keyPrefix, keyHash } = generateApiKey();

  const { data, error } = await supabase
    .from("organization_api_keys")
    .insert({
      organization_id: organizationId,
      name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      created_by: user.id,
    })
    .select("id, organization_id, name, key_prefix, key_hash, created_by, last_used_at, revoked_at, created_at")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create API key." };
  }

  return {
    key: mapApiKeyRow(data as OrganizationApiKeyRow),
    fullKey,
  };
}

export async function revokeOrganizationApiKey(
  keyId: string
): Promise<{ error?: string }> {
  const permError = await requireSettingsManageAccess();
  if (permError) return permError;

  const featureError = await requireFeatureAccess("api_access", "API access");
  if (featureError) return featureError;

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const { data: existing } = await supabase
    .from("organization_api_keys")
    .select("id")
    .eq("id", keyId)
    .eq("organization_id", organizationId)
    .is("revoked_at", null)
    .maybeSingle();

  if (!existing) return { error: "API key not found." };

  const { error } = await supabase
    .from("organization_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("organization_id", organizationId);

  if (error) return { error: error.message };
  return {};
}

export async function getOrganizationApiKeysForSettings(): Promise<
  OrganizationApiKeySummary[]
> {
  const permError = await requireSettingsManageAccess();
  if (permError) return [];

  const featureError = await requireFeatureAccess("api_access", "API access");
  if (featureError) return [];

  return listOrganizationApiKeys();
}
