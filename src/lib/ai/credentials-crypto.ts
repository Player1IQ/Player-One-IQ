import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.AI_CREDENTIALS_ENCRYPTION_KEY?.trim();
  if (!secret) {
    throw new Error("AI_CREDENTIALS_ENCRYPTION_KEY is not configured.");
  }

  const base64Key = Buffer.from(secret, "base64");
  if (base64Key.length === 32) {
    return base64Key;
  }

  return scryptSync(secret, "player-one-iq-ai-credentials", 32);
}

export function isAiCredentialsEncryptionConfigured(): boolean {
  return Boolean(process.env.AI_CREDENTIALS_ENCRYPTION_KEY?.trim());
}

export function encryptApiKey(plainText: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptApiKey(cipherText: string): string {
  const payload = Buffer.from(cipherText, "base64");
  const iv = payload.subarray(0, IV_LENGTH);
  const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8"
  );
}
