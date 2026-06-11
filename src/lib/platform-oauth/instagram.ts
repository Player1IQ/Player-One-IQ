import { getOAuthRedirectUri } from "./redirect-uri";
import type { OAuthTokens } from "./tokens";
import { getTokenExpiry } from "./tokens";

export interface InstagramProfile {
  handle: string;
  displayName: string;
  instagramUserId: string;
}

const GRAPH_VERSION = "v21.0";

function getInstagramCredentials() {
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Instagram OAuth is not configured.");
  }
  return { clientId, clientSecret };
}

export async function getInstagramAuthorizeUrl(state: string): Promise<string> {
  const { clientId } = getInstagramCredentials();
  const redirectUri = await getOAuthRedirectUri("Instagram");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "instagram_business_basic,instagram_business_manage_insights",
    response_type: "code",
    state,
  });

  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeInstagramCode(code: string): Promise<OAuthTokens> {
  const { clientId, clientSecret } = getInstagramCredentials();
  const redirectUri = await getOAuthRedirectUri("Instagram");

  const shortLivedResponse = await fetch(
    "https://api.instagram.com/oauth/access_token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    }
  );

  const shortLivedBody = (await shortLivedResponse.json()) as {
    access_token?: string;
    user_id?: string | number;
    error_type?: string;
    error_message?: string;
  };

  if (!shortLivedResponse.ok || !shortLivedBody.access_token) {
    throw new Error(
      shortLivedBody.error_message ??
        shortLivedBody.error_type ??
        "Instagram authorization failed."
    );
  }

  const longLivedUrl = new URL("https://graph.instagram.com/access_token");
  longLivedUrl.searchParams.set("grant_type", "ig_exchange_token");
  longLivedUrl.searchParams.set("client_secret", clientSecret);
  longLivedUrl.searchParams.set("access_token", shortLivedBody.access_token);

  const longLivedResponse = await fetch(longLivedUrl.toString());
  const longLivedBody = (await longLivedResponse.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };

  if (!longLivedResponse.ok || !longLivedBody.access_token) {
    throw new Error(
      longLivedBody.error?.message ?? "Could not exchange Instagram token."
    );
  }

  return {
    access_token: longLivedBody.access_token,
    expires_at: getTokenExpiry(longLivedBody.expires_in),
    provider_user_id: String(shortLivedBody.user_id ?? ""),
  };
}

export async function refreshInstagramAccessToken(
  accessToken: string
): Promise<OAuthTokens> {
  const url = new URL("https://graph.instagram.com/refresh_access_token");
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString());
  const body = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };

  if (!response.ok || !body.access_token) {
    throw new Error(body.error?.message ?? "Instagram token refresh failed.");
  }

  return {
    access_token: body.access_token,
    expires_at: getTokenExpiry(body.expires_in),
  };
}

export async function syncInstagramProfile(
  accessToken: string
): Promise<InstagramProfile> {
  const response = await fetch(
    `https://graph.instagram.com/${GRAPH_VERSION}/me?fields=id,username,name,account_type`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const body = (await response.json()) as {
    id?: string;
    username?: string;
    name?: string;
    error?: { message?: string };
  };

  if (!response.ok || !body.id || !body.username) {
    throw new Error(
      body.error?.message ??
        "Could not read Instagram profile. Account must be a Business or Creator profile."
    );
  }

  return {
    handle: body.username,
    displayName: body.name ?? body.username,
    instagramUserId: body.id,
  };
}

export async function syncInstagramRevenue(accessToken: string) {
  const profile = await syncInstagramProfile(accessToken);
  return {
    handle: profile.handle,
    displayName: profile.displayName,
    advertisement: 0,
    other: 0,
  };
}
