"use client";

import { useState, useTransition } from "react";
import {
  Brain,
  LineChart,
  Loader2,
  Target,
  TrendingUp,
  Sparkles,
  Zap,
  History,
} from "lucide-react";
import { runAiAction } from "@/lib/ai/actions";
import { assistantDefinitions } from "@/lib/ai/assistants";
import type { AiActionType, AiAssistantResult } from "@/lib/ai/types";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import type { AiUsageSummary, FeatureKey } from "@/lib/subscription/types";
import { hasAnyFeature } from "@/lib/subscription/features";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GlowCard } from "@/components/ui/GlowCard";
import { MetricCard } from "@/components/ui/MetricCard";

const assistantIcons = {
  growth: TrendingUp,
  sponsorship: Target,
  revenue: LineChart,
} as const;

const assistantDisplayNames: Record<string, string> = {
  growth: "Growth Coach",
  sponsorship: "Sponsorship Hunter",
  revenue: "Revenue Optimizer",
};

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

  const totalRequests = usage.reduce((sum, row) => sum + row.requestCount, 0);

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
    <div className="space-y-8 animate-fade-in">
      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      {/* Usage overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total AI Requests"
          value={String(totalRequests)}
          subtitle="This billing period"
          icon={Sparkles}
          iconColor="text-accent-light"
        />
        {usage.map((row) => (
          <MetricCard
            key={row.assistantType}
            title={`${assistantDisplayNames[row.assistantType] ?? row.assistantType}`}
            value={String(row.requestCount)}
            subtitle="requests this month"
            icon={assistantIcons[row.assistantType as keyof typeof assistantIcons] ?? Zap}
            iconColor="text-violet-400"
          />
        ))}
      </div>

      {/* Assistant cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {assistantDefinitions.map((assistant) => {
          const Icon = assistantIcons[assistant.type];
          const result = results[assistant.type];
          const displayName =
            assistantDisplayNames[assistant.type] ?? assistant.title;

          return (
            <GlowCard key={assistant.type} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/25 shadow-glow-active">
                    <Icon className="h-6 w-6 text-accent-light" />
                  </div>
                  <div>
                    <CardTitle>{displayName}</CardTitle>
                    <CardDescription>{assistant.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col pt-0">
                <FeatureGate
                  features={featureSet}
                  required={[...assistant.requiredFeatures]}
                  featureLabel={assistant.title}
                >
                  <div className="flex flex-col gap-2">
                    {assistant.actions.map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => runAction(action)}
                        disabled={isPending}
                        className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left text-sm text-gray-200 transition-all hover:border-accent/30 hover:bg-accent/5 disabled:opacity-50"
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
                    <div className="mt-6 space-y-4 border-t border-white/[0.06] pt-6">
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-gray-500" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Latest results
                        </p>
                      </div>
                      {result.insights.map((insight) => (
                        <div
                          key={insight.id}
                          className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                        >
                          <p className="text-sm font-medium text-white">
                            {insight.title}
                          </p>
                          <p className="mt-1 text-sm text-gray-400">
                            {insight.summary}
                          </p>
                          <Badge variant="accent" className="mt-2">
                            {Math.round(insight.confidence * 100)}% confidence
                          </Badge>
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
                              className="flex items-center justify-between rounded-xl bg-white/[0.02] px-3 py-2 text-sm"
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
                              className="rounded-xl bg-white/[0.02] px-3 py-2 text-sm"
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
              </CardContent>
            </GlowCard>
          );
        })}

        {/* Content Strategist placeholder card */}
        <GlowCard className="flex flex-col opacity-80">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-500/25">
                <Brain className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <CardTitle>Content Strategist</CardTitle>
                <CardDescription>
                  Cross-platform content optimization and scheduling insights
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between pt-0">
            <p className="text-sm text-gray-500">
              Available on creator profiles with connected platform accounts.
              Use the Content Coach on individual creator pages.
            </p>
            <Badge variant="muted" className="mt-4 w-fit">
              Per-creator feature
            </Badge>
          </CardContent>
        </GlowCard>
      </div>
    </div>
  );
}
