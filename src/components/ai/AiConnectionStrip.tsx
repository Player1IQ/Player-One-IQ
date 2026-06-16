import Link from "next/link";
import { Settings2, Sparkles } from "lucide-react";
import type { AiIntegrationPublic } from "@/lib/ai/providers/types";
import { aiProviderOptions } from "@/lib/ai/providers/types";
import type { AiLlmHealthState } from "@/lib/ai/llm-health";

interface AiConnectionStripProps {
  integration: AiIntegrationPublic | null;
  healthState: AiLlmHealthState;
  canManage: boolean;
}

function providerDisplayName(provider: string | null): string {
  return (
    aiProviderOptions.find((option) => option.value === provider)?.label ??
    "AI provider"
  );
}

export function AiConnectionStrip({
  integration,
  healthState,
  canManage,
}: AiConnectionStripProps) {
  const workspaceConnected =
    integration?.hasApiKey && integration.isEnabled;
  const { health, source, provider } = healthState;

  let statusLabel = "Not connected";
  let statusTone: "emerald" | "amber" | "gray" = "gray";
  let detail = "Connect Claude or OpenAI to unlock live insights.";

  if (workspaceConnected) {
    statusLabel = `${providerDisplayName(integration.provider)} connected`;
    statusTone = health === "available" ? "emerald" : "amber";
    detail = `Workspace key ${integration.apiKeyHint}${
      integration.model ? ` · ${integration.model}` : ""
    }`;
    if (health === "quota_exceeded") {
      detail += " — billing issue on your provider account";
    } else if (health === "unavailable") {
      detail += " — connection issue, try Test in Settings";
    }
  } else if (source === "platform" && provider) {
    statusLabel = `${providerDisplayName(provider)} (platform fallback)`;
    statusTone = health === "available" ? "emerald" : "amber";
    detail =
      health === "available"
        ? "Using the platform API key. Connect your own key in Settings for direct billing."
        : "Platform AI is unavailable — connect your workspace key in Settings.";
  } else if (integration?.hasApiKey && !integration.isEnabled) {
    statusLabel = `${providerDisplayName(integration.provider)} disabled`;
    statusTone = "amber";
    detail = `Key on file (${integration.apiKeyHint}) but integration is turned off.`;
  }

  const iconClasses = {
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    gray: "text-gray-500",
  };

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-surface-raised/60 px-4 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <Sparkles className={`mt-0.5 h-4 w-4 shrink-0 ${iconClasses[statusTone]}`} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{statusLabel}</p>
          <p className="mt-0.5 text-xs text-gray-500">{detail}</p>
        </div>
      </div>
      {canManage ? (
        <Link
          href="/settings"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-accent/30 hover:text-white"
        >
          <Settings2 className="h-3.5 w-3.5" />
          {workspaceConnected ? "Manage" : "Connect"}
        </Link>
      ) : null}
    </div>
  );
}
