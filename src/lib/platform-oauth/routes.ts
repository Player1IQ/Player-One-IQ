import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import { requireCreatorPlatformConnectAccess } from "@/lib/permissions";
import {
  isPlatformOAuthAvailable,
  isPlatformOAuthFeatureEnabled,
  isPlatformOAuthLaunched,
  type OAuthPlatform,
} from "./config";
import { createOAuthState, verifyOAuthState } from "./state";
import {
  exchangeInstagramCode,
  getInstagramAuthorizeUrl,
} from "./instagram";
import { exchangeTikTokCode, createTikTokPkcePair, getTikTokAuthorizeUrl } from "./tiktok";
import { exchangeTwitchCode, getTwitchAuthorizeUrl } from "./twitch";
import { exchangeYouTubeCode, getYouTubeAuthorizeUrl } from "./youtube";
import { syncCreatorPlatformAccountById } from "./sync-account";
import { getAppOrigin } from "@/lib/email/app-url";

function appendQueryParam(base: string, key: string, value: string): string {
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}${key}=${encodeURIComponent(value)}`;
}

function sanitizeOAuthReturnTo(returnTo: string | null | undefined): string | null {
  if (!returnTo) return null;
  if (!returnTo.startsWith("/")) return null;
  if (returnTo.startsWith("//")) return null;
  if (!returnTo.startsWith("/onboarding") && !returnTo.startsWith("/portal") && !returnTo.startsWith("/creators")) {
    return null;
  }
  return returnTo;
}

async function getAuthorizeUrl(
  platform: OAuthPlatform,
  state: string,
  tiktokCodeChallenge?: string
) {
  switch (platform) {
    case "YouTube":
      return getYouTubeAuthorizeUrl(state);
    case "Twitch":
      return getTwitchAuthorizeUrl(state);
    case "Instagram":
      return getInstagramAuthorizeUrl(state);
    case "TikTok":
      if (!tiktokCodeChallenge) {
        throw new Error("TikTok OAuth requires PKCE.");
      }
      return getTikTokAuthorizeUrl(state, tiktokCodeChallenge);
  }
}

async function exchangeCode(
  platform: OAuthPlatform,
  code: string,
  pkceVerifier?: string
) {
  switch (platform) {
    case "YouTube":
      return exchangeYouTubeCode(code);
    case "Twitch":
      return exchangeTwitchCode(code);
    case "Instagram":
      return exchangeInstagramCode(code);
    case "TikTok":
      if (!pkceVerifier) {
        throw new Error("TikTok OAuth session expired. Please try again.");
      }
      return exchangeTikTokCode(code, pkceVerifier);
  }
}

export async function handlePlatformOAuthStart(
  platform: OAuthPlatform,
  request: Request
) {
  if (!isPlatformOAuthFeatureEnabled()) {
    return NextResponse.json(
      { error: "Platform OAuth is not enabled yet." },
      { status: 503 }
    );
  }

  if (!isPlatformOAuthAvailable(platform)) {
    const message = isPlatformOAuthLaunched(platform)
      ? `${platform} OAuth is not configured.`
      : `${platform} is not available at launch yet.`;
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get("creatorId");
  const returnTo = sanitizeOAuthReturnTo(searchParams.get("returnTo"));
  if (!creatorId) {
    return NextResponse.json({ error: "creatorId is required." }, { status: 400 });
  }

  const permError = await requireCreatorPlatformConnectAccess(creatorId);
  if (permError) {
    return NextResponse.json(permError, { status: 403 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 }
    );
  }

  const organizationId = await getOrganizationId();
  if (!organizationId) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("id", creatorId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!creator) {
    return NextResponse.json({ error: "Creator not found." }, { status: 404 });
  }

  const tiktokPkce =
    platform === "TikTok" ? createTikTokPkcePair() : null;
  const state = createOAuthState({
    creatorId,
    organizationId,
    platform,
    pkceVerifier: tiktokPkce?.codeVerifier,
    returnTo: returnTo ?? undefined,
  });

  await supabase.from("creator_platform_accounts").upsert(
    {
      organization_id: organizationId,
      creator_id: creatorId,
      platform,
      account_handle: "authorizing",
      display_name: "Authorizing...",
      connection_method: "oauth",
      connection_status: "pending_oauth",
      sync_error: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "creator_id,platform" }
  );

  const authorizeUrl = await getAuthorizeUrl(
    platform,
    state,
    tiktokPkce?.codeChallenge
  );
  return NextResponse.redirect(authorizeUrl);
}

export async function handlePlatformOAuthCallback(
  platform: OAuthPlatform,
  request: Request
) {
  const origin = await getAppOrigin();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const payload = state ? verifyOAuthState(state) : null;
  const creatorId = payload?.creatorId;
  const redirectBase = payload?.returnTo
    ? `${origin}${payload.returnTo}`
    : creatorId
      ? `${origin}/creators/${creatorId}`
      : `${origin}/creators`;

  if (oauthError) {
    return NextResponse.redirect(
      appendQueryParam(redirectBase, "oauth_error", oauthError)
    );
  }

  if (!code || !payload || payload.platform !== platform) {
    return NextResponse.redirect(
      appendQueryParam(redirectBase, "oauth_error", "invalid_state")
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(
      appendQueryParam(redirectBase, "oauth_error", "supabase_not_configured")
    );
  }

  try {
    const tokens = await exchangeCode(platform, code, payload.pkceVerifier);

    const { data: account, error: accountError } = await supabase
      .from("creator_platform_accounts")
      .upsert(
        {
          organization_id: payload.organizationId,
          creator_id: payload.creatorId,
          platform,
          account_handle: "connected",
          display_name: "Connected",
          connection_method: "oauth",
          connection_status: "connected_oauth",
          oauth_metadata: tokens,
          sync_error: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "creator_id,platform" }
      )
      .select("id")
      .single();

    if (accountError || !account) {
      throw new Error(accountError?.message ?? "Failed to save platform connection.");
    }

    const syncResult = await syncCreatorPlatformAccountById(
      account.id,
      payload.organizationId
    );

    if ("error" in syncResult) {
      return NextResponse.redirect(
        appendQueryParam(redirectBase, "oauth_error", syncResult.error)
      );
    }

    return NextResponse.redirect(
      appendQueryParam(redirectBase, "oauth_success", platform)
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Platform authorization failed.";

    await supabase
      .from("creator_platform_accounts")
      .update({
        connection_status: "sync_error",
        sync_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq("creator_id", payload.creatorId)
      .eq("organization_id", payload.organizationId)
      .eq("platform", platform);

    return NextResponse.redirect(
      appendQueryParam(redirectBase, "oauth_error", message)
    );
  }
}
