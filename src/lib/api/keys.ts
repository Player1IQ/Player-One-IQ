import { createHash, randomBytes, timingSafeEqual } from "crypto";

export const API_KEY_PREFIX = "poiq_";
const DISPLAY_PREFIX_LENGTH = 12;

function getApiKeyPepper(): string {
  return process.env.API_KEY_PEPPER?.trim() ?? "";
}

export function hashApiKey(key: string): string {
  return createHash("sha256")
    .update(`${getApiKeyPepper()}${key}`)
    .digest("hex");
}

export function verifyApiKeyFormat(key: string): boolean {
  return key.startsWith(API_KEY_PREFIX) && key.length >= API_KEY_PREFIX.length + 16;
}

export function verifyApiKeyHash(key: string, expectedHash: string): boolean {
  const actual = hashApiKey(key);
  const actualBuffer = Buffer.from(actual, "utf8");
  const expectedBuffer = Buffer.from(expectedHash, "utf8");
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function generateApiKey(): {
  fullKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  const secret = randomBytes(32).toString("base64url");
  const fullKey = `${API_KEY_PREFIX}${secret}`;
  return {
    fullKey,
    keyPrefix: fullKey.slice(0, DISPLAY_PREFIX_LENGTH),
    keyHash: hashApiKey(fullKey),
  };
}
