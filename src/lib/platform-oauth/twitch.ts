import { getOAuthRedirectUri } from "./redirect-uri";
import type { OAuthTokens } from "./tokens";
import { getTokenExpiry } from "./tokens";

export interface TwitchSyncResult {
  handle: string;
  displayName: string;
  subscription: number;
  donations: number;
}

const TWITCH_CREATOR_SHARE: Record<string, number> = {
  "1000": 2.5,
  "2000": 5.0,
  "3000": 12.5,
  Prime: 2.5,
};

export async function getTwitchAuthorizeUrl(state: string): Promise<string> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) throw new Error("Twitch OAuth is not configured.");

  const redirectUri = await getOAuthRedirectUri("Twitch");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "user:read:email",
      "channel:read:subscriptions",
      "bits:read",
    ].join(" "),
    state,
    force_verify: "true",
  });

  return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
}

export async function exchangeTwitchCode(code: string): Promise<OAuthTokens> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Twitch OAuth is not configured.");
  }

  const redirectUri = await getOAuthRedirectUri("Twitch");
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const body = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string[];
    error?: string;
    message?: string;
  };

  if (!response.ok || !body.access_token) {
    throw new Error(body.message ?? body.error ?? "Twitch authorization failed.");
  }

  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    expires_at: getTokenExpiry(body.expires_in),
    scope: body.scope?.join(" "),
  };
}

function twitchHeaders(accessToken: string) {
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) throw new Error("Twitch OAuth is not configured.");
  return {
    "Client-Id": clientId,
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function syncTwitchRevenue(
  accessToken: string
): Promise<TwitchSyncResult> {
  const userResponse = await fetch("https://api.twitch.tv/helix/users", {
    headers: twitchHeaders(accessToken),
  });

  const userBody = (await userResponse.json()) as {
    data?: Array<{ id: string; login: string; display_name: string }>;
    message?: string;
  };

  if (!userResponse.ok || !userBody.data?.[0]) {
    throw new Error(userBody.message ?? "Could not read the authorized Twitch account.");
  }

  const user = userBody.data[0];
  let subscription = 0;
  let cursor: string | undefined;

  do {
    const url = new URL("https://api.twitch.tv/helix/subscriptions");
    url.searchParams.set("broadcaster_id", user.id);
    url.searchParams.set("first", "100");
    if (cursor) url.searchParams.set("after", cursor);

    const subsResponse = await fetch(url.toString(), {
      headers: twitchHeaders(accessToken),
    });

    const subsBody = (await subsResponse.json()) as {
      data?: Array<{ tier: string }>;
      pagination?: { cursor?: string };
      message?: string;
    };

    if (!subsResponse.ok) {
      throw new Error(
        subsBody.message ??
          "Could not read Twitch subscriptions. The creator must authorize with their broadcaster account."
      );
    }

    for (const sub of subsBody.data ?? []) {
      subscription += TWITCH_CREATOR_SHARE[sub.tier] ?? 2.5;
    }

    cursor = subsBody.pagination?.cursor;
  } while (cursor);

  // Twitch does not expose monthly ad or bits revenue through a single public API.
  const donations = 0;

  return {
    handle: user.login,
    displayName: user.display_name,
    subscription,
    donations,
  };
}
