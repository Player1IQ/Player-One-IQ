import { createHash, randomBytes } from "crypto";
import { getOAuthRedirectUri } from "./redirect-uri";
import type { OAuthTokens } from "./tokens";
import { getTokenExpiry } from "./tokens";

export interface TikTokProfile {
  handle: string;
  displayName: string;
  openId: string;
}

function getTikTokCredentials() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) {
    throw new Error("TikTok OAuth is not configured.");
  }
  return { clientKey, clientSecret };
}

export function createTikTokPkcePair() {
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
}

export async function getTikTokAuthorizeUrl(
  state: string,
  codeChallenge: string
): Promise<string> {
  const { clientKey } = getTikTokCredentials();
  const redirectUri = await getOAuthRedirectUri("TikTok");
  const params = new URLSearchParams({
    client_key: clientKey,
    redirect_uri: redirectUri,
    scope: "user.info.basic,video.list",
    response_type: "code",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

export async function exchangeTikTokCode(
  code: string,
  codeVerifier: string
): Promise<OAuthTokens> {
  const { clientKey, clientSecret } = getTikTokCredentials();
  const redirectUri = await getOAuthRedirectUri("TikTok");

  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  const body = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    open_id?: string;
    error?: string;
    error_description?: string;
    data?: {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      open_id?: string;
    };
  };

  const tokenData = body.data ?? body;
  if (!response.ok || !tokenData.access_token) {
    throw new Error(
      body.error_description ?? body.error ?? "TikTok authorization failed."
    );
  }

  return {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: getTokenExpiry(tokenData.expires_in),
    provider_user_id: tokenData.open_id,
  };
}

export async function refreshTikTokAccessToken(
  refreshToken: string
): Promise<OAuthTokens> {
  const { clientKey, clientSecret } = getTikTokCredentials();

  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const body = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
    data?: {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      open_id?: string;
    };
  };

  const tokenData = body.data ?? body;
  if (!response.ok || !tokenData.access_token) {
    throw new Error(
      body.error_description ?? body.error ?? "TikTok token refresh failed."
    );
  }

  return {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token ?? refreshToken,
    expires_at: getTokenExpiry(tokenData.expires_in),
    provider_user_id:
      "open_id" in tokenData ? tokenData.open_id : undefined,
  };
}

export async function syncTikTokProfile(
  accessToken: string
): Promise<TikTokProfile> {
  const response = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const body = (await response.json()) as {
    data?: {
      user?: {
        open_id?: string;
        display_name?: string;
        username?: string;
      };
    };
    error?: { message?: string };
  };

  const user = body.data?.user;
  if (!response.ok || !user?.open_id) {
    throw new Error(body.error?.message ?? "Could not read TikTok profile.");
  }

  return {
    handle: user.username ?? user.open_id,
    displayName: user.display_name ?? user.username ?? "TikTok Creator",
    openId: user.open_id,
  };
}

export async function syncTikTokRevenue(accessToken: string) {
  const profile = await syncTikTokProfile(accessToken);
  return {
    handle: profile.handle,
    displayName: profile.displayName,
    advertisement: 0,
    donations: 0,
  };
}
