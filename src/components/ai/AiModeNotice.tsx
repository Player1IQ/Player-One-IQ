import { Sparkles, AlertCircle } from "lucide-react";
import type { OpenAiHealth } from "@/lib/ai/openai-health";

interface AiModeNoticeProps {
  health: OpenAiHealth;
  aiRequestCount?: number;
  aiRequestLimit?: number | null;
}

export function AiModeNotice({
  health,
  aiRequestCount,
  aiRequestLimit,
}: AiModeNoticeProps) {
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
            insights are generated from your workspace data using OpenAI.
          </p>
          {planUsage ? (
            <p className="mt-1 text-xs text-gray-500">{planUsage}</p>
          ) : null}
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
            — live AI is off because the platform OpenAI account has no billing
            quota. This is{" "}
            <span className="font-medium">not</span> your plan limit.
          </p>
          {planUsage ? (
            <p className="mt-1 text-xs text-amber-200/80">
              Your workspace: {planUsage} (still available when live AI is
              restored).
            </p>
          ) : null}
          <p className="mt-2 text-xs text-amber-200/70">
            Platform owners: add billing at{" "}
            <a
              href="https://platform.openai.com/settings/organization/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              platform.openai.com
            </a>
            , or remove{" "}
            <code className="rounded bg-black/20 px-1 py-0.5 text-[11px]">
              OPENAI_API_KEY
            </code>{" "}
            from Vercel for demo-only mode.
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
      <p className="text-sm text-gray-400">
        <span className="font-medium text-gray-300">Demo mode</span> — sample
        responses until{" "}
        <code className="rounded bg-surface px-1 py-0.5 text-xs text-accent-light">
          OPENAI_API_KEY
        </code>{" "}
        is configured.
      </p>
    </div>
  );
}
