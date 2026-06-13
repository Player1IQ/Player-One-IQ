function errorToText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
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

export function getLlmFallbackNotice(error: unknown): string {
  const text = errorToText(error);

  if (/insufficient_quota/i.test(text)) {
    return "Live AI is off — the platform OpenAI account has no billing quota. This is not your plan request limit. Showing sample insights until platform billing is enabled.";
  }
  if (/\b429\b/.test(text) && /rate_limit/i.test(text)) {
    return "OpenAI rate limit reached. Showing sample results — try again in a moment.";
  }
  if (/\b429\b/.test(text)) {
    return "OpenAI usage limit reached. Showing sample results — check your OpenAI quota or billing.";
  }
  if (/rate_limit/i.test(text)) {
    return "OpenAI rate limit reached. Showing sample results — try again shortly.";
  }
  if (/\b503\b/.test(text)) {
    return "OpenAI is temporarily unavailable. Showing sample results.";
  }

  return "Live AI is temporarily unavailable. Showing sample results.";
}
