import { randomBytes } from "crypto";

export function createMediaKitToken(): string {
  return randomBytes(18).toString("base64url");
}

export function isMediaKitToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{20,32}$/.test(value);
}
