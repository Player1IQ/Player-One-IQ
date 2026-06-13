"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import {
  Brain,
  LineChart,
  Loader2,
  Target,
  TrendingUp,
  Sparkles,
  Zap,
  MessageSquare,
  Send,
  AlertCircle,
} from "lucide-react";
import { runAiAction, runAiQuestion } from "@/lib/ai/actions";
import { assistantDefinitions } from "@/lib/ai/assistants";
import type { AiActionType, AiAssistantResult } from "@/lib/ai/types";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import type { AiUsageSummary, FeatureKey } from "@/lib/subscription/types";
import { hasAnyFeature } from "@/lib/subscription/features";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GlowCard } from "@/components/ui/GlowCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { cn } from "@/lib/utils";

const MAX_QUESTION_LENGTH = 2000;

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

type PanelState =
  | { status: "idle" }
  | { status: "loading"; label: string }
  | {
      status: "result";
      sourceLabel: string;
      result: AiAssistantResult;
      mode: "live" | "demo";
      fallbackNotice?: string;
    };

interface AiDashboardClientProps {
  features: FeatureKey[];
  usage: AiUsageSummary[];
  aiRequestCount: number;
  aiRequestLimit: number | null;
}

function ModeBadge({
  mode,
  fallbackNotice,
}: {
  mode: "live" | "demo";
  fallbackNotice?: string;
}) {
  if (mode === "live") {
    return <Badge variant="success">Live</Badge>;
  }
  if (fallbackNotice) {
    return <Badge variant="warning">Sample</Badge>;
  }
  return <Badge variant="muted">Demo</Badge>;
}

function formatResultTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function AiResultBody({ result }: { result: AiAssistantResult }) {
  return (
    <div className="space-y-4">
      {result.insights.map((insight) => (
        <div
          key={insight.id}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
        >
          <p className="text-sm font-medium text-white">{insight.title}</p>
          <p className="mt-1 text-sm text-gray-400">{insight.summary}</p>
          <Badge variant="accent" className="mt-2">
            {Math.round(insight.confidence * 100)}% confidence
          </Badge>
        </div>
      ))}
      {result.matches?.length ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400">Top matches</p>
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
  );
}

export function AiDashboardClient({
  features,
  usage,
  aiRequestCount,
  aiRequestLimit,
}: AiDashboardClientProps) {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [panelState, setPanelState] = useState<PanelState>({ status: "idle" });
  const [error, setError] = useState("");
  const [activeAction, setActiveAction] = useState<AiActionType | null>(null);
  const [isPending, startTransition] = useTransition();
  const [question, setQuestion] = useState("");
  const [questionError, setQuestionError] = useState("");

  const featureSet = new Set(features);
  const hasAnyAi = assistantDefinitions.some((assistant) =>
    hasAnyFeature(featureSet, [...assistant.requiredFeatures])
  );

  const totalRequests = usage.reduce((sum, row) => sum + row.requestCount, 0);
  const atAiLimit =
    aiRequestLimit !== null && aiRequestCount >= aiRequestLimit;
  const aiUsagePercent =
    aiRequestLimit && aiRequestLimit > 0
      ? Math.min(100, Math.round((aiRequestCount / aiRequestLimit) * 100))
      : null;

  function scrollToResults() {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function submitQuestion() {
    const trimmed = question.trim();
    if (!trimmed) {
      setQuestionError("Please enter a question.");
      return;
    }
    if (atAiLimit) {
      setQuestionError(
        "You've used all included AI requests for this month. Upgrade your plan or wait until your next billing period."
      );
      return;
    }
    setQuestionError("");
    setError("");
    setActiveAction(null);
    const sourceLabel =
      trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
    setPanelState({ status: "loading", label: "Answering your question…" });
    scrollToResults();
    startTransition(async () => {
      const response = await runAiQuestion(trimmed);
      if ("error" in response && response.error) {
        setPanelState({ status: "idle" });
        setQuestionError(response.error);
        return;
      }
      if ("result" in response && response.result) {
        setPanelState({
          status: "result",
          sourceLabel,
          result: response.result,
          mode: response.mode ?? "demo",
          fallbackNotice: response.fallbackNotice,
        });
      }
    });
  }

  function runAction(action: AiActionType) {
    if (atAiLimit) {
      setError(
        "You've used all included AI requests for this month. Upgrade your plan or wait until your next billing period."
      );
      return;
    }
    setError("");
    setQuestionError("");
    setActiveAction(action);
    setPanelState({
      status: "loading",
      label: actionLabels[action],
    });
    scrollToResults();
    startTransition(async () => {
      const response = await runAiAction(action);
      setActiveAction(null);
      if ("error" in response && response.error) {
        setPanelState({ status: "idle" });
        setError(response.error);
        return;
      }
      if ("result" in response && response.result) {
        setPanelState({
          status: "result",
          sourceLabel: actionLabels[action],
          result: response.result,
          mode: response.mode ?? "demo",
          fallbackNotice: response.fallbackNotice,
        });
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

      {aiRequestLimit !== null ? (
        <div
          className={cn(
            "rounded-xl border px-4 py-3",
            atAiLimit
              ? "border-amber-500/30 bg-amber-500/10"
              : "border-white/[0.06] bg-white/[0.02]"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">
                Included AI requests
              </p>
              <p className="text-xs text-gray-500">
                Shared across your organization this billing period
              </p>
            </div>
            <p
              className={cn(
                "text-sm font-semibold",
                atAiLimit ? "text-amber-400" : "text-accent-light"
              )}
            >
              {aiRequestCount} / {aiRequestLimit}
            </p>
          </div>
          {aiUsagePercent !== null ? (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  atAiLimit ? "bg-amber-500" : "bg-accent"
                )}
                style={{ width: `${aiUsagePercent}%` }}
              />
            </div>
          ) : null}
          {atAiLimit ? (
            <p className="mt-3 text-sm text-amber-200">
              Monthly limit reached.{" "}
              <Link href="/billing" className="font-medium underline">
                View plans
              </Link>{" "}
              to upgrade, or try again next month.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Ask anything */}
      <GlowCard>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/25 shadow-glow-active">
              <MessageSquare className="h-6 w-6 text-accent-light" />
            </div>
            <div>
              <CardTitle>Ask anything</CardTitle>
              <CardDescription>
                Get personalized insights about your creators, sponsors, and
                revenue
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <textarea
            value={question}
            onChange={(e) =>
              setQuestion(e.target.value.slice(0, MAX_QUESTION_LENGTH))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitQuestion();
              }
            }}
            placeholder="e.g. Which creators should I pitch to energy drink brands this quarter?"
            rows={3}
            disabled={isPending || atAiLimit}
            className="w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-gray-200 placeholder:text-gray-500 transition-all focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
          />
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              {question.length}/{MAX_QUESTION_LENGTH}
            </p>
            <Button
              type="button"
              onClick={submitQuestion}
              disabled={isPending || atAiLimit || !question.trim()}
            >
              {isPending && panelState.status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isPending && panelState.status === "loading"
                ? "Thinking…"
                : "Send"}
            </Button>
          </div>
          {questionError ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {questionError}
            </div>
          ) : null}
        </CardContent>
      </GlowCard>

      {/* Central results panel */}
      <div ref={resultsRef}>
        <GlowCard>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/25 shadow-glow-active">
                <Sparkles className="h-6 w-6 text-accent-light" />
              </div>
              <div>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  Insights from quick actions and questions appear here
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {panelState.status === "idle" ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-10 text-center">
                <Sparkles className="mb-3 h-8 w-8 text-gray-600" />
                <p className="text-sm font-medium text-gray-300">
                  Results appear here
                </p>
                <p className="mt-1 max-w-sm text-sm text-gray-500">
                  Click a quick action below or ask a question above to get
                  started
                </p>
              </div>
            ) : null}

            {panelState.status === "loading" ? (
              <div className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-6">
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-accent-light" />
                <p className="text-sm text-gray-300">{panelState.label}</p>
              </div>
            ) : null}

            {panelState.status === "result" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-white">
                    {panelState.sourceLabel}
                  </p>
                  <ModeBadge
                    mode={panelState.mode}
                    fallbackNotice={panelState.fallbackNotice}
                  />
                  <span className="text-xs text-gray-500">
                    {formatResultTime(panelState.result.generatedAt)}
                  </span>
                </div>

                {panelState.fallbackNotice ? (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <p>{panelState.fallbackNotice}</p>
                  </div>
                ) : null}

                <AiResultBody result={panelState.result} />
              </div>
            ) : null}
          </CardContent>
        </GlowCard>
      </div>

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
            icon={
              assistantIcons[row.assistantType as keyof typeof assistantIcons] ??
              Zap
            }
            iconColor="text-violet-400"
          />
        ))}
      </div>

      {/* Assistant cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {assistantDefinitions.map((assistant) => {
          const Icon = assistantIcons[assistant.type];
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
                        disabled={isPending || atAiLimit}
                        className={cn(
                          "flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left text-sm text-gray-200 transition-all hover:border-accent/30 hover:bg-accent/5 disabled:opacity-50",
                          isPending &&
                            activeAction === action &&
                            "border-accent/50 ring-2 ring-accent/40 bg-accent/5"
                        )}
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
