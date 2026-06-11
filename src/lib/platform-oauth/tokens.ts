export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  scope?: string;
  provider_user_id?: string;
  provider_login?: string;
}

export function getTokenExpiry(expiresIn?: number): number | undefined {
  if (!expiresIn) return undefined;
  return Date.now() + expiresIn * 1000;
}

export function isTokenExpired(expiresAt?: number): boolean {
  if (!expiresAt) return false;
  return Date.now() >= expiresAt - 60_000;
}

export async function refreshYouTubeAccessToken(
  refreshToken: string
): Promise<OAuthTokens> {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("YouTube OAuth is not configured.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const body = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !body.access_token) {
    throw new Error(body.error_description ?? body.error ?? "Token refresh failed.");
  }

  return {
    access_token: body.access_token,
    refresh_token: refreshToken,
    expires_at: getTokenExpiry(body.expires_in),
  };
}

export async function refreshTwitchAccessToken(
  refreshToken: string
): Promise<OAuthTokens> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Twitch OAuth is not configured.");
  }

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const body = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    message?: string;
  };

  if (!response.ok || !body.access_token) {
    throw new Error(body.message ?? body.error ?? "Token refresh failed.");
  }

  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token ?? refreshToken,
    expires_at: getTokenExpiry(body.expires_in),
  };
}
