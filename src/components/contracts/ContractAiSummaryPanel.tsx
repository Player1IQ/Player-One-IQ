"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { runContractSummary } from "@/lib/ai/actions";
import type { AiAssistantResult } from "@/lib/ai/types";
import type { ContractStatus } from "@/lib/contracts";
import { contractStatusLabels, formatCurrency } from "@/lib/contracts";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";

interface ContractAiSummaryPanelProps {
  contractId: string;
  contractName: string;
  creatorName: string;
  sponsorName: string;
  status: ContractStatus;
  contractValue: number;
  canUseAi: boolean;
  aiMode: "live" | "demo";
}

export function ContractAiSummaryPanel({
  contractId,
  contractName,
  creatorName,
  sponsorName,
  status,
  contractValue,
  canUseAi,
  aiMode,
}: ContractAiSummaryPanelProps) {
  const [error, setError] = useState("");
  const [fallbackNotice, setFallbackNotice] = useState("");
  const [result, setResult] = useState<AiAssistantResult | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!canUseAi) {
    return (
      <UpgradePrompt
        compact
        featureLabel="AI contract summaries"
        message="Upgrade to Agency or Agency Pro to unlock AI contract summaries."
      />
    );
  }

  function handleGenerate() {
    setError("");
    setFallbackNotice("");
    startTransition(async () => {
      const response = await runContractSummary(contractId);
      if ("error" in response && response.error) {
        setError(response.error);
        return;
      }
      if ("result" in response && response.result) {
        setResult(response.result);
        if ("fallbackNotice" in response && response.fallbackNotice) {
          setFallbackNotice(response.fallbackNotice);
        }
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Get an AI summary of &ldquo;{contractName}&rdquo; ({creatorName} ×{" "}
        {sponsorName}) — {contractStatusLabels[status]} at{" "}
        {formatCurrency(contractValue)}.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ${
            aiMode === "live"
              ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
              : "bg-white/[0.04] text-gray-500 ring-white/[0.08]"
          }`}
        >
          {aiMode === "live" ? "Live AI" : "Demo mode"}
        </span>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {result ? "Refresh summary" : "Generate summary"}
        </button>
      </div>

      {aiMode === "demo" ? (
        <p className="text-xs text-gray-600">
          Demo mode — add OPENAI_API_KEY for live contract analysis.
        </p>
      ) : null}

      {fallbackNotice ? (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {fallbackNotice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="space-y-3">
          {result.generatedAt ? (
            <p className="text-xs text-gray-500">
              Generated {new Date(result.generatedAt).toLocaleString()}
            </p>
          ) : null}
          {result.insights.map((insight) => (
            <div
              key={insight.id}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
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
