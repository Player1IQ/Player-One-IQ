"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CalendarDays, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  activateCreatorContentPlanAction,
  resyncCreatorContentPlanAction,
} from "@/lib/creator-ai/plan-actions";
import type { PlanSyncSummary } from "@/lib/creator-ai/plan-sync";
import type { ContentPlanStatus, CreatorContentPlan } from "@/lib/creator-ai/plan-types";
import { ContentPlanPreview } from "./ContentPlanPreview";

interface ContentPlanCardProps {
  plan: CreatorContentPlan;
  mode?: "live" | "demo" | null;
  onActivated?: (plan: CreatorContentPlan) => void;
}

const STATUS_STYLES: Record<
  ContentPlanStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  },
  active: {
    label: "Active",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  },
  archived: {
    label: "Archived",
    className: "border-white/10 bg-white/[0.04] text-gray-400",
  },
};

function formatSyncMessage(sync: PlanSyncSummary): string {
  const added = sync.eventsCreated;
  const updated = sync.eventsUpdated;
  const parts: string[] = [];

  if (added > 0) {
    parts.push(`${added} event${added === 1 ? "" : "s"} added`);
  }
  if (updated > 0) {
    parts.push(`${updated} updated`);
  }
  if (sync.eventsSkipped > 0 && parts.length === 0) {
    parts.push(`${sync.eventsSkipped} existing event${sync.eventsSkipped === 1 ? "" : "s"} kept`);
  }

  if (sync.errors.length > 0) {
    return `Schedule sync failed: ${sync.errors[0]}`;
  }

  if (parts.length === 0) {
    return "Your schedule is up to date.";
  }

  return `${parts.join(", ")} on your schedule.`;
}

function syncMessageTone(sync: PlanSyncSummary): "success" | "error" {
  return sync.errors.length > 0 ? "error" : "success";
}

export function ContentPlanCard({
  plan: initialPlan,
  mode,
  onActivated,
}: ContentPlanCardProps) {
  const [plan, setPlan] = useState(initialPlan);
  const [syncSummary, setSyncSummary] = useState<PlanSyncSummary | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const statusStyle = STATUS_STYLES[plan.status];
  const syncMessage = syncSummary ? formatSyncMessage(syncSummary) : null;

  function handleActivate() {
    setError("");
    setSyncSummary(null);
    startTransition(async () => {
      const result = await activateCreatorContentPlanAction(plan.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setPlan(result.plan);
      setSyncSummary(result.sync);
      onActivated?.(result.plan);
    });
  }

  function handleResync() {
    setError("");
    setSyncSummary(null);
    startTransition(async () => {
      const result = await resyncCreatorContentPlanAction(plan.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSyncSummary(result.sync);
    });
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-white/[0.08] bg-black/30 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent-light">
            <CalendarDays className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Posting plan</p>
            <p className="text-xs text-gray-500">
              {plan.periodStart} – {plan.periodEnd}
              {mode === "demo" ? " · Demo mode" : null}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            statusStyle.className
          )}
        >
          {statusStyle.label}
        </span>
      </div>

      {plan.plan.summary ? (
        <p className="text-xs leading-relaxed text-gray-400">{plan.plan.summary}</p>
      ) : null}

      <ContentPlanPreview plan={plan.plan} />

      {plan.status === "draft" ? (
        <div className="space-y-2 border-t border-white/[0.06] pt-3">
          <button
            type="button"
            onClick={handleActivate}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Activate plan
          </button>
          <p className="text-[11px] text-gray-500">
            Activating adds plan items to your schedule. Unchanged days from a
            previous plan are kept; only changed days are replaced.
          </p>
        </div>
      ) : null}

      {plan.status === "active" ? (
        <div className="space-y-2 border-t border-white/[0.06] pt-3">
          <button
            type="button"
            onClick={handleResync}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-black/20 px-3 py-1.5 text-xs font-medium text-gray-200 hover:border-accent/30 hover:text-white disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CalendarDays className="h-3.5 w-3.5" />
            )}
            Sync to schedule
          </button>
          <p className="text-[11px] text-gray-500">
            Adds any missing plan items to your calendar without replacing
            events that are already synced.
          </p>
        </div>
      ) : null}

      {syncMessage && syncSummary ? (
        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-xs",
            syncMessageTone(syncSummary) === "error"
              ? "border-red-500/20 bg-red-500/10 text-red-100"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
          )}
        >
          <p>{syncMessage}</p>
          {syncMessageTone(syncSummary) === "success" ? (
            <Link
              href="/schedule"
              className="mt-1 inline-block font-medium text-emerald-200 underline-offset-2 hover:underline"
            >
              View schedule
            </Link>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
