import { Sparkles } from "lucide-react";

interface AiModeNoticeProps {
  mode: "live" | "demo";
}

export function AiModeNotice({ mode }: AiModeNoticeProps) {
  if (mode === "live") {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <Sparkles className="mt-0.5 h-4 w-4 text-emerald-400" />
        <p className="text-sm text-gray-300">
          <span className="font-medium text-emerald-400">Live AI</span> — insights
          are generated from your workspace data using OpenAI.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-border bg-surface-raised px-4 py-3">
      <Sparkles className="mt-0.5 h-4 w-4 text-gray-500" />
      <p className="text-sm text-gray-400">
        <span className="font-medium text-gray-300">Demo mode</span> — sample
        responses until you add{" "}
        <code className="rounded bg-surface px-1 py-0.5 text-xs text-accent-light">
          OPENAI_API_KEY
        </code>{" "}
        to <code className="rounded bg-surface px-1 py-0.5 text-xs">.env.local</code>.
      </p>
    </div>
  );
}
