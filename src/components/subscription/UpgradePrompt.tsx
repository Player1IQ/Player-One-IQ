import Link from "next/link";
import { Sparkles } from "lucide-react";

interface UpgradePromptProps {
  title?: string;
  message: string;
  featureLabel?: string;
  compact?: boolean;
}

export function UpgradePrompt({
  title = "Upgrade required",
  message,
  featureLabel,
  compact = false,
}: UpgradePromptProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
        <p className="text-sm text-gray-300">{message}</p>
        <Link
          href="/billing"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-dark"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Upgrade
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-accent/30 bg-accent/5 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
        <Sparkles className="h-6 w-6 text-accent-light" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      {featureLabel ? (
        <p className="mt-1 text-sm font-medium text-accent-light">
          {featureLabel}
        </p>
      ) : null}
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">{message}</p>
      <Link
        href="/billing"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 hover:bg-accent-dark"
      >
        View plans & upgrade
      </Link>
    </div>
  );
}
