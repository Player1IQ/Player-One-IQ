"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { ContentPlanPayload } from "@/lib/creator-ai/plan-types";

interface ContentPlanPreviewProps {
  plan: ContentPlanPayload;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  video: "Video",
  stream: "Stream",
  clip: "Clip",
  post: "Post",
  reel: "Reel",
};

export function ContentPlanPreview({ plan }: ContentPlanPreviewProps) {
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);
  const weeks = plan.weeks;

  const activeWeek = useMemo(
    () => weeks[activeWeekIndex] ?? weeks[0],
    [weeks, activeWeekIndex]
  );

  if (weeks.length === 0) {
    return (
      <p className="text-xs text-gray-500">No plan items were generated.</p>
    );
  }

  return (
    <div className="space-y-3">
      {weeks.length > 1 ? (
        <div className="flex flex-wrap gap-1.5">
          {weeks.map((week, index) => (
            <button
              key={week.weekStart}
              type="button"
              onClick={() => setActiveWeekIndex(index)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                index === activeWeekIndex
                  ? "border-accent/40 bg-accent/10 text-accent-light"
                  : "border-white/[0.08] bg-white/[0.02] text-gray-400 hover:text-gray-200"
              )}
            >
              {week.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
          {activeWeek?.label}
        </p>
      )}

      <ul className="space-y-2">
        {activeWeek?.items.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-xs font-medium text-white">{item.date}</span>
              <span className="text-[11px] text-gray-500">{item.dayOfWeek}</span>
              {item.suggestedTime ? (
                <span className="text-[11px] text-gray-500">{item.suggestedTime}</span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-gray-200">{item.topic}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-gray-300">
                {item.platform}
              </span>
              <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent-light">
                {CONTENT_TYPE_LABELS[item.contentType] ?? item.contentType}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              {item.rationale}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
