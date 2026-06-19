import type { AiAssistantResult, AiForecast, AiMatchScore } from "./types";
import type { AiAssistantType } from "@/lib/subscription/types";
import type { ResolvedLlmConfig } from "./providers/types";
import { formatLlmUserMessage } from "./llm-errors";

export interface LlmRunResult {
  result: AiAssistantResult;
  tokensUsed: number;
  model: string;
}

export interface LlmAssistantParams {
  system: string;
  user: string;
  assistantType: AiAssistantType;
}

function asInsightArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const row = item as Record<string, unknown>;
      return {
        id: String(row.id ?? `insight-${index + 1}`),
        title: String(row.title ?? "Insight"),
        summary: String(row.summary ?? ""),
        confidence: Math.min(1, Math.max(0, Number(row.confidence ?? 0.7))),
        category: String(row.category ?? "general"),
      };
    })
    .filter((item) => item.summary.length > 0);
}

function asMatchArray(value: unknown): AiMatchScore[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const matches: AiMatchScore[] = [];

  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const entityType = row.entityType;
    if (
      entityType !== "creator" &&
      entityType !== "sponsor" &&
      entityType !== "opportunity"
    ) {
      continue;
    }
    matches.push({
      id: String(row.id ?? `match-${index + 1}`),
      name: String(row.name ?? "Unknown"),
      entityType,
      fitScore: Math.min(100, Math.max(0, Number(row.fitScore ?? 0))),
      reasons: Array.isArray(row.reasons)
        ? row.reasons.map(String).slice(0, 5)
        : [],
    });
  }

  return matches.length > 0 ? matches : undefined;
}

function asForecastArray(value: unknown): AiForecast[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const forecasts: AiForecast[] = [];

  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const trend = row.trend;
    if (trend !== "up" && trend !== "down" && trend !== "stable") continue;
    forecasts.push({
      id: String(row.id ?? `forecast-${index + 1}`),
      label: String(row.label ?? "Forecast"),
      period: String(row.period ?? "Next period"),
      projectedAmount: Math.max(0, Number(row.projectedAmount ?? 0)),
      currency: String(row.currency ?? "USD"),
      trend,
      confidence: Math.min(1, Math.max(0, Number(row.confidence ?? 0.7))),
    });
  }

  return forecasts.length > 0 ? forecasts : undefined;
}

function extractJsonPayload(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced?.[1]?.trim() ?? trimmed;
}

export function parseAssistantResult(
  assistantType: AiAssistantType,
  raw: string
): AiAssistantResult {
  const parsed = JSON.parse(extractJsonPayload(raw)) as Record<string, unknown>;
  const insights = asInsightArray(parsed.insights);

  if (insights.length === 0) {
    throw new Error("AI response did not include any insights.");
  }

  return {
    assistantType,
    generatedAt: new Date().toISOString(),
    insights,
    matches: asMatchArray(parsed.matches),
    forecasts: asForecastArray(parsed.forecasts),
  };
}

async function runOpenAiAssistantWithConfig(
  config: ResolvedLlmConfig,
  params: LlmAssistantParams
): Promise<LlmRunResult> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  return {
    result: parseAssistantResult(params.assistantType, content),
    tokensUsed: data.usage?.total_tokens ?? 0,
    model: config.model,
  };
}

async function runAnthropicAssistantWithConfig(
  config: ResolvedLlmConfig,
  params: LlmAssistantParams
): Promise<LlmRunResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      temperature: 0.4,
      system: params.system,
      messages: [{ role: "user", content: params.user }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
    model?: string;
  };

  const content = data.content
    ?.filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("\n")
    .trim();

  if (!content) {
    throw new Error("Anthropic returned an empty response.");
  }

  const inputTokens = data.usage?.input_tokens ?? 0;
  const outputTokens = data.usage?.output_tokens ?? 0;

  return {
    result: parseAssistantResult(params.assistantType, content),
    tokensUsed: inputTokens + outputTokens,
    model: data.model ?? config.model,
  };
}

export async function runLlmAssistant(
  params: LlmAssistantParams,
  config: ResolvedLlmConfig
): Promise<LlmRunResult> {
  if (config.provider === "anthropic") {
    return runAnthropicAssistantWithConfig(config, params);
  }
  return runOpenAiAssistantWithConfig(config, params);
}

export async function probeLlmConfig(
  config: ResolvedLlmConfig
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (config.provider === "anthropic") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 8,
          messages: [{ role: "user", content: "ping" }],
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(body);
      }
      return { ok: true };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body);
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: formatLlmUserMessage(error, {
        source: config.source,
        provider: config.provider,
      }),
    };
  }
}

/** @deprecated Use runLlmAssistant with resolveLlmConfig instead */
export async function runOpenAiAssistant(
  params: LlmAssistantParams
): Promise<LlmRunResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured.");
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  return runOpenAiAssistantWithConfig(
    { source: "platform", provider: "openai", apiKey, model },
    params
  );
}
