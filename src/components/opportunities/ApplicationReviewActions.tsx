"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, Loader2, X } from "lucide-react";
import {
  acceptApplication,
  markApplicationUnderReview,
  rejectApplication,
} from "@/app/opportunities/actions";
import type { ApplicationStatus } from "@/lib/opportunities";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ApplicationReviewActionsProps {
  applicationId: string;
  status: ApplicationStatus;
  size?: "sm" | "md";
  className?: string;
  onError?: (message: string) => void;
}

export function ApplicationReviewActions({
  applicationId,
  status,
  size = "md",
  className,
  onError,
}: ApplicationReviewActionsProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<
    "review" | "accept" | "reject" | null
  >(null);

  const actionable = status === "applied" || status === "under_review";

  async function runAction(action: "review" | "accept" | "reject") {
    setLoadingAction(action);
    const result =
      action === "accept"
        ? await acceptApplication(applicationId)
        : action === "reject"
          ? await rejectApplication(applicationId)
          : await markApplicationUnderReview(applicationId);

    setLoadingAction(null);

    if ("error" in result && result.error) {
      onError?.(result.error);
      return;
    }

    if (action === "accept" && "contractId" in result && result.contractId) {
      router.push(`/contracts/${result.contractId}`);
      router.refresh();
      return;
    }

    router.refresh();
  }

  if (!actionable) return null;

  const compact = size === "sm";

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {status === "applied" && (
        <Button
          type="button"
          variant="secondary"
          size={compact ? "sm" : "md"}
          disabled={loadingAction !== null}
          onClick={() => runAction("review")}
        >
          {loadingAction === "review" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
          Review
        </Button>
      )}
      <Button
        type="button"
        size={compact ? "sm" : "md"}
        className="bg-emerald-600 hover:bg-emerald-500"
        disabled={loadingAction !== null}
        onClick={() => runAction("accept")}
      >
        {loadingAction === "accept" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        Accept
      </Button>
      <Button
        type="button"
        variant="secondary"
        size={compact ? "sm" : "md"}
        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        disabled={loadingAction !== null}
        onClick={() => runAction("reject")}
      >
        {loadingAction === "reject" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <X className="h-3.5 w-3.5" />
        )}
        Reject
      </Button>
    </div>
  );
}
