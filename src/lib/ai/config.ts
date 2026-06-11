export function isAiFeatureEnabled(): boolean {
  return process.env.AI_ENABLED !== "false";
}

export function isAiLlmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function isAiLlmLive(): boolean {
  return isAiFeatureEnabled() && isAiLlmConfigured();
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}
