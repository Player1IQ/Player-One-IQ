import Link from "next/link";
import { Sparkles, AlertCircle } from "lucide-react";
import type { AiLlmHealthState } from "@/lib/ai/llm-health";

interface AiModeNoticeProps {
  healthState: AiLlmHealthState;
  aiRequestCount?: number;
  aiRequestLimit?: number | null;
}

function providerLabel(provider: string | null): string {
  if (provider === "anthropic") return "Anthropic";
  if (provider === "openai") return "OpenAI";
  return "AI provider";
}

export function AiModeNotice({
  healthState,
  aiRequestCount,
  aiRequestLimit,
}: AiModeNoticeProps) {
  const { health, source, provider } = healthState;
  const planUsage =
    aiRequestLimit != null && aiRequestCount != null
      ? `${aiRequestCount} of ${aiRequestLimit} included requests used this month`
      : null;

  if (health === "available") {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <Sparkles className="mt-0.5 h-4 w-4 text-emerald-400" />
        <div className="text-sm text-gray-300">
          <p>
            <span className="font-medium text-emerald-400">Live AI</span> —
            insights are generated from your workspace data using{" "}
            {providerLabel(provider)}
            {source === "org" ? " (your workspace key)" : " (platform fallback)"}.
          </p>
          {planUsage ? (
            <p className="mt-1 text-xs text-gray-500">{planUsage}</p>
          ) : null}
          <Link
            href="/settings"
            className="mt-2 inline-block text-xs text-gray-500 underline hover:text-gray-300"
          >
            Manage AI integration
          </Link>
        </div>
      </div>
    );
  }

  if (health === "quota_exceeded") {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <div className="text-sm text-amber-100">
          <p>
            <span className="font-medium text-amber-300">Sample insights</span>{" "}
            — live AI is off because your connected {providerLabel(provider)}{" "}
            account has no billing quota.
          </p>
          {planUsage ? (
            <p className="mt-1 text-xs text-amber-200/80">
              Your workspace: {planUsage} (still available when live AI is
              restored).
            </p>
          ) : null}
          <p className="mt-2 text-xs text-amber-200/70">
          {source === "org" ? (
            <>
              Update billing with your provider or reconnect a different key in{" "}
              <Link href="/settings" className="underline hover:text-amber-50">
                Settings → AI integration
              </Link>
              .
            </>
          ) : (
            <>
              Platform owners: add billing at your OpenAI account, or{" "}
              <Link href="/settings" className="underline hover:text-amber-50">
                connect a workspace key in Settings
              </Link>
              .
            </>
          )}
          </p>
        </div>
      </div>
    );
  }

  if (health === "unavailable") {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <p className="text-sm text-amber-100">
          <span className="font-medium text-amber-300">Sample insights</span> —
          live AI is temporarily unavailable. Your included plan requests are
          unchanged.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-border bg-surface-raised px-4 py-3">
      <Sparkles className="mt-0.5 h-4 w-4 text-gray-500" />
      <div className="text-sm text-gray-400">
        <p>
          <span className="font-medium text-gray-300">Demo mode</span> — sample
          responses until you connect an AI provider.
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Connect your OpenAI or Anthropic API key to enable live insights.
        </p>
        <Link
          href="/settings"
          className="mt-3 inline-flex rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent-light hover:bg-accent/20"
        >
          Connect AI provider in Settings
        </Link>
      </div>
    </div>
  );
}
