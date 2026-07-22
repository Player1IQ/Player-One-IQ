import type { OAuthPlatform } from "./types";

export interface PlatformOAuthErrorView {
  title: string;
  message: string;
  adminHint?: string;
}

function normalizeOAuthErrorCode(error: string): string {
  const value = decodeURIComponent(error).trim();
  const lower = value.toLowerCase();

  if (lower === "access_denied" || lower === "google_access_denied") {
    return "google_access_denied";
  }
  if (lower.includes("client_key") || lower === "tiktok_invalid_client_key") {
    return "tiktok_invalid_client_key";
  }
  if (lower === "tiktok_not_configured") {
    return "tiktok_not_configured";
  }
  if (lower === "youtube_not_configured") {
    return "youtube_not_configured";
  }
  if (lower === "invalid_state") {
    return "invalid_state";
  }
  if (lower === "supabase_not_configured") {
    return "supabase_not_configured";
  }

  return value.length > 120 ? `${value.slice(0, 117)}...` : value;
}

export function formatPlatformOAuthError(
  error: string,
  platform?: OAuthPlatform | string | null
): PlatformOAuthErrorView {
  const code = normalizeOAuthErrorCode(error);
  const platformLabel = platform ?? "Platform";

  switch (code) {
    case "google_access_denied":
      return {
        title: `${platformLabel} connection blocked by Google`,
        message:
          "Google has not approved this account for Player One IQ yet. During beta, only invited tester Google accounts can connect YouTube.",
        adminHint:
          "In Google Cloud Console → OAuth consent screen → Test users, add the tester’s Gmail address. Use the same OAuth client as YOUTUBE_CLIENT_ID.",
      };
    case "tiktok_invalid_client_key":
      return {
        title: "TikTok connection is misconfigured",
        message:
          "TikTok rejected our app credentials before login could start. This is usually a wrong client key or redirect URL in the TikTok developer portal.",
        adminHint:
          "In TikTok for Developers → your app → Login Kit, confirm TIKTOK_CLIENT_KEY on Vercel and register redirect URI exactly: https://player-one-iq.vercel.app/api/platform-oauth/tiktok/callback",
      };
    case "tiktok_not_configured":
      return {
        title: "TikTok connection unavailable",
        message:
          "TikTok OAuth is not configured on this environment yet. Try another platform or add your handle manually.",
        adminHint:
          "Set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET in Vercel, then add the callback URL in TikTok Login Kit.",
      };
    case "youtube_not_configured":
      return {
        title: "YouTube connection unavailable",
        message:
          "YouTube OAuth is not configured on this environment yet. Try another platform or add your handle manually.",
      };
    case "invalid_state":
      return {
        title: "Connection session expired",
        message:
          "Your platform login session timed out (common on mobile if you switch apps). Please tap Connect again.",
      };
    case "supabase_not_configured":
      return {
        title: "App configuration error",
        message: "The server could not save your platform connection. Please contact support.",
      };
    default:
      return {
        title: `${platformLabel} connection failed`,
        message: code,
      };
  }
}

export function toOAuthErrorQueryValue(error: unknown): string {
  if (error instanceof Error) {
    return normalizeOAuthErrorCode(error.message);
  }
  return normalizeOAuthErrorCode(String(error));
}
