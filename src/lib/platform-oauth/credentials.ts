import type { OAuthPlatform } from "./types";

const PLACEHOLDER_PATTERN =
  /^(your[-_]|xxx|changeme|placeholder|todo|replace|example)/i;

function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function getYouTubeClientCredentials():
  | { clientId: string; clientSecret: string }
  | null {
  const clientId = trimEnv(process.env.YOUTUBE_CLIENT_ID);
  const clientSecret = trimEnv(process.env.YOUTUBE_CLIENT_SECRET);
  if (!clientId || !clientSecret) return null;
  if (PLACEHOLDER_PATTERN.test(clientId) || PLACEHOLDER_PATTERN.test(clientSecret)) {
    return null;
  }
  return { clientId, clientSecret };
}

export function getTwitchClientCredentials():
  | { clientId: string; clientSecret: string }
  | null {
  const clientId = trimEnv(process.env.TWITCH_CLIENT_ID);
  const clientSecret = trimEnv(process.env.TWITCH_CLIENT_SECRET);
  if (!clientId || !clientSecret) return null;
  if (PLACEHOLDER_PATTERN.test(clientId) || PLACEHOLDER_PATTERN.test(clientSecret)) {
    return null;
  }
  return { clientId, clientSecret };
}

export function getInstagramClientCredentials():
  | { clientId: string; clientSecret: string }
  | null {
  const clientId = trimEnv(process.env.INSTAGRAM_CLIENT_ID);
  const clientSecret = trimEnv(process.env.INSTAGRAM_CLIENT_SECRET);
  if (!clientId || !clientSecret) return null;
  if (PLACEHOLDER_PATTERN.test(clientId) || PLACEHOLDER_PATTERN.test(clientSecret)) {
    return null;
  }
  return { clientId, clientSecret };
}

export function getTikTokClientCredentials():
  | { clientKey: string; clientSecret: string }
  | null {
  const clientKey = trimEnv(process.env.TIKTOK_CLIENT_KEY);
  const clientSecret = trimEnv(process.env.TIKTOK_CLIENT_SECRET);
  if (!clientKey || !clientSecret) return null;
  if (PLACEHOLDER_PATTERN.test(clientKey) || PLACEHOLDER_PATTERN.test(clientSecret)) {
    return null;
  }
  return { clientKey, clientSecret };
}

export function isTikTokClientKeyWellFormed(clientKey: string): boolean {
  return /^[a-zA-Z0-9]{8,64}$/.test(clientKey);
}

export function assertPlatformCredentials(platform: OAuthPlatform): void {
  switch (platform) {
    case "YouTube": {
      if (!getYouTubeClientCredentials()) {
        throw new Error("youtube_not_configured");
      }
      return;
    }
    case "Twitch": {
      if (!getTwitchClientCredentials()) {
        throw new Error("twitch_not_configured");
      }
      return;
    }
    case "Instagram": {
      if (!getInstagramClientCredentials()) {
        throw new Error("instagram_not_configured");
      }
      return;
    }
    case "TikTok": {
      const creds = getTikTokClientCredentials();
      if (!creds) {
        throw new Error("tiktok_not_configured");
      }
      if (!isTikTokClientKeyWellFormed(creds.clientKey)) {
        throw new Error("tiktok_invalid_client_key");
      }
      return;
    }
  }
}
