import { unstable_cache } from "next/cache";
import { isAiLlmConfigured } from "./config";
import { isRecoverableLlmError } from "./llm-errors";

export type OpenAiHealth =
  | "unconfigured"
  | "available"
  | "quota_exceeded"
  | "unavailable";

async function probeOpenAi(): Promise<OpenAiHealth> {
  if (!isAiLlmConfigured()) return "unconfigured";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
      cache: "no-store",
    });

    if (response.ok) return "available";

    const body = await response.text();
    if (/insufficient_quota/i.test(body)) return "quota_exceeded";
    if (isRecoverableLlmError(body)) return "unavailable";
    return "unavailable";
  } catch {
    return "unavailable";
  }
}

const getCachedOpenAiHealth = unstable_cache(
  probeOpenAi,
  ["openai-health-probe"],
  { revalidate: 300 }
);

export async function getOpenAiHealth(): Promise<OpenAiHealth> {
  if (!isAiLlmConfigured()) return "unconfigured";
  return getCachedOpenAiHealth();
}
