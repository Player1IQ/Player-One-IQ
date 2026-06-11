import { getOAuthRedirectUri } from "./redirect-uri";
import type { OAuthTokens } from "./tokens";
import { getTokenExpiry } from "./tokens";

export interface YouTubeSyncResult {
  handle: string;
  displayName: string;
  advertisement: number;
  other: number;
  /** Set when the channel connects but revenue metrics are unavailable. */
  revenueWarning?: string;
}

export async function getYouTubeAuthorizeUrl(state: string): Promise<string> {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  if (!clientId) throw new Error("YouTube OAuth is not configured.");

  const redirectUri = await getOAuthRedirectUri("YouTube");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/yt-analytics.readonly",
      "https://www.googleapis.com/auth/yt-analytics-monetary.readonly",
      "https://www.googleapis.com/auth/youtube.readonly",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeYouTubeCode(code: string): Promise<OAuthTokens> {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("YouTube OAuth is not configured.");
  }

  const redirectUri = await getOAuthRedirectUri("YouTube");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const body = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !body.access_token) {
    throw new Error(
      body.error_description ?? body.error ?? "YouTube authorization failed."
    );
  }

  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    expires_at: getTokenExpiry(body.expires_in),
    scope: body.scope,
  };
}

function currentMonthDateRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return { startDate: fmt(start), endDate: fmt(end) };
}

export async function syncYouTubeRevenue(
  accessToken: string
): Promise<YouTubeSyncResult> {
  const channelResponse = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const channelBody = (await channelResponse.json()) as {
    items?: Array<{
      id: string;
      snippet?: { title?: string; customUrl?: string };
    }>;
    error?: { message?: string };
  };

  if (!channelResponse.ok || !channelBody.items?.[0]) {
    throw new Error(
      channelBody.error?.message ??
        "Could not read the authorized YouTube channel."
    );
  }

  const channel = channelBody.items[0];
  const handle =
    channel.snippet?.customUrl ??
    channel.snippet?.title ??
    "YouTube channel";
  const displayName = channel.snippet?.title ?? handle;

  const { startDate, endDate } = currentMonthDateRange();
  const reportParams = new URLSearchParams({
    ids: `channel==${channel.id}`,
    startDate,
    endDate,
    metrics: "estimatedRevenue,estimatedAdRevenue",
  });

  const reportResponse = await fetch(
    `https://youtubeanalytics.googleapis.com/v2/reports?${reportParams.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const reportBody = (await reportResponse.json()) as {
    rows?: number[][];
    columnHeaders?: Array<{ name?: string }>;
    error?: { message?: string };
  };

  let advertisement = 0;
  let totalRevenue = 0;
  let revenueWarning: string | undefined;

  if (!reportResponse.ok) {
    revenueWarning =
      reportBody.error?.message ??
      "Revenue sync unavailable. The channel may need monetization (YouTube Partner Program) or the monetary analytics scope.";
  } else if (reportBody.rows?.[0] && reportBody.columnHeaders) {
    const metrics = reportBody.columnHeaders.map((header) => header.name);
    const row = reportBody.rows[0];
    const revenueIndex = metrics.indexOf("estimatedRevenue");
    const adIndex = metrics.indexOf("estimatedAdRevenue");

    if (revenueIndex >= 0) totalRevenue = Number(row[revenueIndex]) || 0;
    if (adIndex >= 0) advertisement = Number(row[adIndex]) || 0;
  }

  const other = Math.max(0, totalRevenue - advertisement);

  return {
    handle: handle.startsWith("@") ? handle : `@${handle.replace(/^@/, "")}`,
    displayName,
    advertisement,
    other,
    revenueWarning,
  };
}
