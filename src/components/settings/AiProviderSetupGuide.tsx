"use client";

import { useState } from "react";
import { CircleHelp, ExternalLink } from "lucide-react";
import type { AiProvider } from "@/lib/ai/providers/types";
import { getAiProviderSetupGuide } from "@/lib/ai/providers/setup-guides";
import { cn } from "@/lib/utils";

interface AiProviderSetupGuideProps {
  provider: AiProvider;
  className?: string;
  defaultOpen?: boolean;
}

export function AiProviderSetupGuide({
  provider,
  className,
  defaultOpen = false,
}: AiProviderSetupGuideProps) {
  const [open, setOpen] = useState(defaultOpen);
  const guide = getAiProviderSetupGuide(provider);

  return (
    <div className={cn("rounded-xl border border-white/[0.06] bg-black/20", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
        aria-expanded={open}
      >
        <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-accent-light" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-200">
            How to get your {guide.label} API key
          </p>
          <p className="mt-0.5 text-xs text-gray-500">{guide.summary}</p>
        </div>
        <span className="shrink-0 text-xs text-gray-500">
          {open ? "Hide" : "Show steps"}
        </span>
      </button>

      {open ? (
        <div className="border-t border-white/[0.06] px-4 py-4">
          <ol className="space-y-4">
            {guide.steps.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent-light">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-200">{step.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    {step.detail}
                  </p>
                  {step.href ? (
                    <a
                      href={step.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-light hover:text-white"
                    >
                      {step.hrefLabel ?? "Open link"}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-100/90">
            <span className="font-medium text-amber-200">Tip:</span> Keys start
            with{" "}
            <code className="rounded bg-black/30 px-1 py-0.5 font-mono">
              {guide.keyPrefix}
            </code>
            . {guide.billingNote}
          </div>
        </div>
      ) : null}
    </div>
  );
}
