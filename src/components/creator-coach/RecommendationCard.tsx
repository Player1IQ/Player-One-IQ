"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Recommendation } from "@/lib/creator-coach/types";
import type { CoachContext } from "@/lib/creator-coach/types";
import {
  completeCoachRecommendationAction,
  dismissCoachRecommendationAction,
} from "@/lib/creator-coach/actions";
import {
  addLocalCompletedRecommendation,
  addLocalDismissedRecommendation,
} from "@/lib/creator-coach/client-state";
import { categoryIcons, priorityStyles } from "./category-config";

interface RecommendationCardProps {
  recommendation: Recommendation;
  stateId: string | null;
  coachContext: CoachContext;
  onSnapshotUpdate?: () => void;
  onLocalDismiss?: (recommendationId: string) => void;
  onLocalComplete?: (recommendationId: string) => void;
}

export function RecommendationCard({
  recommendation,
  stateId,
  coachContext,
  onSnapshotUpdate,
  onLocalDismiss,
  onLocalComplete,
}: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const Icon = categoryIcons[recommendation.category];
  const priority = priorityStyles[recommendation.priority];

  function runAction(
    action: () => Promise<{ snapshot?: unknown; error?: string }>
  ) {
    if (isPending) return;

    if (!stateId) {
      return;
    }

    startTransition(async () => {
      await action();
      onSnapshotUpdate?.();
    });
  }

  function handleComplete() {
    if (isPending) return;

    if (!stateId) {
      addLocalCompletedRecommendation(
        coachContext.scope,
        coachContext.scopeId,
        recommendation.id
      );
      onLocalComplete?.(recommendation.id);
      return;
    }

    runAction(() =>
      completeCoachRecommendationAction(stateId, recommendation.id, coachContext)
    );
  }

  function handleDismiss() {
    if (isPending) return;

    if (!stateId) {
      addLocalDismissedRecommendation(
        coachContext.scope,
        coachContext.scopeId,
        recommendation.id
      );
      onLocalDismiss?.(recommendation.id);
      return;
    }

    runAction(() =>
      dismissCoachRecommendationAction(stateId, recommendation.id, coachContext)
    );
  }

  return (
    <article
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-surface-raised/80 backdrop-blur-sm transition-all duration-300",
        expanded && "border-accent/20 shadow-card-hover"
      )}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
            <Icon className="h-5 w-5 text-accent-light" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500">
                {recommendation.category}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1",
                  priority.badge
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", priority.dot)} />
                {recommendation.priority}
              </span>
            </div>
            <h3 className="mt-1 text-base font-semibold text-white">
              {recommendation.title}
            </h3>
            <p className="mt-1 text-sm text-gray-400 line-clamp-2">
              {recommendation.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse recommendation" : "Expand recommendation"}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
          </button>
        </div>

        {expanded ? (
          <div className="mt-4 space-y-4 border-t border-white/[0.04] pt-4 animate-fade-in">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Why this matters
              </p>
              <p className="mt-1 text-sm text-gray-300">
                {recommendation.whyItMatters}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Estimated impact</p>
                <p className="font-medium text-accent-light">
                  {recommendation.estimatedImpact}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Confidence</p>
                <p className="font-medium text-gray-200">
                  {recommendation.confidenceScore}%
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={recommendation.actionRoute}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent-dark"
          >
            {recommendation.actionLabel}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          {recommendation.learnMoreRoute ? (
            <Link
              href={recommendation.learnMoreRoute}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-gray-300 transition-all hover:border-accent/40 hover:text-accent-light"
            >
              Learn more
            </Link>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            disabled={isPending}
            onClick={handleComplete}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Mark complete
          </Button>
          {recommendation.dismissible ? (
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={handleDismiss}
            >
              <X className="h-3.5 w-3.5" />
              Dismiss
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
