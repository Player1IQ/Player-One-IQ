import { getKickClientCredentials } from "./credentials";
import { getOAuthRedirectUri } from "./redirect-uri";
import type { OAuthTokens } from "./tokens";
import { getTokenExpiry } from "./tokens";

export const KICK_OAUTH_SCOPES = "user:read channel:read";

function getKickCredentials() {
  const creds = getKickClientCredentials();
  if (!creds) {
    throw new Error("kick_not_configured");
  }
  return creds;
}

function kickHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };
}

export async function getKickAuthorizeUrl(
  state: string,
  codeChallenge: string
): Promise<string> {
  const { clientId } = getKickCredentials();
  const redirectUri = await getOAuthRedirectUri("Kick");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: KICK_OAUTH_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `https://id.kick.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeKickCode(
  code: string,
  codeVerifier: string
): Promise<OAuthTokens> {
  const { clientId, clientSecret } = getKickCredentials();
  const redirectUri = await getOAuthRedirectUri("Kick");

  const response = await fetch("https://id.kick.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      code,
    }),
  });

  const body = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    error?: string;
    error_description?: string;
    message?: string;
  };

  if (!response.ok || !body.access_token) {
    throw new Error(
      body.error_description ?? body.message ?? body.error ?? "Kick authorization failed."
    );
  }

  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    expires_at: getTokenExpiry(body.expires_in),
    scope: body.scope,
  };
}

export async function refreshKickAccessToken(
  refreshToken: string
): Promise<OAuthTokens> {
  const { clientId, clientSecret } = getKickCredentials();

  const response = await fetch("https://id.kick.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  const body = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    error?: string;
    error_description?: string;
    message?: string;
  };

  if (!response.ok || !body.access_token) {
    throw new Error(
      body.error_description ?? body.message ?? body.error ?? "Kick token refresh failed."
    );
  }

  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token ?? refreshToken,
    expires_at: getTokenExpiry(body.expires_in),
    scope: body.scope,
  };
}

export interface KickSyncResult {
  handle: string;
  displayName: string;
  userId: number | null;
  subscriberCount: number | null;
}

interface KickUser {
  user_id?: number;
  name?: string;
  email?: string;
}

interface KickChannel {
  slug?: string;
  stream_title?: string;
  active_subscribers_count?: number;
  broadcaster_user_id?: number;
}

export async function fetchKickUser(accessToken: string): Promise<KickUser> {
  const response = await fetch("https://api.kick.com/public/v1/users", {
    headers: kickHeaders(accessToken),
  });
  const body = (await response.json()) as {
    data?: KickUser[];
    message?: string;
  };
  if (!response.ok || !body.data?.[0]) {
    throw new Error(body.message ?? "Could not read the authorized Kick account.");
  }
  return body.data[0];
}

export async function fetchKickChannel(accessToken: string): Promise<KickChannel> {
  const response = await fetch("https://api.kick.com/public/v1/channels", {
    headers: kickHeaders(accessToken),
  });
  const body = (await response.json()) as {
    data?: KickChannel[];
    message?: string;
  };
  if (!response.ok || !body.data?.[0]) {
    throw new Error(body.message ?? "Could not read the Kick channel.");
  }
  return body.data[0];
}

export async function syncKickProfile(accessToken: string): Promise<KickSyncResult> {
  const [user, channel] = await Promise.all([
    fetchKickUser(accessToken),
    fetchKickChannel(accessToken),
  ]);

  return {
    handle: channel.slug ?? String(user.user_id ?? "kick"),
    displayName: user.name ?? channel.slug ?? "Kick",
    userId: user.user_id ?? channel.broadcaster_user_id ?? null,
    subscriberCount:
      typeof channel.active_subscribers_count === "number"
        ? channel.active_subscribers_count
        : null,
  };
}

export async function fetchKickAudienceSize(
  accessToken: string
): Promise<number | null> {
  try {
    const channel = await fetchKickChannel(accessToken);
    return typeof channel.active_subscribers_count === "number"
      ? channel.active_subscribers_count
      : null;
  } catch {
    return null;
  }
}

export { kickHeaders };
