import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { OAuthPlatform } from "./types";

const STATE_TTL_MS = 15 * 60 * 1000;

export interface OAuthStatePayload {
  creatorId: string;
  organizationId: string;
  platform: OAuthPlatform;
  nonce: string;
  issuedAt: number;
  /** TikTok Login Kit requires PKCE; verifier is round-tripped in signed state. */
  pkceVerifier?: string;
}

function getStateSecret(): string {
  return (
    process.env.PLATFORM_OAUTH_STATE_SECRET ??
    process.env.YOUTUBE_CLIENT_SECRET ??
    "dev-platform-oauth-state-secret"
  );
}

export function createOAuthState(
  payload: Pick<
    OAuthStatePayload,
    "creatorId" | "organizationId" | "platform" | "pkceVerifier"
  >
): string {
  const data: OAuthStatePayload = {
    ...payload,
    nonce: randomBytes(16).toString("hex"),
    issuedAt: Date.now(),
  };
  const encoded = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = createHmac("sha256", getStateSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyOAuthState(state: string): OAuthStatePayload | null {
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) return null;

  const expected = createHmac("sha256", getStateSecret())
    .update(encoded)
    .digest("base64url");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as OAuthStatePayload;

    if (!payload.creatorId || !payload.organizationId || !payload.platform) {
      return null;
    }

    if (
      typeof payload.issuedAt !== "number" ||
      Date.now() - payload.issuedAt > STATE_TTL_MS
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
