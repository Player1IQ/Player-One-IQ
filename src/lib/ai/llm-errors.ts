import type { AiLlmSource } from "./providers/types";

function errorToText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}

function extractProviderMessage(text: string): string {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return text;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      error?: { message?: string };
      message?: string;
    };
    return parsed.error?.message ?? parsed.message ?? text;
  } catch {
    return text;
  }
}

export function formatLlmUserMessage(
  error: unknown,
  options?: { source?: AiLlmSource; provider?: string }
): string {
  const text = extractProviderMessage(errorToText(error));
  const provider =
    options?.provider === "anthropic"
      ? "Anthropic"
      : options?.provider === "openai"
        ? "OpenAI"
        : "your AI provider";

  if (/insufficient_quota/i.test(text)) {
    if (options?.source === "org") {
      return `Your ${provider} account has no billing quota. Add a payment method in your provider dashboard (for OpenAI: platform.openai.com → Settings → Billing), or connect a key from an account with credits.`;
    }
    return "The platform OpenAI account has no billing quota. Connect your own API key in Settings → AI integration, or enable billing on the platform key.";
  }

  if (/\b401\b/.test(text) || /invalid_api_key|authentication/i.test(text)) {
    return `Invalid API key. Check that you copied the full key from ${provider} and try again.`;
  }

  if (/\b429\b/.test(text) && /rate_limit/i.test(text)) {
    return `${provider} rate limit reached. Wait a moment and try again.`;
  }

  if (/\b429\b/.test(text) || /rate_limit/i.test(text)) {
    return `${provider} usage limit reached. Check your provider quota or billing.`;
  }

  if (/\b503\b/.test(text)) {
    return `${provider} is temporarily unavailable. Try again shortly.`;
  }

  if (text.length > 280) {
    return `${text.slice(0, 280)}…`;
  }

  return text;
}

export function isRecoverableLlmError(error: unknown): boolean {
  const text = errorToText(error);
  return (
    /\b429\b/.test(text) ||
    /insufficient_quota/i.test(text) ||
    /rate_limit/i.test(text) ||
    /\b503\b/.test(text)
  );
}

export function getLlmFallbackNotice(
  error: unknown,
  source?: AiLlmSource
): string {
  if (/insufficient_quota/i.test(errorToText(error))) {
    if (source === "org") {
      return "Live AI is off — your connected API key has no billing quota at the provider. Showing sample insights until provider billing is enabled.";
    }
    return "Live AI is off — the platform OpenAI account has no billing quota. Showing sample insights until platform billing is enabled.";
  }

  return `${formatLlmUserMessage(error, { source })} Showing sample results.`;
}
