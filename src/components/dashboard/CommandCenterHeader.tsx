"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandCenterHeaderProps {
  organizationName: string;
  attentionCount: number;
}

function formatCommandTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatCommandDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CommandCenterHeader({
  organizationName,
  attentionCount,
}: CommandCenterHeaderProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const needsAttention = attentionCount > 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-surface-raised/90 p-5 backdrop-blur-md sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-gray-500">
            Dashboard
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {organizationName}
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Executive overview of your creator ecosystem
          </p>
        </div>

        <div className="flex flex-wrap items-stretch gap-3 lg:justify-end">
          <div className="rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 font-mono">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">
              Local time
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-white">
              {now ? formatCommandTime(now) : "--:--:--"}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {now ? formatCommandDate(now) : "\u00A0"}
            </p>
          </div>

          <div
            className={cn(
              "flex min-w-[140px] flex-col justify-center rounded-xl border px-4 py-3",
              needsAttention
                ? "border-amber-500/30 bg-amber-500/10"
                : "border-emerald-500/25 bg-emerald-500/10"
            )}
          >
            <div className="flex items-center gap-2">
              <Radio
                className={cn(
                  "h-4 w-4",
                  needsAttention ? "text-amber-400" : "text-emerald-400"
                )}
              />
              <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                Status
              </p>
            </div>
            <p
              className={cn(
                "mt-1 text-sm font-semibold",
                needsAttention ? "text-amber-100" : "text-emerald-100"
              )}
            >
              {needsAttention ? "Action needed" : "All clear"}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {needsAttention
                ? `${attentionCount} item${attentionCount === 1 ? "" : "s"} need attention`
                : "Nothing outstanding"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
