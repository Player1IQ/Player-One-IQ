"use client";

import { useState, useTransition } from "react";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { runCreatorContentAnalysis } from "@/lib/ai/actions";
import type { AiAssistantResult } from "@/lib/ai/types";
import type { Platform } from "@/lib/creators";
import type { ContentAnalysisScope } from "@/lib/platform-oauth/content-performance";
import { contentCoachPlatforms } from "@/lib/platform-oauth/content-performance";
import {
  isOAuthPlatform,
  type OAuthPlatform,
  type OAuthPlatformUi,
} from "@/lib/platform-oauth/types";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { PlatformBadge } from "./PlatformBadge";

interface CreatorContentCoachProps {
  creatorId: string;
  creatorName: string;
  connectedOAuthPlatforms: Platform[];
  oauthPlatformUi?: OAuthPlatformUi[];
  canUseAi: boolean;
  aiMode: "live" | "demo";
}

export function CreatorContentCoach({
  creatorId,
  creatorName,
  connectedOAuthPlatforms,
  oauthPlatformUi = [],
  canUseAi,
  aiMode,
}: CreatorContentCoachProps) {
  const availableOAuth = new Set(
    oauthPlatformUi
      .filter((entry) => entry.status === "available")
      .map((entry) => entry.platform)
  );
  const oauthConnected = connectedOAuthPlatforms.filter(
    (platform): platform is OAuthPlatform => isOAuthPlatform(platform)
  );
  const hasOAuthForAnalysis = oauthConnected.length > 0;

  const [scope, setScope] = useState<ContentAnalysisScope>("all");
  const [error, setError] = useState("");
  const [result, setResult] = useState<AiAssistantResult | null>(null);
  const [analyzedPlatforms, setAnalyzedPlatforms] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  if (!canUseAi) {
    return (
      <UpgradePrompt
        compact
        featureLabel="AI content analysis"
        message="Upgrade to Creator Pro or Agency to unlock AI content recommendations."
      />
    );
  }

  function handleAnalyze() {
    setError("");
    startTransition(async () => {
      const response = await runCreatorContentAnalysis(creatorId, scope);
      if ("error" in response && response.error) {
        setError(response.error);
        return;
      }
      if ("result" in response && response.result) {
        setResult(response.result);
        if ("platforms" in response && Array.isArray(response.platforms)) {
          setAnalyzedPlatforms(response.platforms);
        }
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        One coach for all platforms — analyze recent posts, videos, and streams
        together and get cross-platform recommendations for {creatorName}.
      </p>

      <div className="flex flex-wrap gap-2">
        {contentCoachPlatforms.map((platform) => {
          const oauthReady = availableOAuth.has(platform);
          const connected = connectedOAuthPlatforms.includes(platform);

          return (
            <div key={platform} className="flex items-center gap-1.5">
              <PlatformBadge platform={platform} />
              {oauthReady ? (
                <span
                  className={`text-[10px] font-medium uppercase tracking-wide ${
                    connected ? "text-emerald-400" : "text-gray-600"
                  }`}
                >
                  {connected ? "Connected" : "Not connected"}
                </span>
              ) : (
                <span className="text-[10px] font-medium uppercase tracking-wide text-gray-600">
                  Add API keys
                </span>
              )}
            </div>
          );
        })}
      </div>

      {!hasOAuthForAnalysis ? (
        <p className="text-sm text-gray-500">
          Connect YouTube, Twitch, Instagram, or TikTok above to start
          analyzing content.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Analyze:</span>
            <button
              type="button"
              onClick={() => setScope("all")}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                scope === "all"
                  ? "bg-accent/20 text-accent-light ring-accent/30"
                  : "bg-surface text-gray-400 ring-border-subtle hover:text-gray-200"
              }`}
            >
              All connected
            </button>
            {oauthConnected.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => setScope(platform)}
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                  scope === platform
                    ? "bg-accent/20 text-accent-light ring-accent/30"
                    : "bg-surface text-gray-400 ring-border-subtle hover:text-gray-200"
                }`}
              >
                {platform} only
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              Uses one AI request whether you analyze one platform or all.
            </p>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              Analyze content
            </button>
          </div>
        </>
      )}

      <p className="text-xs text-gray-600">
        {aiMode === "live"
          ? "Live mode — pulls recent content from connected OAuth accounts."
          : "Demo mode — add OPENAI_API_KEY for live analysis."}
      </p>

      {error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="space-y-3">
          {analyzedPlatforms.length > 0 ? (
            <p className="text-xs text-gray-500">
              Based on: {analyzedPlatforms.join(", ")}
            </p>
          ) : null}
          {result.insights.map((insight) => (
            <div
              key={insight.id}
              className="rounded-lg border border-border-subtle bg-surface px-4 py-3"
            >
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-light" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {insight.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">{insight.summary}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {Math.round(insight.confidence * 100)}% confidence
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
