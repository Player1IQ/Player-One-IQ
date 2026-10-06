import { createServiceClient } from "@/lib/supabase/admin";
import { organizationHasFeature } from "@/lib/subscription/queries";
import { hashApiKey, verifyApiKeyFormat } from "./keys";
import { API_RATE_LIMIT_PER_MINUTE } from "./limits";

export { API_RATE_LIMIT_PER_MINUTE };

export type ApiAuthResult =
  | { ok: true; organizationId: string; keyId: string }
  | {
      ok: false;
      status: 401 | 403 | 429 | 503;
      code: string;
      error: string;
    };

function extractApiKeyFromRequest(request: Request): string | null {
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization) return null;

  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch?.[1]) {
    return bearerMatch[1].trim();
  }

  const apiKeyMatch = authorization.match(/^ApiKey\s+(.+)$/i);
  if (apiKeyMatch?.[1]) {
    return apiKeyMatch[1].trim();
  }

  return null;
}

export async function authenticateApiRequest(
  request: Request
): Promise<ApiAuthResult> {
  const rawKey = extractApiKeyFromRequest(request);
  if (!rawKey || !verifyApiKeyFormat(rawKey)) {
    return {
      ok: false,
      status: 401,
      code: "invalid_api_key",
      error: "Invalid or missing API key.",
    };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return {
      ok: false,
      status: 503,
      code: "service_unavailable",
      error: "API is not configured.",
    };
  }

  const keyHash = hashApiKey(rawKey);
  const { data: keyRow, error } = await supabase
    .from("organization_api_keys")
    .select("id, organization_id, revoked_at")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (error || !keyRow || keyRow.revoked_at) {
    return {
      ok: false,
      status: 401,
      code: "invalid_api_key",
      error: "Invalid or missing API key.",
    };
  }

  const hasApiAccess = await organizationHasFeature(
    keyRow.organization_id,
    "api_access"
  );
  if (!hasApiAccess) {
    return {
      ok: false,
      status: 403,
      code: "api_access_required",
      error: "API access is not available on your current plan.",
    };
  }

  const { data: rateRow, error: rateError } = await supabase.rpc(
    "consume_api_key_rate_limit",
    {
      p_key_id: keyRow.id,
      p_limit: API_RATE_LIMIT_PER_MINUTE,
    }
  );
  const rate = Array.isArray(rateRow) ? rateRow[0] : rateRow;
  if (rateError) {
    console.error("[api] rate limit check failed:", rateError.message);
  } else if (rate && rate.allowed === false) {
    return {
      ok: false,
      status: 429,
      code: "rate_limited",
      error: `Rate limit exceeded. Max ${API_RATE_LIMIT_PER_MINUTE} requests per minute per key.`,
    };
  }

  void supabase
    .from("organization_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id);

  return {
    ok: true,
    organizationId: keyRow.organization_id,
    keyId: keyRow.id,
  };
}
