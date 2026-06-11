import { getOpenAiModel, isAiLlmConfigured } from "./config";
import type { AiAssistantResult, AiForecast, AiMatchScore } from "./types";
import type { AiAssistantType } from "@/lib/subscription/types";

export interface LlmRunResult {
  result: AiAssistantResult;
  tokensUsed: number;
  model: string;
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

function parseAssistantResult(
  assistantType: AiAssistantType,
  raw: string
): AiAssistantResult {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
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

export async function runOpenAiAssistant(params: {
  system: string;
  user: string;
  assistantType: AiAssistantType;
}): Promise<LlmRunResult> {
  if (!isAiLlmConfigured()) {
    throw new Error("OpenAI API key is not configured.");
  }

  const model = getOpenAiModel();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
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
    model,
  };
}
