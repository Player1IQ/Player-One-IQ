import Link from "next/link";
import { CircleHelp, Settings2, Sparkles } from "lucide-react";
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
  const { health, source, provider, detail } = healthState;

  let statusLabel = "Not connected";
  let statusTone: "emerald" | "amber" | "gray" = "gray";
  let statusDetail = "Connect Claude or OpenAI to unlock live insights.";

  if (workspaceConnected) {
    statusLabel = `${providerDisplayName(integration.provider)} connected`;
    statusTone =
      health === "available"
        ? "emerald"
        : health === "credentials_error"
          ? "amber"
          : "amber";
    statusDetail = `Workspace key ${integration.apiKeyHint}${
      integration.model ? ` · ${integration.model}` : ""
    }`;
    if (health === "credentials_error") {
      statusDetail =
        detail ??
        "Saved key could not be read — re-enter your API key in Settings.";
    } else if (health === "quota_exceeded") {
      statusDetail += " — billing issue on your provider account";
      if (detail) statusDetail = detail;
    } else if (health === "unavailable") {
      statusDetail = detail
        ? `${statusDetail} — ${detail}`
        : `${statusDetail} — connection issue, try Test in Settings`;
    } else if (source === "org" && health === "available") {
      // keep default statusDetail
    } else if (source !== "org" && health !== "available") {
      statusDetail +=
        " — server could not load your workspace key; try Save again in Settings";
    }
  } else if (source === "platform" && provider) {
    statusLabel = `${providerDisplayName(provider)} (platform fallback)`;
    statusTone = health === "available" ? "emerald" : "amber";
    statusDetail =
      health === "available"
        ? "Using the platform API key. Connect your own key in Settings for direct billing."
        : detail ??
          "Platform AI is unavailable — connect your workspace key in Settings.";
  } else if (integration?.hasApiKey && !integration.isEnabled) {
    statusLabel = `${providerDisplayName(integration.provider)} disabled`;
    statusTone = "amber";
    statusDetail = `Key on file (${integration.apiKeyHint}) but integration is turned off.`;
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
          <p className="mt-0.5 text-xs text-gray-500">{statusDetail}</p>
        </div>
      </div>
      {canManage ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {!workspaceConnected ? (
            <Link
              href="/settings#ai-integration"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-accent/30 hover:text-white"
            >
              <CircleHelp className="h-3.5 w-3.5" />
              Setup guide
            </Link>
          ) : null}
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-accent/30 hover:text-white"
          >
            <Settings2 className="h-3.5 w-3.5" />
            {workspaceConnected ? "Manage" : "Connect"}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
