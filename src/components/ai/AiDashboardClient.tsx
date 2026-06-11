"use client";

import { useState, useTransition } from "react";
import {
  Brain,
  LineChart,
  Loader2,
  Target,
  TrendingUp,
} from "lucide-react";
import { runAiAction } from "@/lib/ai/actions";
import { assistantDefinitions } from "@/lib/ai/assistants";
import type { AiActionType, AiAssistantResult } from "@/lib/ai/types";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import type { AiUsageSummary, FeatureKey } from "@/lib/subscription/types";
import { hasAnyFeature } from "@/lib/subscription/features";

const assistantIcons = {
  growth: TrendingUp,
  sponsorship: Target,
  revenue: LineChart,
} as const;

const actionLabels: Record<AiActionType, string> = {
  analyze_performance: "Analyze performance",
  growth_recommendations: "Growth recommendations",
  content_strategy: "Content strategy",
  sponsorship_targets: "Sponsorship targets",
  match_creators: "Match creators",
  match_sponsors: "Match sponsors",
  rank_opportunities: "Rank opportunities",
  forecast_earnings: "Forecast earnings",
  forecast_campaigns: "Forecast campaigns",
  predict_contract_value: "Predict contract value",
};

interface AiDashboardClientProps {
  features: FeatureKey[];
  usage: AiUsageSummary[];
}

export function AiDashboardClient({ features, usage }: AiDashboardClientProps) {
  const [results, setResults] = useState<Record<string, AiAssistantResult>>({});
  const [error, setError] = useState("");
  const [activeAction, setActiveAction] = useState<AiActionType | null>(null);
  const [isPending, startTransition] = useTransition();

  const featureSet = new Set(features);
  const hasAnyAi = assistantDefinitions.some((assistant) =>
    hasAnyFeature(featureSet, [...assistant.requiredFeatures])
  );

  function runAction(action: AiActionType) {
    setError("");
    setActiveAction(action);
    startTransition(async () => {
      const response = await runAiAction(action);
      setActiveAction(null);
      if ("error" in response && response.error) {
        setError(response.error);
        return;
      }
      if ("result" in response && response.result) {
        setResults((prev) => ({
          ...prev,
          [response.result!.assistantType]: response.result!,
        }));
      }
    });
  }

  if (!hasAnyAi) {
    return (
      <UpgradePrompt
        title="AI tools not available"
        message="Upgrade your plan to unlock AI growth, sponsorship, and revenue assistants."
        featureLabel="AI assistants"
      />
    );
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        {usage.map((row) => (
          <div
            key={row.assistantType}
            className="rounded-xl border border-border bg-surface-raised p-5"
          >
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {row.assistantType} assistant
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              {row.requestCount}
            </p>
            <p className="text-sm text-gray-500">requests this month</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {assistantDefinitions.map((assistant) => {
          const Icon = assistantIcons[assistant.type];
          const result = results[assistant.type];

          return (
            <div
              key={assistant.type}
              className="flex flex-col rounded-xl border border-border bg-surface-raised p-6"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/20">
                  <Icon className="h-5 w-5 text-accent-light" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">
                    {assistant.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {assistant.description}
                  </p>
                </div>
              </div>

              <FeatureGate
                features={featureSet}
                required={[...assistant.requiredFeatures]}
                featureLabel={assistant.title}
              >
                <div className="mt-6 flex flex-col gap-2">
                  {assistant.actions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => runAction(action)}
                      disabled={isPending}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left text-sm text-gray-200 transition-colors hover:border-accent/30 hover:bg-accent/5 disabled:opacity-50"
                    >
                      <span>{actionLabels[action]}</span>
                      {isPending && activeAction === action ? (
                        <Loader2 className="h-4 w-4 animate-spin text-accent-light" />
                      ) : (
                        <Brain className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  ))}
                </div>

                {result ? (
                  <div className="mt-6 space-y-4 border-t border-border pt-6">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Latest results
                    </p>
                    {result.insights.map((insight) => (
                      <div
                        key={insight.id}
                        className="rounded-lg border border-border-subtle bg-surface px-4 py-3"
                      >
                        <p className="text-sm font-medium text-white">
                          {insight.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-400">
                          {insight.summary}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          {Math.round(insight.confidence * 100)}% confidence
                        </p>
                      </div>
                    ))}
                    {result.matches?.length ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-400">
                          Top matches
                        </p>
                        {result.matches.map((match) => (
                          <div
                            key={match.id}
                            className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm"
                          >
                            <span className="text-gray-300">{match.name}</span>
                            <span className="font-medium text-accent-light">
                              {match.fitScore}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {result.forecasts?.length ? (
                      <div className="space-y-2">
                        {result.forecasts.map((forecast) => (
                          <div
                            key={forecast.id}
                            className="rounded-lg bg-surface px-3 py-2 text-sm"
                          >
                            <p className="text-gray-300">{forecast.label}</p>
                            <p className="font-semibold text-white">
                              {forecast.projectedAmount.toLocaleString("en-US", {
                                style: "currency",
                                currency: forecast.currency,
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </FeatureGate>
            </div>
          );
        })}
      </div>
    </div>
  );
}
