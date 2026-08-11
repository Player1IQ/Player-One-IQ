"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { getCreatorContentPlanAction } from "@/lib/creator-ai/plan-actions";
import type { CreatorContentPlan } from "@/lib/creator-ai/plan-types";
import { ContentPlanCard } from "./ContentPlanCard";

interface ContentPlanMessageProps {
  planId: string;
  mode?: "live" | "demo" | null;
}

export function ContentPlanMessage({
  planId,
  mode,
}: ContentPlanMessageProps) {
  const [plan, setPlan] = useState<CreatorContentPlan | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getCreatorContentPlanAction(planId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setPlan(result.plan);
    });
  }, [planId]);

  if (isPending && !plan) {
    return (
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading plan…
      </div>
    );
  }

  if (error) {
    return <p className="mt-2 text-xs text-red-400">{error}</p>;
  }

  if (!plan) {
    return null;
  }

  return (
    <ContentPlanCard
      plan={plan}
      mode={mode}
      onActivated={(updated) => setPlan(updated)}
    />
  );
}
