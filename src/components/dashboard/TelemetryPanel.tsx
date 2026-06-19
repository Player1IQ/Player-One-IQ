"use client";

import { useState } from "react";
import { ChevronDown, Gauge } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type TelemetryMetric = {
  title: string;
  value: string;
  subtitle?: string;
  href?: string;
  icon: LucideIcon;
  iconColor?: string;
  highlight?: boolean;
};

interface TelemetryPanelProps {
  metrics: TelemetryMetric[];
}

export function TelemetryPanel({ metrics }: TelemetryPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-raised/50 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20">
            <Gauge className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
              Additional metrics
            </p>
            <p className="text-sm font-medium text-gray-200">
              {open ? "Hide secondary metrics" : "Show secondary metrics"}
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-gray-500 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <div className="grid gap-4 border-t border-white/[0.06] p-5 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} className="bg-black/15" />
          ))}
        </div>
      ) : null}
    </div>
  );
}
